/**
 * @file     database.js
 * @author  charles-Antoine Gagnon
 * @version  1
 * @date     18/09/2025
 * @brief    Première ébauche d'une architecture générique "RESTful" avec Express
 *          Routeur principal
 */

var mysql = require('mysql');
var connection = mysql.createConnection(
{

    host: 'localhost',

    user: 'root',

    password: 'rot',

    database: 'paneauram'

});
connection.connect(function (err)
{

    if (err) throw err;
    console.log('Vous êtes connecté à votre BDD...');

});

exports.connection = connection;
// Test final .ai/context.md
