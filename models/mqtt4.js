/**
 * @file     mqtt4.js
 * @author  charles-Antoine Gagnon
 * @version  1
 * @date     10/11/2025
 * @brief    Gestionnaire MQTT pour Raspberry Pi 4 - Aspirateur
 */

const mqtt = require('mqtt');

// Connexion au broker MQTT
const client = mqtt.connect('mqtt://172.17.15.184:1883');

// Topics de lecture pour Pi 4 - Aspirateur (états)
const topics = [
    'RAM/aspirateur/etats/sequence',
    'RAM/aspirateur/etats/NivA',
    'RAM/aspirateur/etats/NivB',
    'RAM/aspirateur/etats/NivC'
];

// Topics de commandes (écriture)
const CMD_TOPICS = {
    force: 'RAM/aspirateur/cmd/force'
};

let io = null;

// Données actuelles pour Pi 4 - Aspirateur
const currentData = {
    sequence: 'FINISHED',
    NivA: 0,
    NivB: 0,
    NivC: 0
};

client.on('connect', function ()
{
    console.log('Pi 4 - Connecté au broker MQTT');

    // S'abonner à tous les topics de lecture
    topics.forEach(topic =>
    {
        client.subscribe(topic, function (err)
        {
            if (err)
            {
                console.error(`Pi 4 - Erreur lors de l'abonnement au topic ${topic}:`, err);
            }
            else
            {
                console.log(`Pi 4 - Abonné au topic: ${topic}`);
            }
        });
    });
});

client.on('message', function (topic, message)
{
    const value = message.toString();
    // Extraire le nom après RAM/aspirateur/etats/
    const key = topic.split('/').pop();

    console.log(`Pi 4 - Message reçu - Topic: ${topic}, Valeur: ${value}`);

    // Mettre à jour les données (convertir en int pour les niveaux)
    if (key === 'NivA' || key === 'NivB' || key === 'NivC')
    {
        currentData[key] = parseInt(value);
    }
    else
    {
        currentData[key] = value;
    }

    // Émettre via Socket.IO si disponible (seulement à la room pi4)
    if (io)
    {
        io.to('pi4').emit('mqtt-data-pi4',
        {
            topic: topic,
            key: key,
            value: currentData[key],
            timestamp: new Date().toISOString()
        });
    }
});

client.on('error', function (error)
{
    console.error('Pi 4 - Erreur MQTT:', error);
});

// Fonction pour publier un message vers un topic spécifique
function publish(topic, message)
{
    return new Promise((resolve, reject) =>
    {
        client.publish(topic, message, function (err)
        {
            if (err)
            {
                console.error(`Pi 4 - Erreur lors de la publication sur ${topic}:`, err);
                reject(err);
            }
            else
            {
                console.log(`Pi 4 - Message publié sur ${topic}: ${message}`);
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
        console.log('Pi 4 - Nouvelle connexion Socket.IO:', socket.id);

        // Rejoindre la room pi4
        socket.on('join-pi4', () =>
        {
            socket.join('pi4');
            console.log(`Pi 4 - Socket ${socket.id} a rejoint la room pi4`);

            // Envoyer les données initiales
            socket.emit('mqtt-initial-data-pi4', currentData);
        });

        // Gérer les commandes - Force (GO/STOP)
        socket.on('mqtt-command-pi4-force', (data) =>
        {
            console.log('Pi 4 - Commande force reçue:', data.value);
            publish(CMD_TOPICS.force, data.value).catch(err =>
            {
                socket.emit('mqtt-error-pi4',
                {
                    error: err.message
                });
            });
        });

        // Quitter la room lors de la déconnexion
        socket.on('disconnect', () =>
        {
            console.log('Pi 4 - Déconnexion Socket.IO:', socket.id);
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

// Obtenir les topics de commandes
function getCmdTopics()
{
    return CMD_TOPICS;
}

module.exports = {
    client,
    publish,
    initializeSocketIO,
    getCurrentData,
    getTopics,
    getCmdTopics
};
