/**
 * @file     mqtt1.js
 * @author  charles-Antoine Gagnon
 * @version  1
 * @date     10/11/2025
 * @brief    Gestionnaire MQTT pour Raspberry Pi 1
 */

const mqtt = require('mqtt');

// Connexion au broker MQTT
const client = mqtt.connect('mqtt://172.17.15.91:1883');

// Topics de lecture pour Pi 1 - Balance
const topics = [
    'RAM/balance/etats/poids',
    'RAM/balance/etats/tare',
    'RAM/balance/etats/unite'
];


let io = null;

// Données actuelles pour Pi 1 - Balance
const currentData = {
    poids: 0.0,
    tare: 0.0,
    unite: 'kg'
};

client.on('connect', function ()
{
    console.log('Pi 1 - Connecté au broker MQTT');

    // S'abonner à tous les topics de lecture
    topics.forEach(topic =>
    {
        client.subscribe(topic, function (err)
        {
            if (err)
            {
                console.error(`Pi 1 - Erreur lors de l'abonnement au topic ${topic}:`, err);
            }
            else
            {
                console.log(`Pi 1 - Abonné au topic: ${topic}`);
            }
        });
    });
});

client.on('message', function (topic, message)
{
    const value = message.toString();
    // Extraire le nom après RAM/balance/etats/
    const key = topic.split('/').pop();

    console.log(`Pi 1 - Message reçu - Topic: ${topic}, Valeur: ${value}`);

    // Mettre à jour les données (convertir en float si c'est poids ou tare)
    if (key === 'poids' || key === 'tare')
    {
        currentData[key] = parseFloat(value);
    }
    else
    {
        currentData[key] = value;
    }

    // Émettre via Socket.IO si disponible (seulement à la room pi1)
    if (io)
    {
        io.to('pi1').emit('mqtt-data-pi1',
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
    console.error('Pi 1 - Erreur MQTT:', error);
});

// Fonction pour publier un message vers pi/write1
function publish(message)
{
    return new Promise((resolve, reject) =>
    {
        client.publish(WRITE_TOPIC, message, function (err)
        {
            if (err)
            {
                console.error(`Pi 1 - Erreur lors de la publication sur ${WRITE_TOPIC}:`, err);
                reject(err);
            }
            else
            {
                console.log(`Pi 1 - Message publié sur ${WRITE_TOPIC}: ${message}`);
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
        console.log('Pi 1 - Nouvelle connexion Socket.IO:');

        // Rejoindre la room pi1
        socket.on('join-pi1', () =>
        {
            socket.join('pi1');
            console.log(`Pi 1 - Socket ${socket.id} a rejoint la room pi1`);

            // Envoyer les données initiales
            socket.emit('mqtt-initial-data-pi1', currentData);
        });

        // Gérer les commandes d'écriture
        socket.on('mqtt-command-pi1', (data) =>
        {
            console.log('Pi 1 - Commande reçue:', data);
            if (data.message)
            {
                publish(data.message).catch(err =>
                {
                    socket.emit('mqtt-error-pi1',
                    {
                        error: err.message
                    });
                });
            }
        });

        // Quitter la room lors de la déconnexion
        socket.on('disconnect', () =>
        {
            console.log('Pi 1 - Déconnexion Socket.IO:', socket.id);
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
