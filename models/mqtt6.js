/**
 * @file     mqtt6.js
 * @author  charles-Antoine Gagnon
 * @version  1
 * @date     10/11/2025
 * @brief    Gestionnaire MQTT pour Raspberry Pi 6
 */

const mqtt = require('mqtt');

// Connexion au broker MQTT
const client = mqtt.connect('mqtt://172.17.15.184:1883');

const topics = [];

// Topic d'écriture pour Pi 6
const WRITE_TOPIC = 'pi/write6';

let io = null;

// Données actuelles pour Pi 6
const currentData = {
    // Les données seront ajoutées dynamiquement selon les topics
};

client.on('connect', function ()
{
    console.log('Pi 6 - Connecté au broker MQTT');

    // S'abonner à tous les topics de lecture
    topics.forEach(topic =>
    {
        client.subscribe(topic, function (err)
        {
            if (err)
            {
                console.error(`Pi 6 - Erreur lors de l'abonnement au topic ${topic}:`, err);
            }
            else
            {
                console.log(`Pi 6 - Abonné au topic: ${topic}`);
            }
        });
    });
});

client.on('message', function (topic, message)
{
    const value = message.toString();
    const key = topic.replace('pi6/', ''); // Extraire le nom après pi6/

    console.log(`Pi 6 - Message reçu - Topic: ${topic}, Valeur: ${value}`);

    // Mettre à jour les données
    currentData[key] = value;

    // Émettre via Socket.IO si disponible (seulement à la room pi6)
    if (io)
    {
        io.to('pi6').emit('mqtt-data-pi6',
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
    console.error('Pi 6 - Erreur MQTT:', error);
});

// Fonction pour publier un message vers pi/write6
function publish(message)
{
    return new Promise((resolve, reject) =>
    {
        client.publish(WRITE_TOPIC, message, function (err)
        {
            if (err)
            {
                console.error(`Pi 6 - Erreur lors de la publication sur ${WRITE_TOPIC}:`, err);
                reject(err);
            }
            else
            {
                console.log(`Pi 6 - Message publié sur ${WRITE_TOPIC}: ${message}`);
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
        console.log('Pi 6 - Nouvelle connexion Socket.IO:', socket.id);

        // Rejoindre la room pi6
        socket.on('join-pi6', () =>
        {
            socket.join('pi6');
            console.log(`Pi 6 - Socket ${socket.id} a rejoint la room pi6`);

            // Envoyer les données initiales
            socket.emit('mqtt-initial-data-pi6', currentData);
        });

        // Gérer les commandes d'écriture
        socket.on('mqtt-command-pi6', (data) =>
        {
            console.log('Pi 6 - Commande reçue:', data);
            if (data.message)
            {
                publish(data.message).catch(err =>
                {
                    socket.emit('mqtt-error-pi6',
                    {
                        error: err.message
                    });
                });
            }
        });

        // Quitter la room lors de la déconnexion
        socket.on('disconnect', () =>
        {
            console.log('Pi 6 - Déconnexion Socket.IO:', socket.id);
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
