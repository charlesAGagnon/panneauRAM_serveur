/**
 * @file     mqtt6.js
 * @author   charles-Antoine Gagnon
 * @version  3
 * @date     23/11/2025
 * @brief    Gestionnaire MQTT pour les Alarmes et Réactions Automatiques
 */

const mqtt = require('mqtt');
const journalModel = require('./journal');

// Connexion au broker MQTT
//const client = mqtt.connect('mqtt://172.17.15.91:1883');
const client = mqtt.connect('mqtt://localhost:1883');

// Topics d'alarmes (Lecture des états d'alarme)
const ALARM_TOPICS = [
    'RAM/alarmes/etats/ALR_GB_OVF',
    'RAM/alarmes/etats/ALR_GB_NIV_MAX',
    'RAM/alarmes/etats/ALR_PB_OVF',
    'RAM/alarmes/etats/ALR_PB_NIV_MAX',
    'RAM/alarmes/etats/ALR_CNX_BAL',
    'RAM/alarmes/etats/ALR_CNX_POW'
];

// Topics de mesures (Lecture pour calculer les réactions - états actuels)
const MEASURE_TOPICS = [
    'RAM/panneau/etats/NivGB',
    'RAM/panneau/etats/NivPB'
];

// Topics de configuration des seuils (Écriture par UI niveau 2-3)
const CONFIG_TOPICS = [
    'RAM/alarmes/cmd/NivLhGB',
    'RAM/alarmes/cmd/TgNivGB',
    'RAM/alarmes/cmd/TrNivGB',
    'RAM/alarmes/cmd/NivLhPB',
    'RAM/alarmes/cmd/TgNivPB',
    'RAM/alarmes/cmd/TrNivPB'
];

// Tous les topics à écouter
const ALL_TOPICS = [...ALARM_TOPICS, ...MEASURE_TOPICS, ...CONFIG_TOPICS];

let io = null;

// État du système
const systemState = {
    alarms:
    {}, // État des alarmes (key: alarme, value: 'ON' ou 'OFF')
    measures:
    {}, // Dernières mesures connues (NivGB, NivPB)
    config:
    {} // Configuration des seuils (NivLhGB, TgNivGB, etc.)
};

// Constante de réduction (10% - modifiable)
const REDUCTION_PERCENT = 0.10;

client.on('connect', function ()
{
    console.log('Alarm Controller (Pi 6) - Connecté au broker MQTT');

    // S'abonner à tous les topics
    ALL_TOPICS.forEach(topic =>
    {
        client.subscribe(topic, function (err)
        {
            if (err)
            {
                console.error(`Erreur abonnement ${topic}:`, err);
            }
            else
            {
                console.log(`Abonné: ${topic}`);
            }
        });
    });
});

client.on('message', function (topic, message)
{
    const valueStr = message.toString();
    const topicParts = topic.split('/');
    const key = topicParts[topicParts.length - 1]; // Ex: ALR_GB_OVF, NivGB

    console.log(`[DEBUG] Pi 6 Reçu - Topic: ${topic}, Valeur: ${valueStr}`);

    // Mise à jour de l'état local
    if (topic.includes('/panneau/etats/'))
    {
        // Mesures des niveaux actuels
        const numValue = parseFloat(valueStr);
        if (!isNaN(numValue))
        {
            systemState.measures[key] = numValue;
        }
    }
    else if (topic.includes('/alarmes/etats/'))
    {
        // État d'alarme
        const previousState = systemState.alarms[key];
        systemState.alarms[key] = valueStr;

        // Si l'alarme vient de s'activer (ON reçu et ce n'était pas déjà ON)
        if (valueStr.toUpperCase() === 'ON' && previousState !== 'ON')
        {
            console.log(`ALARME ACTIVÉE: ${key}`);

            // L'alarme sera loggée UNIQUEMENT quand un utilisateur l'acknowledge (ACK)
            // Plus d'enregistrement automatique dans le journal

            handleAlarmReaction(key);
        }
    }
    else if (topic.includes('/alarmes/cmd/'))
    {
        // Configuration des seuils
        const numValue = parseFloat(valueStr);
        if (!isNaN(numValue))
        {
            systemState.config[key] = numValue;
            console.log(`Configuration seuil: ${key} = ${numValue}`);
        }
    }

    // Notifier le frontend via Socket.IO
    if (io)
    {
        io.emit('mqtt-data-alarmes',
        {
            topic: topic,
            key: key,
            value: valueStr,
            timestamp: new Date().toISOString()
        });
    }
});

client.on('error', function (error)
{
    console.error('Alarm Controller (Pi 6) - Erreur MQTT:', error);
});

/**
 * Gère la réaction automatique aux alarmes
 * @param {string} alarmKey - La clé de l'alarme (ex: ALR_GB_NIV_MAX)
 */
function handleAlarmReaction(alarmKey)
{
    let cmdTopic = '';
    let newValue = 0;
    let currentVal = 0;
    let shouldReact = true;

    switch (alarmKey)
    {
        // --- Grand Bassin (GB) ---
        case 'ALR_GB_OVF':
            // Débordement -> Envoyer NivLhGB (la valeur seuil haute configurée)
            cmdTopic = 'RAM/panneau/cmd/ConsNivGB';
            newValue = systemState.config['NivLhGB'] || 90; // Utiliser le seuil configuré, ou 90 par défaut
            console.log(`Réaction ${alarmKey}: Réduction GB à NivLhGB = ${newValue}%`);
            break;

        case 'ALR_GB_NIV_MAX':
            // Niveau Max -> Réduire de 10%
            cmdTopic = 'RAM/panneau/cmd/ConsNivGB';
            currentVal = systemState.measures['NivGB'] || 0;
            newValue = Math.max(0, currentVal * (1.0 - REDUCTION_PERCENT));
            console.log(`Réaction ${alarmKey}: Réduction GB de ${currentVal.toFixed(2)}% à ${newValue.toFixed(2)}%`);
            break;

        case 'ALR_PB_OVF':
            // Débordement -> Envoyer NivLhPB (la valeur seuil haute configurée)
            cmdTopic = 'RAM/panneau/cmd/ConsNivPB';
            newValue = systemState.config['NivLhPB'] || 90; // Utiliser le seuil configuré, ou 90 par défaut
            console.log(`Réaction ${alarmKey}: Réduction PB à NivLhPB = ${newValue}%`);
            break;

        case 'ALR_PB_NIV_MAX':
            // Niveau Max -> Réduire de 10%
            cmdTopic = 'RAM/panneau/cmd/ConsNivPB';
            currentVal = systemState.measures['NivPB'] || 0;
            newValue = Math.max(0, currentVal * (1.0 - REDUCTION_PERCENT));
            console.log(`Réaction ${alarmKey}: Réduction PB de ${currentVal.toFixed(2)}% à ${newValue.toFixed(2)}%`);
            break;

        case 'ALR_CNX_BAL':
        case 'ALR_CNX_POW':
            // Alarmes de connexion -> Seulement notifier l'utilisateur, pas d'action automatique
            console.log(`Alarme ${alarmKey}: Notification utilisateur uniquement`);
            shouldReact = false;
            break;

        default:
            console.log(`Aucune réaction définie pour ${alarmKey}`);
            shouldReact = false;
            break;
    }

    // Publication de la commande de correction
    if (shouldReact && cmdTopic)
    {
        client.publish(cmdTopic, newValue.toString(),
        {
            retain: false
        }, (err) =>
        {
            if (err)
            {
                console.error(`Erreur publication correction ${alarmKey}:`, err);
            }
            else
            {
                console.log(`Correction envoyée: ${cmdTopic} = ${newValue}`);
                // Envoyer l'ACK après la correction réussie
                sendAck(alarmKey);
            }
        });
    }
    else if (shouldReact === false)
    {
        // Pour les alarmes de connexion, envoyer quand même l'ACK
        if (alarmKey === 'ALR_CNX_BAL' || alarmKey === 'ALR_CNX_POW')
        {
            sendAck(alarmKey);
        }
    }
}

/**
 * Envoie un accusé de réception (ACK) sur le topic d'alarme
 * @param {string} alarmKey - La clé de l'alarme (ex: ALR_GB_OVF)
 */
function sendAck(alarmKey)
{
    const ackTopic = `RAM/alarmes/etats/${alarmKey}`;

    client.publish(ackTopic, "ACK",
    {
        retain: false
    }, (err) =>
    {
        if (err)
        {
            console.error(`Erreur envoi ACK pour ${alarmKey}:`, err);
        }
        else
        {
            console.log(`ACK envoyé sur ${ackTopic}`);
        }
    });
}

// Fonction pour publier une configuration d'alarme
function publish(topic, message)
{
    return new Promise((resolve, reject) =>
    {
        client.publish(topic, message.toString(),
        {
            retain: false
        }, function (err)
        {
            if (err)
            {
                console.error(`Erreur publication ${topic}:`, err);
                reject(err);
            }
            else
            {
                console.log(`Configuration publiée - Topic: ${topic}, Message: ${message}`);
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
        console.log('Client Socket.IO connecté (Alarmes):', socket.id);

        // Envoyer l'état actuel au nouveau client
        socket.emit('mqtt-initial-data-alarmes', systemState);

        // Gérer les commandes de configuration depuis l'UI (Seuils)
        socket.on('mqtt-command-alarmes', async (data) =>
        {
            // data = { topic: 'RAM/alarmes/cmd/NivLhGB', value: 50, user: 'username' }
            if (data.topic && data.value !== undefined)
            {
                console.log(`Config UI reçue: ${data.topic} = ${data.value}`);
                try
                {
                    // Enregistrer dans le journal
                    if (data.user && data.topic.includes('/cmd/'))
                    {
                        const configType = data.topic.split('/').pop();
                        journalModel.logCommand(data.user, configType, data.value.toString());
                    }

                    await publish(data.topic, data.value);
                    socket.emit('mqtt-command-success-alarmes',
                    {
                        topic: data.topic
                    });
                }
                catch (error)
                {
                    socket.emit('mqtt-command-error-alarmes',
                    {
                        topic: data.topic,
                        error: error.message
                    });
                }
            }
        });

        // Gérer la reconnaissance d'alarme
        socket.on('mqtt-acknowledge-alarm', (data) =>
        {
            // data = { alarmType: 'ALR_GB_OVF', user: 'username', reqTime: '2025-11-23T...' }
            if (data.alarmType && data.user && data.reqTime)
            {
                const alarmKey = data.alarmType.split('/').pop();
                const alarmLevel = systemState.alarms[alarmKey] || 'N/A';
                journalModel.logAlarmAck(data.user, alarmKey, alarmLevel, data.reqTime);
                console.log(`Alarme ${alarmKey} reconnue par ${data.user} - Enregistrée dans le journal`);
            }
        });

        socket.on('disconnect', () =>
        {
            console.log('Client Socket.IO déconnecté (Alarmes):', socket.id);
        });
    });
}

// Obtenir l'état actuel du système
function getCurrentData()
{
    return systemState;
}

// Obtenir les topics
function getTopics()
{
    return {
        ALARM_TOPICS,
        MEASURE_TOPICS,
        CONFIG_TOPICS
    };
}

module.exports = {
    client,
    publish,
    initializeSocketIO,
    getCurrentData,
    getTopics
};
