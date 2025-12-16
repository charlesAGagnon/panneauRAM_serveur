/**
 * @file     request.js
 * @author   charles-Antoine Gagnon
 * @version  1
 * @date     18/09/2025
 * @brief    Gestionnaire de requêtes base de données
 *           Opérations CRUD sur les tables user, journal, contacts
 *           Validation et authentification utilisateurs
 */

var database = require('./database');

class Request
{
    constructor()
    {}

    // renvoie Promise<boolean>
    userExists(nom, password)
    {
        const sql = 'SELECT 1 FROM user WHERE nom = ? AND password = ? LIMIT 1;';
        return new Promise(function (resolve, reject)
        {
            database.connection.query(sql, [nom, password], function (err, results)
            {
                if (err) return reject(err);
                resolve(Array.isArray(results) && results.length > 0);
            });
        });
    }

    // renvoie Promise< { id, nom, niveauAcces, typeAcces } | null >
    getUser(nom, password)
    {
        const sql = 'SELECT id, nom, niveauAcces, typeAcces FROM user WHERE nom = ? AND password = ? LIMIT 1;';
        return new Promise(function (resolve, reject)
        {
            database.connection.query(sql, [nom, password], function (err, results)
            {
                if (err) return reject(err);
                if (Array.isArray(results) && results.length > 0) resolve(results[0]);
                else resolve(null);
            });
        });
    }

    // renvoie Promise<boolean> — true si l'utilisateur existe (méthode demandée)
    verifierUtilisateur(nom, password)
    {
        return this.userExists(nom, password);
    }

    // renvoie Promise<string|null> — le nom de l'utilisateur (ou null si non trouvé)
    getUserName(nom, password)
    {
        const sql = 'SELECT nom FROM user WHERE nom = ? AND password = ? LIMIT 1;';
        return new Promise(function (resolve, reject)
        {
            database.connection.query(sql, [nom, password], function (err, results)
            {
                if (err) return reject(err);
                if (Array.isArray(results) && results.length > 0) resolve(results[0].nom);
                else resolve(null);
            });
        });
    }

    // renvoie Promise<string|null> — le niveau d'accès de l'utilisateur (ou null si non trouvé)
    getNiveauAcces(nom, password)
    {
        const sql = 'SELECT niveauAcces FROM user WHERE nom = ? AND password = ? LIMIT 1;';
        return new Promise(function (resolve, reject)
        {
            database.connection.query(sql, [nom, password], function (err, results)
            {
                if (err) return reject(err);
                if (Array.isArray(results) && results.length > 0 && results[0].niveauAcces != null)
                {
                    resolve(String(results[0].niveauAcces));
                }
                else
                {
                    resolve(null); // retourne null si non trouvé
                }
            });
        });
    }

    // getNiveauAcces via callback(err, niveauString|null)
    getNiveauAcces(nom, password, callback)
    {
        const sql = 'SELECT niveauAcces, typeAcces FROM user WHERE nom = ? AND password = ? LIMIT 1;';
        database.connection.query(sql, [nom, password], function (err, results)
        {
            if (err) return callback(err);
            if (Array.isArray(results) && results.length > 0 && results[0].niveauAcces != null)
            {
                callback(null,
                {
                    niveau: String(results[0].niveauAcces),
                    typeAcces: results[0].typeAcces || 'Utilisateur'
                });
            }
            else
            {
                callback(null, null);
            }
        });
    }
    setUserPassword(nom, newPassword)
    {
        const sql = 'UPDATE user SET password = ? WHERE nom = ?;';
        return new Promise(function (resolve, reject)
        {
            database.connection.query(sql, [newPassword, nom], function (err, results)
            {
                if (err) return reject(err);
                resolve(results.affectedRows > 0);
            });
        });
    }

    // renvoie Promise<Array<{id, nom, niveauAcces, typeAcces}>> — tous les utilisateurs
    getAllUsers()
    {
        const sql = 'SELECT id, nom, niveauAcces, typeAcces FROM user ORDER BY nom';
        return new Promise(function (resolve, reject)
        {
            database.connection.query(sql, function (err, results)
            {
                if (err) return reject(err);
                console.log(results);
                resolve(results || []);
            });
        });
    }

    // renvoie Promise<boolean> — true si l'utilisateur a été créé
    createUser(nom, password, niveauAcces, typeAcces)
    {
        const sql = 'INSERT INTO user (nom, password, niveauAcces, typeAcces) VALUES (?, ?, ?, ?)';
        return new Promise(function (resolve, reject)
        {
            database.connection.query(sql, [nom, password, niveauAcces, typeAcces], function (err, results)
            {
                if (err) return reject(err);
                resolve(results.affectedRows > 0);
            });
        });
    }

    // renvoie Promise<boolean> — true si l'utilisateur a été mis à jour
    updateUser(id, nom, password, niveauAcces, typeAcces)
    {
        const sql = 'UPDATE user SET nom = ?, password = ?, niveauAcces = ?, typeAcces = ? WHERE id = ?';
        return new Promise(function (resolve, reject)
        {
            database.connection.query(sql, [nom, password, niveauAcces, typeAcces, id], function (err, results)
            {
                if (err) return reject(err);
                resolve(results.affectedRows > 0);
            });
        });
    }

    // renvoie Promise<boolean> — true si l'utilisateur a été supprimé
    deleteUser(id)
    {
        const sql = 'DELETE FROM user WHERE id = ?';
        return new Promise(function (resolve, reject)
        {
            database.connection.query(sql, [id], function (err, results)
            {
                if (err) return reject(err);
                resolve(results.affectedRows > 0);
            });
        });
    }
}

module.exports = new Request();
