/**
 * @file     mqtt.js
 * @author  charles-Antoine Gagnon
 * @version  1
 * @date     10/11/2025
 * @brief    Gestionnaire MQTT pour les capteurs Raspberry Pi
 */

const mqtt = require('mqtt');

// Connexion au broker MQTT
const client = mqtt.connect('mqtt://localhost:1883');

const topics = [
    'RAM/panneau/etats/NivGB',
    'RAM/panneau/etats/NivPB',
    'RAM/panneau/etats/TmpPB',
    'RAM/panneau/etats/ValveGB',
    'RAM/panneau/etats/ValvePB',
    'RAM/panneau/etats/ValveEC',
    'RAM/panneau/etats/ValveEF',
    'RAM/panneau/etats/ValveEEC',
    'RAM/panneau/etats/ValveEEF',
    'RAM/panneau/etats/Pompe',
    'RAM/panneau/etats/Mode'
];

let io = null;

// Données actuelles
const currentData = {
    NivGB: 0,
    NivPB: 0,
    TmpPB: 0,
    ValveGB: 0,
    ValvePB: 0,
    ValveEC: 0,
    ValveEF: 0,
    ValveEEC: 'off',
    ValveEEF: 'off',
    Pompe: 'off',
    Mode: 'auto'
};

client.on('connect', function ()
{
    console.log('Connecté au broker MQTT');

    // S'abonner à tous les topics
    topics.forEach(topic =>
    {
        client.subscribe(topic, function (err)
        {
            if (!err)
            {
                console.log(`Abonné au topic: ${topic}`);
            }
            else
            {
                console.error(`Erreur d'abonnement au topic ${topic}:`, err);
            }
        });
    });
});

client.on('message', function (topic, message)
{
    const value = message.toString();
    const key = topic.split('/').pop(); // Extraire le nom du capteur

    console.log(`Message reçu - Topic: ${topic}, Valeur: ${value}`);

    if (key === 'NivGB' || key === 'NivPB' || key === 'TmpPB' || key === 'ValveGB' || key === 'ValvePB' || key === 'ValveEC' || key === 'ValveEF')
    {
        const num = parseFloat(value);
        let final = value;
        if (!isNaN(num))
        {
            final = Math.max(0, Math.min(100, num));
            if (final !== num)
            {
                console.warn(`NivGB hors limites (${num}) — clamp à ${final}`);
            }
        }
        currentData[key] = final;
        if (io)
        {
            io.emit('mqtt-data',
            {
                topic,
                key,
                value: currentData[key],
                timestamp: new Date().toISOString()
            });
        }
        return;
    }
    // Mettre à jour les données
    currentData[key] = isNaN(value) ? value : parseFloat(value);

    // Émettre via Socket.IO si disponible
    if (io)
    {
        io.emit('mqtt-data',
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
    console.error('Erreur MQTT:', error);
});

// Fonction pour publier un message
function publish(topic, message)
{
    return new Promise((resolve, reject) =>
    {
        client.publish(topic, message.toString(), function (err)
        {
            if (err)
            {
                reject(err);
            }
            else
            {
                console.log(`Message publié - Topic: ${topic}, Message: ${message}`);
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
        console.log('Client Socket.IO connecté:', socket.id);

        // Envoyer les données actuelles au nouveau client
        socket.emit('mqtt-initial-data', currentData);

        // Écouter les commandes du client
        socket.on('mqtt-command', async (data) =>
        {
            try
            {
                await publish(data.topic, data.value);
                socket.emit('mqtt-command-success',
                {
                    topic: data.topic
                });
            }
            catch (error)
            {
                socket.emit('mqtt-command-error',
                {
                    topic: data.topic,
                    error: error.message
                });
            }
        });

        socket.on('disconnect', () =>
        {
            console.log('Client Socket.IO déconnecté:', socket.id);
        });
    });
}

// Obtenir les données actuelles
function getCurrentData()
{
    return currentData;
}

module.exports = {
    client,
    publish,
    initializeSocketIO,
    getCurrentData
};
