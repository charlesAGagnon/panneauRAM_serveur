/**
 * @file     camera.js
 * @author  charles-Antoine Gagnon
 * @version  2
 * @date     14/11/2025
 * @brief    Routes pour le flux vidéo de la caméra IP avec RTSP
 */

const express = require('express');
const router = express.Router();

// URL RTSP de la caméra - MODIFIEZ CETTE URL selon votre caméra
// Format typique: rtsp://username:password@ip:port/path
// Exemples courants:
// - rtsp://admin:password@172.17.15.110:554/stream1
// - rtsp://admin:password@172.17.15.110:554/cam/realmonitor?channel=1&subtype=0
// - rtsp://172.17.15.110:554/live/ch00_0
const RTSP_URL = 'rtsp://admin:admin@172.17.15.110:554/stream1';

// Page HTML pour afficher le flux
router.get('/camera/view', function (req, res)
{
    const
    {
        scriptUrl
    } = req.app.get('rtspRelay');

    res.send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Flux Caméra Live</title>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    background: #000;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    font-family: Arial, sans-serif;
                }
                #canvas {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }
                #status {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: rgba(220, 53, 69, 0.9);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 4px;
                    font-weight: bold;
                    font-size: 14px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                }
                #error {
                    display: none;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <canvas id="canvas"></canvas>
            <div id="status">● LIVE</div>
            <div id="error">
                <h2>📹 Connexion perdue</h2>
                <p>Tentative de reconnexion...</p>
            </div>

            <script src="${scriptUrl}"></script>
            <script>
                loadPlayer({
                    url: 'ws://' + location.host + '/api/camera/stream',
                    canvas: document.getElementById('canvas'),
                    onDisconnect: function() {
                        console.log('⚠️ Connexion perdue');
                        document.getElementById('status').style.background = 'rgba(108, 117, 125, 0.9)';
                        document.getElementById('status').textContent = '○ OFFLINE';
                        document.getElementById('error').style.display = 'block';
                    },
                    onConnect: function() {
                        console.log('✅ Connecté au flux');
                        document.getElementById('status').style.background = 'rgba(220, 53, 69, 0.9)';
                        document.getElementById('status').textContent = '● LIVE';
                        document.getElementById('error').style.display = 'none';
                    }
                });
            </script>
        </body>
        </html>
    `);
});

// Route de test pour vérifier la configuration
router.get('/camera/test', function (req, res)
{
    res.json(
    {
        status: 'ready',
        message: 'Routes caméra configurées',
        rtspUrl: RTSP_URL.replace(/:[^:@]+@/, ':****@'), // masquer le mot de passe
        streamEndpoint: '/api/camera/stream',
        viewEndpoint: '/camera/view'
    });
});

module.exports = router;
