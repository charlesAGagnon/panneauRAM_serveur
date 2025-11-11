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

            // Utiliser la page dashboard commune pour tous les niveaux
            return res.render('pages/dashboard', renderData);
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

    // Utiliser la page dashboard commune pour tous les niveaux
    return res.render('pages/dashboard', renderData);
});

router.post('/dashboard/changePassword', async function (req, res, next)
{

    const username = req.body.user;
    const newPassword = req.body.newPassword;
    await requete.setUserPassword(username, newPassword);
    res.redirect(`/dashboard?user=${encodeURIComponent(username)}&niveau=3&typeAcces=Administrateur`);
});

module.exports = router;
