/**
 * @file     dashboard.js
 * @author  charles-Antoine Gagnon
 * @version  1
 * @date     18/09/2025
 * @brief    Première ébauche d'une architecture générique "RESTful" avec Express
 *          Routeur principal
 */

var express = require('express');
var router = express.Router();
requete = require('../models/request');

router.post('/dashboard', async function (req, res, next)
{
    try
    {
        const exists = await requete.verifierUtilisateur(req.body.username, req.body.password);
        if (!exists) return res.redirect('/');

        requete.getNiveauAcces(req.body.username, req.body.password, function (err, data)
        {
            console.log('Niveau d\'accès:', data);
            if (err) return next(err);
            if (!data) return res.redirect('/');

            const renderData = {
                title: 'Dashboard',
                user: req.body.username,
                typeAcces: data.typeAcces,
                niveau: data.niveau
            };

            switch (data.niveau)
            {
                case "0":
                    return res.render('pages/userNiveau0', renderData);
                case "1":
                    return res.render('pages/userNiveau1', renderData);
                case "2":
                    return res.render('pages/userNiveau2', renderData);
                case "3":
                    return res.render('pages/userNiveau3', renderData);
                default:
                    console.log('Niveau inconnu:', data.niveau);
                    return res.redirect('/');
            }
        });
    }
    catch (err)
    {
        next(err);
    }
});

// Route GET pour retourner au dashboard avec les paramètres
router.get('/dashboard', async function (req, res, next)
{
    const user = req.query.user;
    const niveau = req.query.niveau;
    const typeAcces = req.query.typeAcces;

    if (!user || !niveau || !typeAcces)
    {
        return res.redirect('/');
    }

    const renderData = {
        title: 'Dashboard',
        user: user,
        typeAcces: typeAcces,
        niveau: niveau
    };

    switch (niveau)
    {
        case "0":
            return res.render('pages/userNiveau0', renderData);
        case "1":
            return res.render('pages/userNiveau1', renderData);
        case "2":
            return res.render('pages/userNiveau2', renderData);
        case "3":
            return res.render('pages/userNiveau3', renderData);
        default:
            return res.redirect('/');
    }
});

// Routes RaspberryPi
router.get('/raspberrypi/:id', function (req, res, next)
{
    const piId = req.params.id;
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

    if (!accessRules[niveau] || !accessRules[niveau].includes(piId))
    {
        return res.status(403).render('pages/403',
        {
            title: 'Accès refusé',
            user: user,
            typeAcces: typeAcces,
            niveau: niveau
        });
    }

    res.render('pages/raspberrypi',
    {
        title: `Raspberry Pi ${piId}`,
        piId: piId,
        user: user,
        typeAcces: typeAcces,
        niveau: niveau
    });
});

module.exports = router;
