/**
 * @file     mqtt2.js
 * @author  charles-Antoine Gagnon
 * @version  1
 * @date     10/11/2025
 * @brief    Gestionnaire MQTT pour Raspberry Pi 2
 */

const mqtt = require('mqtt');
const journalModel = require('./journal');

// Connexion au broker MQTT
const client = mqtt.connect('mqtt://172.17.15.195:1883');
//const client = mqtt.connect('mqtt://localhost:1883');
// Topics de lecture pour Pi 2 - Mélangeur (états)
const topics = [
    'RAM/melangeur/etats/recetteStatut',
    'RAM/melangeur/etats/motA',
    'RAM/melangeur/etats/motB',
    'RAM/melangeur/etats/motC',
    'RAM/melangeur/etats/mode'
];

// Topics de commandes (écriture)
const CMD_TOPICS = {
    mode: 'RAM/melangeur/cmd/mode',
    motA: 'RAM/melangeur/cmd/motA',
    motB: 'RAM/melangeur/cmd/motB',
    motC: 'RAM/melangeur/cmd/motC',
    recette: 'RAM/melangeur/cmd/recette',
    recetteGo: 'RAM/melangeur/cmd/recetteGo'
};

let io = null;

// Données actuelles pour Pi 2 - Mélangeur (états reçus)
const currentData = {
    recetteStatut: 'FINISHED',
    motA: 'off',
    motB: 'off',
    motC: 'off',
    mode: 'auto'
};

// Dernières commandes envoyées (consignes)
const lastCommands = {
    mode: 'auto',
    motA: 'off',
    motB: 'off',
    motC: 'off',
    recette: '',
    recetteGo: '0'
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
    // Extraire le nom après RAM/melangeur/etats/
    const key = topic.split('/').pop();

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

// Fonction pour publier un message vers un topic spécifique
function publish(topic, message)
{
    return new Promise((resolve, reject) =>
    {
        client.publish(topic, message, function (err)
        {
            if (err)
            {
                console.error(`Pi 2 - Erreur lors de la publication sur ${topic}:`, err);
                reject(err);
            }
            else
            {
                console.log(`Pi 2 - Message publié sur ${topic}: ${message}`);

                // Sauvegarder la commande envoyée
                if (topic.includes('/cmd/'))
                {
                    const key = topic.split('/').pop(); // Ex: mode, motA, motB, motC, recette, recetteGo
                    lastCommands[key] = message.toString();
                    console.log(`Pi 2 - Consigne sauvegardée: ${key} = ${lastCommands[key]}`);
                }

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

            // Envoyer les données initiales (états) et les dernières commandes (consignes)
            socket.emit('mqtt-initial-data-pi2', currentData);
            socket.emit('mqtt-initial-commands-pi2', lastCommands);
        });

        // Gérer les commandes - Mode
        socket.on('mqtt-command-pi2-mode', (data) =>
        {
            console.log('Pi 2 - Commande mode reçue:', data.value);
            if (data.user)
            {
                journalModel.logCommand(data.user, 'mode', data.value.toString());
            }
            publish(CMD_TOPICS.mode, data.value).catch(err =>
            {
                socket.emit('mqtt-error-pi2',
                {
                    error: err.message
                });
            });
        });

        // Gérer les commandes - Moteurs
        socket.on('mqtt-command-pi2-motor', (data) =>
        {
            console.log(`Pi 2 - Commande moteur ${data.motor} reçue:`, data.value);
            const topic = CMD_TOPICS[data.motor];
            if (topic)
            {
                publish(topic, data.value).catch(err =>
                {
                    socket.emit('mqtt-error-pi2',
                    {
                        error: err.message
                    });
                });
            }
        });

        // Gérer les commandes - Recette
        socket.on('mqtt-command-pi2-recette', (data) =>
        {
            console.log('Pi 2 - Commande recette reçue:', data.value);
            if (data.user)
            {
                journalModel.logCommand(data.user, 'recette', data.value.toString());
            }
            publish(CMD_TOPICS.recette, data.value).catch(err =>
            {
                socket.emit('mqtt-error-pi2',
                {
                    error: err.message
                });
            });
        });

        // Gérer les commandes - RecetteGo
        socket.on('mqtt-command-pi2-recetteGo', (data) =>
        {
            console.log('Pi 2 - Commande recetteGo reçue:', data.value);
            if (data.user)
            {
                journalModel.logCommand(data.user, 'recetteGo', data.value.toString());
            }
            publish(CMD_TOPICS.recetteGo, data.value).catch(err =>
            {
                socket.emit('mqtt-error-pi2',
                {
                    error: err.message
                });
            });
        });

        // Quitter la room lors de la déconnexion
        socket.on('disconnect', () =>
        {
            console.log('Pi 2 - Déconnexion Socket.IO:', socket.id);
        });
    });
}

// Obtenir les données actuelles (états)
function getCurrentData()
{
    return currentData;
}

// Obtenir les dernières commandes (consignes)
function getLastCommands()
{
    return lastCommands;
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
    getLastCommands,
    getTopics,
    getCmdTopics
};
