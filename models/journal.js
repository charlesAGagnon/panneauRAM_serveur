/**
 * @file     journal.js
 * @author   charles-Antoine Gagnon
 * @version  1
 * @date     23/11/2025
 * @brief    Gestionnaire du journal de bord (commandes et alarmes)
 */

const db = require('./database');

/**
 * Ajouter une entrée de commande dans le journal
 * @param {string} userLogin - Login de l'utilisateur
 * @param {string} commandType - Type de commande (ex: "ConsNivGB", "ValveGB", etc.)
 * @param {string} commandValue - Valeur de la commande
 */
function logCommand(userLogin, commandType, commandValue)
{
    const info = `Type: ${commandType}, Valeur: ${commandValue}`;
    const query = 'INSERT INTO journal (Type, UserLogin, ReqTime, Info) VALUES (?, ?, NOW(), ?)';

    db.connection.query(query, ['LOG_CMD', userLogin, info], (err, result) =>
    {
        if (err)
        {
            console.error('Erreur lors de l\'ajout de la commande au journal:', err);
            return;
        }
        console.log(`Journal: Commande enregistrée - ${commandType} = ${commandValue} par ${userLogin}`);
    });
}

/**
 * Ajouter une entrée d'alarme dans le journal
 * @param {string} userLogin - Login de l'utilisateur qui a reconnu l'alarme
 * @param {string} alarmType - Type d'alarme (ex: "ALR_GB_OVF")
 * @param {string} alarmLevel - Niveau de dépassement
 * @param {string} reqTime - DateTime ISO de l'apparition de l'alarme
 */
function logAlarm(userLogin, alarmType, alarmLevel, reqTime)
{
    const ackTime = new Date().toISOString();
    const info = `Type: ${alarmType}, Niveau: ${alarmLevel}, Reconnaissance: ${ackTime}`;
    const query = 'INSERT INTO journal (Type, UserLogin, ReqTime, Info) VALUES (?, ?, ?, ?)';

    db.connection.query(query, ['LOG_ALARME', userLogin, reqTime, info], (err, result) =>
    {
        if (err)
        {
            console.error('Erreur lors de l\'ajout de l\'alarme au journal:', err);
            return;
        }
        console.log(`Journal: Alarme enregistrée - ${alarmType} reconnue par ${userLogin}`);
    });
}

/**
 * Récupérer les entrées du journal avec filtres optionnels
 * @param {Object} filters - Filtres: { startDate, endDate, userLogin, type }
 * @param {Function} callback - Callback (err, results)
 */
function getJournalEntries(filters, callback)
{
    let query = 'SELECT * FROM journal WHERE 1=1';
    const params = [];

    if (filters.startDate)
    {
        query += ' AND ReqTime >= ?';
        params.push(filters.startDate);
    }

    if (filters.endDate)
    {
        query += ' AND ReqTime <= ?';
        params.push(filters.endDate);
    }

    if (filters.userLogin)
    {
        query += ' AND UserLogin = ?';
        params.push(filters.userLogin);
    }

    if (filters.type)
    {
        query += ' AND Type = ?';
        params.push(filters.type);
    }

    query += ' ORDER BY ReqTime DESC LIMIT 500';

    db.connection.query(query, params, callback);
}

/**
 * Récupérer les statistiques du journal
 * @param {Function} callback - Callback (err, results)
 */
function getJournalStats(callback)
{
    const query = `
        SELECT 
            Type,
            COUNT(*) as count,
            DATE(ReqTime) as date
        FROM journal
        GROUP BY Type, DATE(ReqTime)
        ORDER BY date DESC
        LIMIT 30
    `;

    db.connection.query(query, callback);
}

/**
 * Créer la table journal si elle n'existe pas
 */
function createTableIfNotExists()
{
    const query = `
        CREATE TABLE IF NOT EXISTS journal (
            LogID INT AUTO_INCREMENT PRIMARY KEY,
            Type VARCHAR(20) NOT NULL,
            UserLogin VARCHAR(50) NOT NULL,
            ReqTime DATETIME NOT NULL,
            Info VARCHAR(500) NOT NULL,
            INDEX idx_type (Type),
            INDEX idx_user (UserLogin),
            INDEX idx_time (ReqTime)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `;

    db.connection.query(query, (err, result) =>
    {
        if (err)
        {
            console.error('Erreur lors de la création de la table journal:', err);
            return;
        }
        console.log('Table journal vérifiée/créée avec succès');
    });
}

// Créer la table au démarrage
createTableIfNotExists();

module.exports = {
    logCommand,
    logAlarm,
    getJournalEntries,
    getJournalStats
};
