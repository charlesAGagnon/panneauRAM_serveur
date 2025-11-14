/**
 * @file     mqtt3.js
 * @author  charles-Antoine Gagnon
 * @version  1
 * @date     10/11/2025
 * @brief    Gestionnaire MQTT pour Raspberry Pi 3
 */

const mqtt = require('mqtt');

// Connexion au broker MQTT
const client = mqtt.connect('mqtt://172.17.15.184:1883');

// Topics de lecture pour Pi 3 - Power Meter
const topics = [
    'RAM/powermeter/etats/Van',
    'RAM/powermeter/etats/Vbn',
    'RAM/powermeter/etats/Vab',
    'RAM/powermeter/etats/Ia',
    'RAM/powermeter/etats/Ib',
    'RAM/powermeter/etats/KW',
    'RAM/powermeter/etats/KWh',
    'RAM/powermeter/etats/FP'
];

let io = null;

// Données actuelles pour Pi 3 - Power Meter
const currentData = {
    Van: 0.0,
    Vbn: 0.0,
    Vab: 0.0,
    Ia: 0.0,
    Ib: 0.0,
    KW: 0.0,
    KWh: 0.0,
    FP: 0.0
};

client.on('connect', function ()
{
    console.log('Pi 3 - Connecté au broker MQTT');

    // S'abonner à tous les topics de lecture
    topics.forEach(topic =>
    {
        client.subscribe(topic, function (err)
        {
            if (err)
            {
                console.error(`Pi 3 - Erreur lors de l'abonnement au topic ${topic}:`, err);
            }
            else
            {
                console.log(`Pi 3 - Abonné au topic: ${topic}`);
            }
        });
    });
});

client.on('message', function (topic, message)
{
    const value = message.toString();
    // Extraire le nom après RAM/powermeter/etats/
    const key = topic.split('/').pop();

    console.log(`Pi 3 - Message reçu - Topic: ${topic}, Valeur: ${value}`);

    // Mettre à jour les données (convertir en float)
    currentData[key] = parseFloat(value);

    // Limiter FP à 100% maximum
    if (key === 'FP' && currentData[key] > 100)
    {
        currentData[key] = 100.0;
    }

    // Émettre via Socket.IO si disponible (seulement à la room pi3)
    if (io)
    {
        io.to('pi3').emit('mqtt-data-pi3',
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
    console.error('Pi 3 - Erreur MQTT:', error);
});

// Pi 3 est en LECTURE SEULE - pas de fonction publish

// Fonction pour initialiser Socket.IO
function initializeSocketIO(socketIO)
{
    io = socketIO;

    io.on('connection', (socket) =>
    {
        console.log('Pi 3 - Nouvelle connexion Socket.IO:', socket.id);

        // Rejoindre la room pi3
        socket.on('join-pi3', () =>
        {
            socket.join('pi3');
            console.log(`Pi 3 - Socket ${socket.id} a rejoint la room pi3`);

            // Envoyer les données initiales
            socket.emit('mqtt-initial-data-pi3', currentData);
        });

        // Pi 3 est en LECTURE SEULE - pas de commandes

        // Quitter la room lors de la déconnexion
        socket.on('disconnect', () =>
        {
            console.log('Pi 3 - Déconnexion Socket.IO:', socket.id);
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

module.exports = {
    client,
    initializeSocketIO,
    getCurrentData,
    getTopics
};
