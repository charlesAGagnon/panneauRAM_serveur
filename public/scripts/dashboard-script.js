// dashboard-script.js - Script commun pour les dashboards userNiveau
const socket = io();
const niveau = document.body.dataset.niveau || '0';
const canWrite = niveau !== '0';

// Récupérer l'utilisateur depuis les paramètres URL
const urlParams = new URLSearchParams(window.location.search);
const currentUser = urlParams.get('user') || 'Anonyme';

// MESURES/ÉTATS - Données reçues via MQTT (lecture seule)
let mesures = {
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

// CONSIGNES - Valeurs définies par l'utilisateur 
let consignes = {
    ConsNivGB: 0,
    ConsNivPB: 0,
    ConsTmpPB: 0,
    ValveGB: 0,
    ValvePB: 0,
    ValveEC: 0,
    ValveEF: 0,
    ValveEEC: 'off',
    ValveEEF: 'off',
    Pompe: 'off',
    Mode: 'auto'
};

let energyData = {
    Van: 0,
    Vbn: 0,
    Vab: 0,
    Ia: 0,
    Ib: 0,
    KW: 0,
    KWh: 0,
    FP: 0
};

// CONNECTION STATUS
socket.on('connect', () =>
{
    console.log('Connected to Socket.IO');
});

socket.on('disconnect', () =>
{
    console.log('Disconnected from Socket.IO');
});

// ALARMES - Notifications pour niveaux 2 et 3
socket.on('mqtt-data-alarmes', (data) =>
{
    console.log('Event mqtt-data-alarmes recu:', data, 'Niveau utilisateur:', niveau);
    // Vérifier si c'est une alarme qui s'active (niveau 2 ou 3)
    if ((niveau === '2' || niveau === '3') && data.value && (data.value === 'ON' || data.value === '1' || data.value === 1))
    {
        console.log('Affichage notification alarme:', data.key);
        window.showAlarmNotification(data.key);
    }
});

// Afficher une notification d'alarme avec bouton ACK - FONCTION GLOBALE
window.showAlarmNotification = function (alarmKey)
{
    const alarmLabels = {
        'ALR_GB_OVF': 'Grand Bassin - Débordement',
        'ALR_GB_NIV_MAX': 'Grand Bassin - Niveau Maximum',
        'ALR_PB_OVF': 'Petit Bassin - Débordement',
        'ALR_PB_NIV_MAX': 'Petit Bassin - Niveau Maximum',
        'ALR_CNX_BAL': 'Connexion Balance Perdue',
        'ALR_CNX_POW': 'Connexion Power Meter Perdue'
    };
    const label = alarmLabels[alarmKey] || alarmKey;
    const reqTime = new Date().toISOString();
    const notification = document.createElement('div');
    notification.className = 'alarm-notification';
    notification.setAttribute('data-alarm-key', alarmKey);
    notification.setAttribute('data-req-time', reqTime);
    notification.innerHTML = `
        <div style="background: #dc2626; color: white; padding: 16px; border-radius: 8px; margin: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 24px;">!</span>
                <div style="flex: 1;">
                    <strong style="font-size: 16px;">ALARME DÉCLENCHÉE</strong>
                    <div style="font-size: 14px; margin-top: 4px;">${label}</div>
                    <div style="font-size: 12px; margin-top: 4px; opacity: 0.9;">Le système va tenter de corriger automatiquement</div>
                </div>
                <button onclick="acknowledgeAlarm('${alarmKey}')" style="background: #f59e0b; border: none; color: white; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 600;">ACK</button>
            </div>
        </div>
    `;

    let container = document.getElementById('alarm-notifications');
    if (!container)
    {
        container = document.createElement('div');
        container.id = 'alarm-notifications';
        container.style.cssText = 'position: fixed; top: 80px; right: 20px; z-index: 1000; max-width: 400px;';
        document.body.appendChild(container);
    }

    container.appendChild(notification);

    setTimeout(() =>
    {
        notification.remove();
    }, 10000);
};

// Reconnaître une alarme - FONCTION GLOBALE pour onclick
window.acknowledgeAlarm = function (alarmKey)
{
    const notifications = document.querySelectorAll(`[data-alarm-key="${alarmKey}"]`);
    if (notifications.length === 0) return;

    notifications.forEach(notification =>
    {
        const reqTime = notification.getAttribute('data-req-time');

        socket.emit('mqtt-acknowledge-alarm',
        {
            alarmType: alarmKey,
            user: currentUser,
            reqTime: reqTime
        });

        notification.remove();
    });

    console.log(`Alarme ${alarmKey} reconnue par ${currentUser}`);
};

// PANNEAU DATA (Pi Main) - Mise à jour des MESURES uniquement
socket.on('mqtt-initial-data', (data) =>
{
    Object.assign(mesures, data);
    updateMesuresDisplay();
});

// PANNEAU COMMANDS - Recevoir les dernières commandes envoyées
socket.on('mqtt-initial-commands', (data) =>
{
    console.log('Dernières consignes reçues:', data);
    Object.assign(consignes, data);
    // Mettre à jour l'UI avec les consignes sauvegardées
    updateConsignesUI();
});

socket.on('mqtt-data', (msg) =>
{
    if (msg.key && msg.value !== undefined)
    {
        mesures[msg.key] = msg.value;
        updateMesuresDisplay();
    }
});

// ENERGY DATA (Pi 3)
socket.on('mqtt-initial-data-pi3', (data) =>
{
    Object.assign(energyData, data);
    updateEnergyDisplay();
});

socket.on('mqtt-data-pi3', (msg) =>
{
    if (msg.key && msg.value !== undefined)
    {
        energyData[msg.key] = msg.value;
        updateEnergyDisplay();
    }
});

function updateMesuresDisplay()
{
    console.log('updateMesuresDisplay appele avec mesures:', mesures);

    // ÉTATS REÇUS - Section dédiée aux états reçus via MQTT
    if (mesures.NivGB !== undefined)
    {
        const etatNivGB = document.getElementById('etat-nivgb');
        if (etatNivGB)
        {
            etatNivGB.textContent = mesures.NivGB;
            console.log('etat-nivgb mis a jour:', mesures.NivGB);
        }
        else
        {
            console.log('Element etat-nivgb non trouve');
        }
    }
    if (mesures.NivPB !== undefined)
    {
        const etatNivPB = document.getElementById('etat-nivpb');
        if (etatNivPB) etatNivPB.textContent = mesures.NivPB;
    }
    if (mesures.TmpPB !== undefined)
    {
        const etatTmpPB = document.getElementById('etat-tmppb');
        if (etatTmpPB) etatTmpPB.textContent = (parseFloat(mesures.TmpPB) || 0).toFixed(1);
    }
    if (mesures.ValveGB !== undefined)
    {
        const etatValveGB = document.getElementById('etat-valvegb');
        if (etatValveGB) etatValveGB.textContent = mesures.ValveGB;
    }
    if (mesures.ValvePB !== undefined)
    {
        const etatValvePB = document.getElementById('etat-valvepb');
        if (etatValvePB) etatValvePB.textContent = mesures.ValvePB;
    }
    if (mesures.ValveEC !== undefined)
    {
        const etatValveEC = document.getElementById('etat-valveec');
        if (etatValveEC) etatValveEC.textContent = mesures.ValveEC;
    }
    if (mesures.ValveEF !== undefined)
    {
        const etatValveEF = document.getElementById('etat-valveef');
        if (etatValveEF) etatValveEF.textContent = mesures.ValveEF;
    }
    if (mesures.ValveEEC !== undefined)
    {
        const etatValveEEC = document.getElementById('etat-valveeec');
        if (etatValveEEC) etatValveEEC.textContent = mesures.ValveEEC.toUpperCase();
    }
    if (mesures.ValveEEF !== undefined)
    {
        const etatValveEEF = document.getElementById('etat-valveeef');
        if (etatValveEEF) etatValveEEF.textContent = mesures.ValveEEF.toUpperCase();
    }
    if (mesures.Pompe !== undefined)
    {
        const etatPompe = document.getElementById('etat-pompe');
        if (etatPompe) etatPompe.textContent = mesures.Pompe.toUpperCase();
    }
    if (mesures.Mode !== undefined)
    {
        const etatMode = document.getElementById('etat-mode');
        if (etatMode) etatMode.textContent = mesures.Mode.toUpperCase();

        // Mettre à jour l'état des sliders de valves selon le mode
        updateValveSlidersState(mesures.Mode);
    }

    // AFFICHAGE CYLINDRES (visualisation graphique)
    if (mesures.NivGB !== undefined)
    {
        const val = document.getElementById('val-gb');
        if (val) val.textContent = mesures.NivGB + '%';
        const fill = document.getElementById('cylinder-gb-fill');
        if (fill) fill.style.height = mesures.NivGB + '%';
        const legend = document.getElementById('legend-gb');
        if (legend) legend.textContent = mesures.NivGB;
    }
    if (mesures.NivPB !== undefined)
    {
        const val = document.getElementById('val-pb');
        if (val) val.textContent = mesures.NivPB + '%';
        const fill = document.getElementById('cylinder-pb-fill');
        if (fill) fill.style.height = mesures.NivPB + '%';
        const legend = document.getElementById('legend-pb');
        if (legend) legend.textContent = mesures.NivPB;
    }

    // POMPE & MODE - Affichage de l'état actuel (pas la consigne)
    if (mesures.Pompe !== undefined)
    {
        const btn = document.getElementById('btn-pompe');
        if (btn)
        {
            btn.textContent = mesures.Pompe.toUpperCase();
            btn.classList.toggle('btn-danger', mesures.Pompe === 'on');
            btn.classList.toggle('btn-primary', mesures.Pompe === 'off');
        }
    }
    if (mesures.Mode !== undefined)
    {
        const sel = document.getElementById('select-mode');
        if (sel) sel.value = mesures.Mode || 'auto';
    }

    // SWITCHES - Affichage de l'état actuel
    updateSwitch('btn-eec', mesures.ValveEEC);
    updateSwitch('btn-eef', mesures.ValveEEF);
}

function updateEnergyDisplay()
{
    if (energyData.Van !== undefined) document.getElementById('stat-van').textContent = (parseFloat(energyData.Van) || 0).toFixed(1);
    if (energyData.Vbn !== undefined) document.getElementById('stat-vbn').textContent = (parseFloat(energyData.Vbn) || 0).toFixed(1);
    if (energyData.Vab !== undefined) document.getElementById('stat-vab').textContent = (parseFloat(energyData.Vab) || 0).toFixed(1);
    if (energyData.Ia !== undefined) document.getElementById('stat-ia').textContent = (parseFloat(energyData.Ia) || 0).toFixed(2);
    if (energyData.Ib !== undefined) document.getElementById('stat-ib').textContent = (parseFloat(energyData.Ib) || 0).toFixed(2);
    if (energyData.KW !== undefined) document.getElementById('stat-kw').textContent = (parseFloat(energyData.KW) || 0).toFixed(2);
    if (energyData.KWh !== undefined) document.getElementById('stat-kwh').textContent = (parseFloat(energyData.KWh) || 0).toFixed(2);
    if (energyData.FP !== undefined) document.getElementById('stat-fp').textContent = (parseFloat(energyData.FP) || 0).toFixed(2);
}

function updateConsigneDisplay(sliderId, valId, value)
{
    const slider = document.getElementById(sliderId);
    if (slider) slider.value = value;
    const display = document.getElementById(valId);
    if (display) display.textContent = value;
}

function updateSwitch(btnId, value)
{
    const btn = document.getElementById(btnId);
    if (btn)
    {
        const isOn = value === 'on' || value === true || value === 1;
        btn.textContent = isOn ? 'ON' : 'OFF';
        btn.classList.toggle('btn-danger', isOn);
        btn.classList.toggle('btn-primary', !isOn);
    }
}

// Fonction pour activer/désactiver les sliders selon le mode
function updateValveSlidersState(mode)
{
    const isManualMode = mode === 'manuel';

    // Sliders de RÉSERVOIRS - Actifs en mode AUTO uniquement
    const reservoirSliders = [
        'slider-gb',
        'slider-pb',
        'slider-tmpb'
    ];

    // Sliders de VALVES - Actifs en mode MANUEL uniquement
    const valveSliders = [
        'slider-gb-valve',
        'slider-pb-valve',
        'slider-ec',
        'slider-ef'
    ];

    // Mode AUTO: réservoirs actifs, valves désactivées
    // Mode MANUEL: réservoirs désactivés, valves actives
    reservoirSliders.forEach(sliderId =>
    {
        const slider = document.getElementById(sliderId);
        if (slider)
        {
            slider.disabled = isManualMode;
            if (isManualMode)
            {
                slider.classList.add('slider-disabled');
                slider.title = 'Les consignes de réservoirs sont désactivées en mode manuel';
            }
            else
            {
                slider.classList.remove('slider-disabled');
                slider.title = '';
            }
        }
    });

    valveSliders.forEach(sliderId =>
    {
        const slider = document.getElementById(sliderId);
        if (slider)
        {
            slider.disabled = !isManualMode;
            if (!isManualMode)
            {
                slider.classList.add('slider-disabled');
                slider.title = 'Les consignes de valves sont désactivées en mode automatique';
            }
            else
            {
                slider.classList.remove('slider-disabled');
                slider.title = '';
            }
        }
    });
}

// Fonction pour restaurer l'UI avec les consignes sauvegardées
function updateConsignesUI()
{
    console.log('Restauration des consignes dans l\'UI');

    // Sliders
    updateConsigneDisplay('slider-gb', 'val-slider-gb', consignes.ConsNivGB);
    updateConsigneDisplay('slider-pb', 'val-slider-pb', consignes.ConsNivPB);
    updateConsigneDisplay('slider-tmpb', 'val-slider-tmpb', consignes.ConsTmpPB);

    // Vannes (sliders horizontaux ou autre)
    if (document.getElementById('slider-valve-gb'))
    {
        updateConsigneDisplay('slider-valve-gb', 'val-valve-gb', consignes.ValveGB);
    }
    if (document.getElementById('slider-valve-pb'))
    {
        updateConsigneDisplay('slider-valve-pb', 'val-valve-pb', consignes.ValvePB);
    }
    if (document.getElementById('slider-valve-ec'))
    {
        updateConsigneDisplay('slider-valve-ec', 'val-valve-ec', consignes.ValveEC);
    }
    if (document.getElementById('slider-valve-ef'))
    {
        updateConsigneDisplay('slider-valve-ef', 'val-valve-ef', consignes.ValveEF);
    }

    // Switches
    updateSwitch('btn-eec', consignes.ValveEEC);
    updateSwitch('btn-eef', consignes.ValveEEF);
    updateSwitch('btn-pompe', consignes.Pompe);

    // Mode
    const selMode = document.getElementById('select-mode');
    if (selMode && consignes.Mode)
    {
        selMode.value = consignes.Mode;
    }

    // Mettre à jour l'état des sliders de valves selon le mode
    updateValveSlidersState(mesures.Mode || consignes.Mode || 'auto');
}

if (canWrite)
{
    const consignesReservoirs = {
        gb:
        {
            id: 'slider-gb',
            display: 'val-slider-gb',
            topic: 'RAM/panneau/cmd/ConsNivGB',
            key: 'ConsNivGB'
        },
        pb:
        {
            id: 'slider-pb',
            display: 'val-slider-pb',
            topic: 'RAM/panneau/cmd/ConsNivPB',
            key: 'ConsNivPB'
        },
        tmpb:
        {
            id: 'slider-tmpb',
            display: 'val-slider-tmpb',
            topic: 'RAM/panneau/cmd/ConsTmpPB',
            key: 'ConsTmpPB'
        }
    };

    Object.entries(consignesReservoirs).forEach(([name, config]) =>
    {
        const slider = document.getElementById(config.id);
        if (slider)
        {
            slider.addEventListener('input', (e) =>
            {
                const value = e.target.value;
                // Mettre à jour la consigne locale (pas l'état)
                consignes[config.key] = value;

                const display = document.getElementById(config.display);
                if (display) display.textContent = value;

                // Envoyer la commande MQTT
                socket.emit('mqtt-publish',
                {
                    topic: config.topic,
                    message: value,
                    user: currentUser
                });
            });
        }
    });

    // CONSIGNES VANNES - Mise à jour des consignes locales uniquement
    ['gb', 'pb', 'ec', 'ef'].forEach(valve =>
    {
        const sliderId = valve === 'gb' || valve === 'pb' ? `slider-${valve}-valve` : `slider-${valve}`;
        const displayId = valve === 'gb' || valve === 'pb' ? `val-slider-${valve}-valve` : `val-slider-${valve}`;

        const slider = document.getElementById(sliderId);
        if (slider)
        {
            slider.addEventListener('input', (e) =>
            {
                const value = e.target.value;
                // Mettre à jour la consigne locale (pas l'état)
                consignes[`Valve${valve.toUpperCase()}`] = value;

                const display = document.getElementById(displayId);
                if (display) display.textContent = value;

                // Envoyer la commande MQTT
                socket.emit('mqtt-publish',
                {
                    topic: `RAM/panneau/cmd/Valve${valve.toUpperCase()}`,
                    message: value,
                    user: currentUser
                });
            });
        }
    });

    // SWITCHES (EEC, EEF) - Toggle basé sur la consigne locale
    ['eec', 'eef'].forEach(valve =>
    {
        const btn = document.getElementById(`btn-${valve}`);
        if (btn)
        {
            btn.addEventListener('click', () =>
            {
                const valveKey = `Valve${valve.toUpperCase()}`;
                // Toggle basé sur la consigne locale
                const currentState = consignes[valveKey] === 'on';
                const newState = currentState ? 'off' : 'on';

                // Mettre à jour la consigne locale
                consignes[valveKey] = newState;
                updateSwitch(`btn-${valve}`, newState);

                // Envoyer la commande MQTT
                socket.emit('mqtt-publish',
                {
                    topic: `RAM/panneau/cmd/${valveKey}`,
                    message: newState,
                    user: currentUser
                });
            });
        }
    });

    // POMPE BUTTON - Toggle basé sur la consigne locale
    const btnPompe = document.getElementById('btn-pompe');
    if (btnPompe)
    {
        btnPompe.addEventListener('click', () =>
        {
            // Toggle basé sur la consigne locale
            const newState = consignes.Pompe === 'off' ? 'on' : 'off';
            consignes.Pompe = newState;

            // Mettre à jour l'affichage immédiatement
            btnPompe.textContent = newState.toUpperCase();
            btnPompe.classList.toggle('btn-danger', newState === 'on');
            btnPompe.classList.toggle('btn-primary', newState === 'off');

            // Envoyer la commande MQTT
            socket.emit('mqtt-publish',
            {
                topic: 'RAM/panneau/cmd/Pompe',
                message: newState,
                user: currentUser
            });

            console.log(`Pompe consigne: ${newState}`);
        });
    }

    // MODE SELECT - Mise à jour de la consigne locale
    const selectMode = document.getElementById('select-mode');
    if (selectMode)
    {
        selectMode.addEventListener('change', (e) =>
        {
            const value = e.target.value;
            // Mettre à jour la consigne locale
            consignes.Mode = value;

            // Mettre à jour l'état des sliders de valves
            updateValveSlidersState(value);

            // Envoyer la commande MQTT
            socket.emit('mqtt-publish',
            {
                topic: 'RAM/panneau/cmd/Mode',
                message: value,
                user: currentUser
            });
        });
    }
}
