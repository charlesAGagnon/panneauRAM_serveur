/**
 * @file     mqtt2.js
 * @author  charles-Antoine Gagnon
 * @version  1
 * @date     10/11/2025
 * @brief    Gestionnaire MQTT pour Raspberry Pi 2
 */

const mqtt = require('mqtt');

// Connexion au broker MQTT
const client = mqtt.connect('mqtt://localhost:1883');

// Topics de lecture pour Pi 2 (à remplir avec vos topics spécifiques)
const topics = [
    // Exemple: 'pi2/temperature',
    // Exemple: 'pi2/humidity',
    // Exemple: 'pi2/status',
];

// Topic d'écriture pour Pi 2
const WRITE_TOPIC = 'pi/write2';

let io = null;

// Données actuelles pour Pi 2
const currentData = {
    // Les données seront ajoutées dynamiquement selon les topics
};

client.on('connect', function ()
{
    console.log('Pi 2 - Connecté au broker MQTT');

    // S'abonner à tous les topics de lecture
    topics.forEach(topic =>
    {
        client.subscribe(topic, function (err)
        {
            if (err)
            {
                console.error(`Pi 2 - Erreur lors de l'abonnement au topic ${topic}:`, err);
            }
            else
            {
                console.log(`Pi 2 - Abonné au topic: ${topic}`);
            }
        });
    });
});

client.on('message', function (topic, message)
{
    const value = message.toString();
    const key = topic.replace('pi2/', ''); // Extraire le nom après pi2/

    console.log(`Pi 2 - Message reçu - Topic: ${topic}, Valeur: ${value}`);

    // Mettre à jour les données
    currentData[key] = value;

    // Émettre via Socket.IO si disponible (seulement à la room pi2)
    if (io)
    {
        io.to('pi2').emit('mqtt-data-pi2',
        {
            topic: topic,
            key: key,
            value: value,
            timestamp: new Date().toISOString()
        });
    }
});

client.on('error', function (error)
{
    console.error('Pi 2 - Erreur MQTT:', error);
});

// Fonction pour publier un message vers pi/write2
function publish(message)
{
    return new Promise((resolve, reject) =>
    {
        client.publish(WRITE_TOPIC, message, function (err)
        {
            if (err)
            {
                console.error(`Pi 2 - Erreur lors de la publication sur ${WRITE_TOPIC}:`, err);
                reject(err);
            }
            else
            {
                console.log(`Pi 2 - Message publié sur ${WRITE_TOPIC}: ${message}`);
                resolve();
            }
        });
    });
}

// Fonction pour initialiser Socket.IO
function initializeSocketIO(socketIO)
{
    io = socketIO;

    io.on('connection', (socket) =>
    {
        console.log('Pi 2 - Nouvelle connexion Socket.IO:', socket.id);

        // Rejoindre la room pi2
        socket.on('join-pi2', () =>
        {
            socket.join('pi2');
            console.log(`Pi 2 - Socket ${socket.id} a rejoint la room pi2`);

            // Envoyer les données initiales
            socket.emit('mqtt-initial-data-pi2', currentData);
        });

        // Gérer les commandes d'écriture
        socket.on('mqtt-command-pi2', (data) =>
        {
            console.log('Pi 2 - Commande reçue:', data);
            if (data.message)
            {
                publish(data.message).catch(err =>
                {
                    socket.emit('mqtt-error-pi2',
                    {
                        error: err.message
                    });
                });
            }
        });

        // Quitter la room lors de la déconnexion
        socket.on('disconnect', () =>
        {
            console.log('Pi 2 - Déconnexion Socket.IO:', socket.id);
        });
    });
}

// Obtenir les données actuelles
function getCurrentData()
{
    return currentData;
}

// Obtenir les topics
function getTopics()
{
    return topics;
}

// Obtenir le topic d'écriture
function getWriteTopic()
{
    return WRITE_TOPIC;
}

module.exports = {
    client,
    publish,
    initializeSocketIO,
    getCurrentData,
    getTopics,
    getWriteTopic
};
