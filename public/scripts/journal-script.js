/**
 * @file journal-script.js
 * @author charles-Antoine Gagnon
 * @version 1
 * @date 23/11/2025
 * @brief Script pour la page Journal
 */

// Charger la liste des utilisateurs dans le dropdown
function loadUsers()
{
    fetch('/api/users')
        .then(response => response.json())
        .then(data =>
        {
            if (data.success && data.users)
            {
                const select = document.getElementById('user-filter');
                data.users.forEach(user =>
                {
                    const option = document.createElement('option');
                    option.value = user.nom;
                    option.textContent = `${user.nom} (Niveau ${user.niveauAcces})`;
                    select.appendChild(option);
                });
            }
        })
        .catch(error =>
        {
            console.error('Erreur chargement utilisateurs:', error);
        });
}

document.addEventListener('DOMContentLoaded', function ()
{
    loadUsers();
    loadJournal();

    // Event listeners pour les filtres
    document.getElementById('filter-form').addEventListener('submit', function (e)
    {
        e.preventDefault();
        loadJournal();
    });

    document.getElementById('btn-reset').addEventListener('click', function ()
    {
        document.getElementById('filter-form').reset();
        loadJournal();
    });

    document.getElementById('btn-export').addEventListener('click', exportToCSV);
});

// Charger les entrées du journal
function loadJournal()
{
    const filters = {
        startDate: document.getElementById('start-date').value,
        endDate: document.getElementById('end-date').value,
        userLogin: document.getElementById('user-filter').value,
        type: document.getElementById('type-filter').value
    };

    const queryString = new URLSearchParams(filters).toString();

    fetch(`/api/journal?${queryString}`)
        .then(response => response.json())
        .then(data =>
        {
            if (data.success)
            {
                displayJournal(data.entries);
            }
            else
            {
                console.error('Erreur:', data.message);
                alert('Erreur lors du chargement du journal');
            }
        })
        .catch(error =>
        {
            console.error('Erreur fetch:', error);
            alert('Erreur de connexion au serveur');
        });
}

// Afficher les entrées du journal
function displayJournal(entries)
{
    const tbody = document.getElementById('journal-tbody');
    tbody.innerHTML = '';

    if (!entries || entries.length === 0)
    {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Aucune entrée trouvée</td></tr>';
        return;
    }

    entries.forEach(entry =>
    {
        const row = document.createElement('tr');

        const typeClass = entry.Type === 'LOG_CMD' ? 'badge-info' : 'badge-warning';
        const typeLabel = entry.Type === 'LOG_CMD' ? 'Commande' : 'Alarme';

        const date = new Date(entry.ReqTime);
        const formattedDate = date.toLocaleString('fr-CA');

        row.innerHTML = `
            <td>${entry.LogID}</td>
            <td><span class="badge ${typeClass}">${typeLabel}</span></td>
            <td><strong>${entry.UserLogin}</strong></td>
            <td>${formattedDate}</td>
            <td style="max-width: 400px; word-wrap: break-word;">${entry.Info}</td>
        `;

        tbody.appendChild(row);
    });
}

// Exporter en CSV
function exportToCSV()
{
    const filters = {
        startDate: document.getElementById('start-date').value,
        endDate: document.getElementById('end-date').value,
        userLogin: document.getElementById('user-filter').value,
        type: document.getElementById('type-filter').value
    };

    const queryString = new URLSearchParams(filters).toString();
    window.open(`/api/journal/export?${queryString}`, '_blank');
}
