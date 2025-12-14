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
    // Vérifier que l'utilisateur existe avant d'insérer
    const checkUserQuery = 'SELECT nom FROM user WHERE nom = ?';

    db.connection.query(checkUserQuery, [userLogin], (err, results) =>
    {
        if (err)
        {
            console.error('Erreur vérification utilisateur pour journal:', err);
            return;
        }

        if (!results || results.length === 0)
        {
            console.warn(`Journal: Utilisateur ${userLogin} n'existe pas, commande non enregistrée`);
            return;
        }

        // Utilisateur existe, on peut enregistrer la commande
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
    });
}

/**
 * FONCTION DÉSACTIVÉE - Les alarmes ne sont plus loggées automatiquement
 * Ajouter une entrée d'alarme reçue dans le journal (à la réception)
 * @param {string} alarmType - Type d'alarme (ex: "ALR_GB_OVF")
 * @param {string} reqTime - DateTime ISO de l'apparition de l'alarme
 */
function logAlarmReceived(alarmType, reqTime)
{
    console.warn('[Journal] logAlarmReceived() est désactivée - Les alarmes ne sont plus loggées automatiquement');
    // Cette fonction ne fait plus rien - les alarmes sont loggées uniquement lors de l'ACK utilisateur
}

/**
 * Ajouter une entrée d'alarme dans le journal lors de la reconnaissance par un utilisateur
 * @param {string} userLogin - Login de l'utilisateur qui a reconnu l'alarme
 * @param {string} alarmType - Type d'alarme (ex: "ALR_GB_OVF")
 * @param {string} alarmLevel - Niveau de dépassement
 * @param {string} reqTime - DateTime ISO de l'apparition de l'alarme
 */
function logAlarmAck(userLogin, alarmType, alarmLevel, reqTime)
{
    // Vérifier que l'utilisateur existe avant d'insérer
    const checkUserQuery = 'SELECT nom FROM user WHERE nom = ?';

    db.connection.query(checkUserQuery, [userLogin], (err, results) =>
    {
        if (err)
        {
            console.error('Erreur vérification utilisateur pour alarme ACK:', err);
            return;
        }

        if (!results || results.length === 0)
        {
            console.warn(`Journal: Utilisateur ${userLogin} n'existe pas, alarme non enregistrée`);
            return;
        }

        // Utilisateur existe, on peut enregistrer l'ACK de l'alarme
        const ackTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const info = `Alarme: ${alarmType}, ACK: ${ackTime}`;
        const mysqlDateTime = new Date(reqTime).toISOString().slice(0, 19).replace('T', ' ');
        const query = 'INSERT INTO journal (Type, UserLogin, ReqTime, Info) VALUES (?, ?, ?, ?)';

        db.connection.query(query, ['LOG_ALARME', userLogin, mysqlDateTime, info], (err, result) =>
        {
            if (err)
            {
                console.error('Erreur lors de l\'ajout de l\'alarme ACK au journal:', err);
                return;
            }
            console.log(`Journal: Alarme ACK enregistrée - ${alarmType} reconnue par ${userLogin} (LogID: ${result.insertId})`);
        });
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
    logAlarmAck,
    getJournalEntries,
    getJournalStats
};
// Test nouveau chemin .ai/
