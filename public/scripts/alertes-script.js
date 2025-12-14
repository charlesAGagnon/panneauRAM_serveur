/**
 * @file alertes-script.js
 * @author charles-Antoine Gagnon
 * @version 2
 * @date 23/11/2025
 * @brief Script pour la page Alertes (Gestion des seuils et affichage)
 */

const socket = io();

// Récupérer le niveau d'accès et l'utilisateur
const niveau = document.body.dataset.niveau || '0';
const canWrite = (niveau === '2' || niveau === '3');
const urlParams = new URLSearchParams(window.location.search);
const currentUser = urlParams.get('user') || 'Anonyme';

// Configuration des topics vers les IDs des inputs
const topicToInputId = {
    'RAM/alarmes/cmd/NivLhGB': 'input-NivLhGB',
    'RAM/alarmes/cmd/TgNivGB': 'input-TgNivGB',
    'RAM/alarmes/cmd/TrNivGB': 'input-TrNivGB',
    'RAM/alarmes/cmd/NivLhPB': 'input-NivLhPB',
    'RAM/alarmes/cmd/TgNivPB': 'input-TgNivPB',
    'RAM/alarmes/cmd/TrNivPB': 'input-TrNivPB'
};

// Configuration des topics d'état d'alarme vers les IDs des badges
const alarmTopicToBadgeId = {
    'RAM/alarmes/etats/ALR_GB_OVF': 'badge-ALR_GB_OVF',
    'RAM/alarmes/etats/ALR_GB_NIV_MAX': 'badge-ALR_GB_NIV_MAX',
    'RAM/alarmes/etats/ALR_PB_OVF': 'badge-ALR_PB_OVF',
    'RAM/alarmes/etats/ALR_PB_NIV_MAX': 'badge-ALR_PB_NIV_MAX',
    'RAM/alarmes/etats/ALR_CNX_BAL': 'badge-ALR_CNX_BAL',
    'RAM/alarmes/etats/ALR_CNX_POW': 'badge-ALR_CNX_POW'
};

// Labels pour les alarmes
const ALARM_LABELS = {
    'ALR_GB_OVF': 'Débordement Grand Bassin',
    'ALR_GB_NIV_MAX': 'Niveau Max Grand Bassin',
    'ALR_PB_OVF': 'Débordement Petit Bassin',
    'ALR_PB_NIV_MAX': 'Niveau Max Petit Bassin',
    'ALR_CNX_BAL': 'Perte connexion Balance',
    'ALR_CNX_POW': 'Perte connexion Power Meter'
};

// Connexion et initialisation
socket.on('connect', () =>
{
    console.log('Connecte au serveur Socket.IO (Alertes)');
});

socket.on('disconnect', () =>
{
    console.log('Deconnecte du serveur Socket.IO (Alertes)');
});

// Réception des données initiales
socket.on('mqtt-initial-data-alarmes', (data) =>
{
    console.log('Données initiales reçues:', data);

    // Mettre à jour les configurations (inputs)
    if (data.config)
    {
        Object.keys(data.config).forEach(key =>
        {
            // Reconstruire le topic complet pour trouver l'ID
            const topic = `RAM/alarmes/cmd/${key}`;
            updateInput(topic, data.config[key]);
        });
    }

    // Mettre à jour les états d'alarme
    if (data.alarms)
    {
        Object.keys(data.alarms).forEach(key =>
        {
            const topic = `RAM/alarmes/etats/${key}`;
            updateAlarmBadge(topic, data.alarms[key]);
        });
    }
});

// Réception des mises à jour en temps réel
socket.on('mqtt-data-alarmes', (data) =>
{
    // data = { topic, key, value, timestamp }
    console.log('Mise à jour alarme:', data);

    if (data.topic.includes('/cmd/'))
    {
        updateInput(data.topic, data.value);
    }
    else if (data.topic.includes('/etats/'))
    {
        updateAlarmBadge(data.topic, data.value);

        // Si l'alarme est activée ET l'utilisateur peut voir les alarmes
        if ((data.value === 'ON' || data.value === '1' || data.value === 1) && canWrite)
        {
            showAlarmNotification(data.key);
        }
    }
});

function updateInput(topic, value)
{
    const inputId = topicToInputId[topic];
    if (inputId)
    {
        const input = document.getElementById(inputId);
        if (input && document.activeElement !== input)
        {
            input.value = value;
        }
    }
}

function updateAlarmBadge(topic, value)
{
    const badgeId = alarmTopicToBadgeId[topic];
    if (badgeId)
    {
        const badge = document.getElementById(badgeId);
        if (badge)
        {
            const isActive = (value === 'ON' || value === '1' || value === 1);
            const isAck = (value === 'ACK');

            if (isActive)
            {
                badge.className = 'status-badge status-error';
                badge.textContent = 'ACTIF';
            }
            else if (isAck)
            {
                badge.className = 'status-badge status-warning';
                badge.textContent = 'ACK';
            }
            else
            {
                badge.className = 'status-badge status-ok';
                badge.textContent = 'Normal';
            }
        }
    }
}

// Afficher une notification d'alarme
function showAlarmNotification(alarmKey)
{
    const label = ALARM_LABELS[alarmKey] || alarmKey;
    const reqTime = new Date().toISOString();
    const notification = document.createElement('div');
    notification.className = 'alarm-notification';
    notification.setAttribute('data-alarm-key', alarmKey);
    notification.setAttribute('data-req-time', reqTime);
    notification.innerHTML = `
        <div style="background: #dc2626; color: white; padding: 16px; border-radius: 8px; margin: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); animation: slideIn 0.3s ease-out;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 24px;">!</span>
                <div style="flex: 1;">
                    <strong style="font-size: 16px;">ALARME DÉCLENCHÉE</strong>
                    <div style="font-size: 14px; margin-top: 4px;">${label}</div>
                    <div style="font-size: 12px; margin-top: 4px; opacity: 0.9;">Le système va tenter de corriger automatiquement</div>
                </div>
                <button onclick="acknowledgeAlarm('${alarmKey}')" style="background: #f59e0b; border: none; color: white; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 600;">ACK</button>
                <button onclick="this.parentElement.parentElement.remove()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 14px;">X</button>
            </div>
        </div>
    `;

    // Ajouter au conteneur de notifications (créer si n'existe pas)
    let container = document.getElementById('alarm-notifications');
    if (!container)
    {
        container = document.createElement('div');
        container.id = 'alarm-notifications';
        container.style.cssText = 'position: fixed; top: 80px; right: 20px; z-index: 1000; max-width: 400px;';
        document.body.appendChild(container);
    }

    container.appendChild(notification);

    // Auto-remove après 10 secondes
    setTimeout(() =>
    {
        notification.remove();
    }, 10000);
}

// Reconnaître une alarme
function acknowledgeAlarm(alarmKey)
{
    const notifications = document.querySelectorAll(`[data-alarm-key="${alarmKey}"]`);
    if (notifications.length === 0) return;

    notifications.forEach(notification =>
    {
        const reqTime = notification.getAttribute('data-req-time');

        // Envoyer la reconnaissance au serveur
        socket.emit('mqtt-acknowledge-alarm',
        {
            alarmType: alarmKey,
            user: currentUser,
            reqTime: reqTime
        });

        // Retirer la notification
        notification.remove();
    });

    console.log(`Alarme ${alarmKey} reconnue par ${currentUser}`);
}



// Gestion de l'envoi des configurations
function sendConfig(inputId)
{
    const input = document.getElementById(inputId);
    if (!input) return;

    // Trouver le topic associé à cet ID
    const topic = Object.keys(topicToInputId).find(key => topicToInputId[key] === inputId);

    if (topic)
    {
        const value = parseFloat(input.value);
        if (!isNaN(value))
        {
            console.log(`Envoi config: ${topic} = ${value}`);
            socket.emit('mqtt-command-alarmes',
            {
                topic: topic,
                value: value,
                user: currentUser
            });
        }
    }
}

// Attacher les écouteurs d'événements aux inputs
document.addEventListener('DOMContentLoaded', () =>
{
    // Attacher les listeners aux inputs pour l'envoi instantané
    Object.values(topicToInputId).forEach(inputId =>
    {
        const input = document.getElementById(inputId);
        if (input)
        {
            input.addEventListener('change', () => sendConfig(inputId));
        }
    });

    // Ajouter les styles pour les animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 4px;
            font-weight: 600;
            font-size: 14px;
        }
        
        .status-error {
            background: #dc2626;
            color: white;
        }
        
        .status-ok {
            background: #10b981;
            color: white;
        }
        
        .status-warning {
            background: #f59e0b;
            color: white;
        }
    `;
    document.head.appendChild(style);
});
