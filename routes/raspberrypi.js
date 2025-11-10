/**
 * @file     raspberrypi.js
 * @author  charles-Antoine Gagnon
 * @version  1
 * @date     18/09/2025
 * @brief    Routes pour les Raspberry Pi
 */

var express = require('express');
var router = express.Router();

// Routes RaspberryPi individuelles
for (let i = 1; i <= 6; i++)
{
    router.get(`/raspberrypi${i}`, function (req, res, next)
    {
        const niveau = req.query.niveau || '0';
        const user = req.query.user || 'Invité';
        const typeAcces = req.query.typeAcces || 'Utilisateur';

        // Tous les niveaux (0-3) ont accès à tous les Pi pour LECTURE
        // Seuls les niveaux 1-3 peuvent ÉCRIRE
        const canWrite = niveau !== '0'; // Niveau 0 = lecture seule

        res.render(`pages/raspberrypi${i}`,
        {
            title: `Raspberry Pi ${i}`,
            piId: String(i),
            user: user,
            typeAcces: typeAcces,
            niveau: niveau,
            canWrite: canWrite
        });
    });
}

module.exports = router;
