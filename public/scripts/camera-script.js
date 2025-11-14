/**
 * @file camera-script.js
 * @author charles-Antoine Gagnon
 * @version 1
 * @date 14/11/2025
 * @brief Script client pour le flux vidéo RTSP
 */

const canvas = document.getElementById('video-canvas');

loadPlayer(
{
    url: `ws://${window.location.hostname}:${window.location.port}/api/camera/stream`,
    canvas: canvas,
    onDisconnect: function ()
    {
        console.log('⚠️ Connexion caméra perdue');
    },
    onConnect: function ()
    {
        console.log('✅ Connecté au flux caméra');
    }
});
