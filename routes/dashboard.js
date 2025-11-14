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

            // Rediriger vers la page userNiveau appropriée
            return res.render(`pages/userNiveau${data.niveau}`, renderData);
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

    // Rediriger vers la page userNiveau appropriée
    return res.render(`pages/userNiveau${niveau}`, renderData);
});

router.post('/dashboard/changePassword', async function (req, res, next)
{

    const username = req.body.user;
    const newPassword = req.body.newPassword;
    await requete.setUserPassword(username, newPassword);
    res.redirect(`/dashboard?user=${encodeURIComponent(username)}&niveau=3&typeAcces=Administrateur`);
});

// Route GET pour la page Panneau RAM (dashboard technique)
router.get('/ram', async function (req, res, next)
{
    const user = req.query.user;
    const niveau = req.query.niveau;
    const typeAcces = req.query.typeAcces;

    if (!user || !niveau || !typeAcces)
    {
        return res.redirect('/');
    }

    const renderData = {
        title: 'Panneau RAM',
        user: user,
        typeAcces: typeAcces,
        niveau: niveau
    };

    return res.render('pages/dashboard', renderData);
});

// Route GET pour la page Granulaires
router.get('/granulaires', async function (req, res, next)
{
    const user = req.query.user;
    const niveau = req.query.niveau;
    const typeAcces = req.query.typeAcces;

    if (!user || !niveau || !typeAcces)
    {
        return res.redirect('/');
    }

    const renderData = {
        title: 'Granulaires',
        user: user,
        typeAcces: typeAcces,
        niveau: niveau
    };

    return res.render('pages/granulaires', renderData);
});

// Route GET pour la page Journal (Niveau 3 seulement)
router.get('/journal', async function (req, res, next)
{
    const user = req.query.user;
    const niveau = req.query.niveau;
    const typeAcces = req.query.typeAcces;

    if (!user || !niveau || !typeAcces || niveau !== '3')
    {
        return res.render('pages/403',
        {
            user,
            niveau,
            typeAcces
        });
    }

    const renderData = {
        title: 'Journal',
        user: user,
        typeAcces: typeAcces,
        niveau: niveau
    };

    return res.render('pages/journal', renderData);
});

// Route GET pour la page Alertes (Niveaux 2,3 seulement)
router.get('/alertes', async function (req, res, next)
{
    const user = req.query.user;
    const niveau = req.query.niveau;
    const typeAcces = req.query.typeAcces;

    if (!user || !niveau || !typeAcces || niveau < '2')
    {
        return res.render('pages/403',
        {
            user,
            niveau,
            typeAcces
        });
    }

    const renderData = {
        title: 'Alertes',
        user: user,
        typeAcces: typeAcces,
        niveau: niveau
    };

    return res.render('pages/alertes', renderData);
});

// Route GET pour la page Caméra (Niveaux 1,2,3 seulement)
router.get('/camera', async function (req, res, next)
{
    const user = req.query.user;
    const niveau = req.query.niveau;
    const typeAcces = req.query.typeAcces;

    if (!user || !niveau || !typeAcces || niveau === '0')
    {
        return res.render('pages/403',
        {
            user,
            niveau,
            typeAcces
        });
    }

    const
    {
        scriptUrl
    } = req.app.get('rtspRelay');

    const renderData = {
        title: 'Caméra',
        user: user,
        typeAcces: typeAcces,
        niveau: niveau,
        scriptUrl: scriptUrl
    };

    return res.render('pages/camera', renderData);
});

// Route GET pour la page Profils (Niveau 3 seulement)
router.get('/profils', async function (req, res, next)
{
    const user = req.query.user;
    const niveau = req.query.niveau;
    const typeAcces = req.query.typeAcces;

    if (!user || !niveau || !typeAcces || niveau !== '3')
    {
        return res.render('pages/403',
        {
            user,
            niveau,
            typeAcces
        });
    }

    const renderData = {
        title: 'Profils',
        user: user,
        typeAcces: typeAcces,
        niveau: niveau
    };

    return res.render('pages/profils', renderData);
});

// ===== API Routes pour la gestion des utilisateurs =====

// Liste de tous les utilisateurs
router.get('/api/users/list', async function (req, res)
{
    try
    {
        const users = await requete.getAllUsers();
        res.json(
        {
            success: true,
            users: users
        });
    }
    catch (err)
    {
        console.error('Erreur:', err);
        res.json(
        {
            success: false,
            message: 'Erreur serveur'
        });
    }
});

// Créer un nouvel utilisateur
router.post('/api/users/create', async function (req, res)
{
    try
    {
        const
        {
            username,
            password,
            niveau
        } = req.body;

        if (!username || !password || niveau === undefined)
        {
            return res.json(
            {
                success: false,
                message: 'Données manquantes'
            });
        }

        // Déterminer le typeAcces selon le niveau
        const typeAccesMap = {
            '0': 'Invité',
            '1': 'Utilisateur',
            '2': 'Modérateur',
            '3': 'Administrateur'
        };
        const typeAcces = typeAccesMap[niveau] || 'Utilisateur';

        const created = await requete.createUser(username, password, niveau, typeAcces);
        if (created)
        {
            res.json(
            {
                success: true,
                message: 'Utilisateur créé'
            });
        }
        else
        {
            res.json(
            {
                success: false,
                message: 'Erreur lors de la création'
            });
        }
    }
    catch (err)
    {
        console.error('Erreur:', err);
        res.json(
        {
            success: false,
            message: 'Erreur serveur'
        });
    }
});

// Modifier un utilisateur
router.put('/api/users/update/:id', async function (req, res)
{
    try
    {
        const userId = req.params.id;
        const
        {
            username,
            password,
            niveau
        } = req.body;

        if (!username || !password || niveau === undefined)
        {
            return res.json(
            {
                success: false,
                message: 'Données manquantes'
            });
        }

        // Déterminer le typeAcces selon le niveau
        const typeAccesMap = {
            '0': 'Invité',
            '1': 'Utilisateur',
            '2': 'Modérateur',
            '3': 'Administrateur'
        };
        const typeAcces = typeAccesMap[niveau] || 'Utilisateur';

        const updated = await requete.updateUser(userId, username, password, niveau, typeAcces);
        if (updated)
        {
            res.json(
            {
                success: true,
                message: 'Utilisateur modifié'
            });
        }
        else
        {
            res.json(
            {
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }
    }
    catch (err)
    {
        console.error('Erreur:', err);
        res.json(
        {
            success: false,
            message: 'Erreur serveur'
        });
    }
});

// Supprimer un utilisateur
router.delete('/api/users/delete/:id', async function (req, res)
{
    try
    {
        const userId = req.params.id;

        const deleted = await requete.deleteUser(userId);
        if (deleted)
        {
            res.json(
            {
                success: true,
                message: 'Utilisateur supprimé'
            });
        }
        else
        {
            res.json(
            {
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }
    }
    catch (err)
    {
        console.error('Erreur:', err);
        res.json(
        {
            success: false,
            message: 'Erreur serveur'
        });
    }
});

module.exports = router;
