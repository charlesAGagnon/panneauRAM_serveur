/**
 * @file     contacts.js
 * @author   charles-Antoine Gagnon
 * @version  1
 * @date     18/09/2025
 * @brief    Route pour la page des contacts
 *           Affichage de la liste des contacts utilisateurs
 */

var express = require('express');
var router = express.Router();

router.get('/contacts', function (req, res, next)
{
    res.render('pages/contacts',
    {
        title: 'contacts'
    });
});

module.exports = router;
