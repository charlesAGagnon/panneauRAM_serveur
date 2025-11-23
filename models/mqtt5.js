/**
 * @file     mqtt5.js
 * @author  charles-Antoine Gagnon
 * @version  1
 * @date     10/11/2025
 * @brief    Gestionnaire MQTT pour Raspberry Pi 5 - Valves
 */

const mqtt = require('mqtt');

// Connexion au broker MQTT
//const client = mqtt.connect('mqtt://172.17.15.91:1883');
const client = mqtt.connect('mqtt://localhost:1883');
// Topics de lecture pour Pi 5 - Valves (états)
const topics = [
    'RAM/valves/etats/Ouverture_PB',
    'RAM/valves/etats/Ouverture_GB'
];

let io = null;

// Données actuelles pour Pi 5 - Valves
const currentData = {
    Ouverture_PB: 0,
    Ouverture_GB: 0
};

client.on('connect', function ()
{
    console.log('Pi 5 - Connecté au broker MQTT');

    // S'abonner à tous les topics de lecture
    topics.forEach(topic =>
    {
        client.subscribe(topic, function (err)
        {
            if (err)
            {
                console.error(`Pi 5 - Erreur lors de l'abonnement au topic ${topic}:`, err);
            }
            else
            {
                console.log(`Pi 5 - Abonné au topic: ${topic}`);
            }
        });
    });
});

client.on('message', function (topic, message)
{
    const value = message.toString();
    // Extraire le nom après RAM/valves/etats/
    const key = topic.split('/').pop();

    console.log(`Pi 5 - Message reçu - Topic: ${topic}, Valeur: ${value}`);

    // Mettre à jour les données (convertir en entier et limiter 0-100)
    let intValue = parseInt(value);
    if (isNaN(intValue)) intValue = 0;
    if (intValue < 0) intValue = 0;
    if (intValue > 100) intValue = 100;

    currentData[key] = intValue;

    // Envoyer la mise à jour via Socket.IO si disponible
    if (io)
    {
        const timestamp = new Date().toLocaleString('fr-CA');
        io.to('pi5').emit('mqtt-data-pi5',
        {
            key: key,
            value: intValue,
            timestamp: timestamp
        });
    }
});

client.on('error', function (error)
{
    console.error('Pi 5 - Erreur MQTT:', error);
});

// Pi 5 est en LECTURE SEULE - pas de fonction publish

// Fonction pour initialiser Socket.IO
function initializeSocketIO(socketIO)
{
    io = socketIO;

    // Écouter les connexions Socket.IO pour Pi 5
    io.on('connection', (socket) =>
    {
        // Gestion de la room pi5
        socket.on('join-pi5', () =>
        {
            socket.join('pi5');
            console.log(`Client ${socket.id} a rejoint la room pi5`);

            // Envoyer les données actuelles
            socket.emit('mqtt-initial-data-pi5', currentData);
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
