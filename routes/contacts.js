/**
 * @file     index.js
 * @author  charles-Antoine Gagnon
 * @version  1
 * @date     18/09/2025
 * @brief    Première ébauche d'une architecture générique "RESTful" avec Express
 *          Routeur principal
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
