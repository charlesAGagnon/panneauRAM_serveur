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

        // Vérifier les accès selon le niveau
        const accessRules = {
            '0': [],
            '1': ['1', '2'],
            '2': ['1', '2', '3', '4', '5'],
            '3': ['1', '2', '3', '4', '5', '6']
        };

        if (!accessRules[niveau] || !accessRules[niveau].includes(String(i)))
        {
            return res.status(403).render('pages/403',
            {
                title: 'Accès refusé',
                user: user,
                typeAcces: typeAcces,
                niveau: niveau
            });
        }

        res.render(`pages/raspberrypi${i}`,
        {
            title: `Raspberry Pi ${i}`,
            piId: String(i),
            user: user,
            typeAcces: typeAcces,
            niveau: niveau
        });
    });
}

module.exports = router;
