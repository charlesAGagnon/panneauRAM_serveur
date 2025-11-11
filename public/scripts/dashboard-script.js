// dashboard-script.js - Script commun pour les dashboards userNiveau
const socket = io();
const niveau = document.body.dataset.niveau || '0';
const canWrite = niveau !== '0';

let sensorData = {
    NivGB: 0,
    NivPB: 0,
    TmpPB: 0,
    ValveEC: 0,
    ValveEF: 0,
    ValveGB: 0,
    ValvePB: 0,
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
    console.log('✅ Connected to Socket.IO');
    const badge = document.getElementById('connection-status');
    if (badge)
    {
        badge.textContent = 'En ligne';
        badge.style.backgroundColor = '#198754';
    }
});

socket.on('disconnect', () =>
{
    const badge = document.getElementById('connection-status');
    if (badge)
    {
        badge.textContent = 'Hors ligne';
        badge.style.backgroundColor = '#ef4444';
    }
});

// PANNEAU DATA (Pi Main)
socket.on('mqtt-initial-data', (data) =>
{
    Object.assign(sensorData, data);
    updateSensorDisplay();
});

socket.on('mqtt-data', (msg) =>
{
    if (msg.key && msg.value !== undefined)
    {
        sensorData[msg.key] = msg.value;
        updateSensorDisplay();
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

function updateSensorDisplay()
{
    // Reservoirs - CYLINDERS
    if (sensorData.NivGB !== undefined)
    {
        const val = document.getElementById('val-gb');
        if (val) val.textContent = sensorData.NivGB + '%';
        const fill = document.getElementById('cylinder-gb-fill');
        if (fill) fill.style.height = sensorData.NivGB + '%';
        const legend = document.getElementById('legend-gb');
        if (legend) legend.textContent = sensorData.NivGB;
    }
    if (sensorData.NivPB !== undefined)
    {
        const val = document.getElementById('val-pb');
        if (val) val.textContent = sensorData.NivPB + '%';
        const fill = document.getElementById('cylinder-pb-fill');
        if (fill) fill.style.height = sensorData.NivPB + '%';
        const legend = document.getElementById('legend-pb');
        if (legend) legend.textContent = sensorData.NivPB;
    }
    if (sensorData.TmpPB !== undefined)
    {
        const val = document.getElementById('stat-temp');
        if (val) val.textContent = (parseFloat(sensorData.TmpPB) || 0).toFixed(1);
        const legend = document.getElementById('legend-temp');
        if (legend) legend.textContent = (parseFloat(sensorData.TmpPB) || 0).toFixed(1);
    }

    // Sliders
    updateSlider('slider-gb', 'val-slider-gb', sensorData.ValveGB);
    updateSlider('slider-pb', 'val-slider-pb', sensorData.ValvePB);
    updateSlider('slider-ec', 'val-slider-ec', sensorData.ValveEC);
    updateSlider('slider-ef', 'val-slider-ef', sensorData.ValveEF);
    updateSlider('slider-gb-valve', 'val-slider-gb-valve', sensorData.ValveGB);
    updateSlider('slider-pb-valve', 'val-slider-pb-valve', sensorData.ValvePB);

    // Switches
    updateSwitch('btn-eec', sensorData.ValveEEC);
    updateSwitch('btn-eef', sensorData.ValveEEF);

    // Pompe & Mode
    if (sensorData.Pompe !== undefined)
    {
        const btn = document.getElementById('btn-pompe');
        if (btn)
        {
            btn.textContent = sensorData.Pompe.toUpperCase();
            btn.classList.toggle('btn-danger', sensorData.Pompe === 'on');
            btn.classList.toggle('btn-primary', sensorData.Pompe === 'off');
        }
    }
    if (sensorData.Mode !== undefined)
    {
        const sel = document.getElementById('select-mode');
        if (sel) sel.value = sensorData.Mode || 'auto';
    }
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

function updateSlider(sliderId, valId, value)
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

// EVENT LISTENERS (only if canWrite)
if (canWrite)
{
    // CONSIGNES RESERVOIRS
    const consignesReservoirs = {
        gb:
        {
            id: 'slider-gb',
            display: 'val-slider-gb',
            topic: 'RAM/panneau/cmd/ConsNivGB'
        },
        pb:
        {
            id: 'slider-pb',
            display: 'val-slider-pb',
            topic: 'RAM/panneau/cmd/ConsNivPB'
        },
        tmpb:
        {
            id: 'slider-tmpb',
            display: 'val-slider-tmpb',
            topic: 'RAM/panneau/cmd/ConsTmpPB'
        }
    };

    Object.entries(consignesReservoirs).forEach(([key, config]) =>
    {
        const slider = document.getElementById(config.id);
        if (slider)
        {
            slider.addEventListener('input', (e) =>
            {
                const display = document.getElementById(config.display);
                if (display) display.textContent = e.target.value;
                socket.emit('mqtt-publish',
                {
                    topic: config.topic,
                    message: e.target.value
                });
            });
        }
    });

    // CONSIGNES VANNES
    ['gb', 'pb', 'ec', 'ef'].forEach(valve =>
    {
        const sliderId = valve === 'gb' || valve === 'pb' ? `slider-${valve}-valve` : `slider-${valve}`;
        const displayId = valve === 'gb' || valve === 'pb' ? `val-slider-${valve}-valve` : `val-slider-${valve}`;

        const slider = document.getElementById(sliderId);
        if (slider)
        {
            slider.addEventListener('input', (e) =>
            {
                const display = document.getElementById(displayId);
                if (display) display.textContent = e.target.value;
                socket.emit('mqtt-publish',
                {
                    topic: `RAM/panneau/cmd/Valve${valve.toUpperCase()}`,
                    message: e.target.value
                });
            });
        }
    });

    // SWITCHES (EEC, EEF)
    ['eec', 'eef'].forEach(valve =>
    {
        const btn = document.getElementById(`btn-${valve}`);
        if (btn)
        {
            btn.addEventListener('click', () =>
            {
                const currentState = sensorData[`Valve${valve.toUpperCase()}`] === 'on' || sensorData[`Valve${valve.toUpperCase()}`] === true;
                const newState = currentState ? 'off' : 'on';

                sensorData[`Valve${valve.toUpperCase()}`] = newState;
                updateSwitch(`btn-${valve}`, newState);

                socket.emit('mqtt-publish',
                {
                    topic: `RAM/panneau/cmd/Valve${valve.toUpperCase()}`,
                    message: newState
                });
            });
        }
    });

    // POMPE BUTTON
    const btnPompe = document.getElementById('btn-pompe');
    if (btnPompe)
    {
        btnPompe.addEventListener('click', () =>
        {
            const newState = sensorData.Pompe === 'off' ? 'on' : 'off';
            sensorData.Pompe = newState;
            updateSensorDisplay();

            socket.emit('mqtt-publish',
            {
                topic: 'RAM/panneau/cmd/Pompe',
                message: newState
            });
        });
    }

    // MODE SELECT
    const selectMode = document.getElementById('select-mode');
    if (selectMode)
    {
        selectMode.addEventListener('change', (e) =>
        {
            socket.emit('mqtt-publish',
            {
                topic: 'RAM/panneau/cmd/Mode',
                message: e.target.value
            });
        });
    }
}
