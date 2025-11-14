/**
 * @file     videoStream.js
 * @author   charles-Antoine Gagnon
 * @version  2
 * @date     14/11/2025
 * @brief    Gestionnaire de flux vidéo RTSP
 */

// URL de la caméra RTSP - Modifiez selon votre configuration
const RTSP_URL = 'rtsp://etudiant:Panneau_RAM@172.17.15.110:554/Streaming/Channels/101';

/**
 * Initialise le flux vidéo RTSP
 * @param {Express.Application} app - Application Express
 * @param {http.Server} server - Serveur HTTP
 * @returns {Object} { scriptUrl } - URL du script client
 */
function initializeVideoStream(app, server)
{
    const
    {
        proxy,
        scriptUrl
    } = require('rtsp-relay')(app, server);

    // Route WebSocket pour le flux vidéo
    app.ws('/api/camera/stream', proxy(
    {
        url: RTSP_URL,
        verbose: false,
        transport: 'tcp',
    }));

    console.log('📹 Flux vidéo RTSP configuré sur /api/camera/stream');

    return {
        scriptUrl
    };
}

module.exports = {
    initializeVideoStream,
    RTSP_URL
};
