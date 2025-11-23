/**
 * @file profils-script.js
 * @author charles-Antoine Gagnon
 * @version 2
 * @date 14/11/2025
 * @brief Script pour la gestion des profils
 */

console.log('profils-script.js chargé');

let editMode = false;

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', function ()
{
    console.log('DOM chargé, initialisation...');

    // Charger la liste des utilisateurs au démarrage
    loadUsers();

    // Bouton Enregistrer
    const saveBtn = document.getElementById('save-profile');
    if (saveBtn)
    {
        saveBtn.addEventListener('click', handleSave);
    }
    else
    {
        console.error('Bouton save-profile introuvable');
    }

    // Bouton Annuler
    const cancelBtn = document.getElementById('cancel-edit');
    if (cancelBtn)
    {
        cancelBtn.addEventListener('click', resetForm);
    }
});

// Handler pour le bouton Enregistrer
function handleSave()
{
    const userId = document.getElementById('user-id').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const niveau = document.getElementById('niveau').value;

    if (!username || !password)
    {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }

    const userData = {
        username: username,
        password: password,
        niveau: niveau
    };

    if (editMode && userId)
    {
        updateUser(userId, userData);
    }
    else
    {
        createUser(userData);
    }
}

// Créer un utilisateur
function createUser(userData)
{
    fetch('/api/users/create',
        {
            method: 'POST',
            headers:
            {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(response => response.json())
        .then(data =>
        {
            if (data.success)
            {
                alert('Utilisateur créé avec succès');
                resetForm();
                loadUsers();
            }
            else
            {
                alert('Erreur: ' + (data.message || 'Impossible de créer l utilisateur'));
            }
        })
        .catch(error =>
        {
            console.error('Erreur:', error);
            alert('Erreur lors de la création de l utilisateur');
        });
}

// Modifier un utilisateur
function updateUser(userId, userData)
{
    fetch(`/api/users/update/${userId}`,
        {
            method: 'PUT',
            headers:
            {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(response => response.json())
        .then(data =>
        {
            if (data.success)
            {
                alert('Utilisateur modifié avec succès');
                resetForm();
                loadUsers();
            }
            else
            {
                alert('Erreur: ' + (data.message || 'Impossible de modifier l utilisateur'));
            }
        })
        .catch(error =>
        {
            console.error('Erreur:', error);
            alert('Erreur lors de la modification de l utilisateur');
        });
}

// Charger la liste des utilisateurs
function loadUsers()
{
    console.log('Chargement des utilisateurs...');
    fetch('/api/users/list')
        .then(response =>
        {
            console.log('Réponse reçue:', response.status);
            return response.json();
        })
        .then(data =>
        {
            console.log('Données reçues:', data);
            if (data.success)
            {
                displayUsers(data.users);
            }
            else
            {
                console.error('Échec:', data.message);
            }
        })
        .catch(error =>
        {
            console.error('Erreur fetch:', error);
        });
}

// Afficher la liste des utilisateurs
function displayUsers(users)
{
    console.log('Affichage de', users ? users.length : 0, 'utilisateurs');
    const usersList = document.getElementById('users-list');

    if (!usersList)
    {
        console.error('Élément users-list introuvable dans le DOM');
        return;
    }

    if (!users || users.length === 0)
    {
        usersList.innerHTML = '<p style="color: #6b7280; text-align: center;">Aucun utilisateur trouvé</p>';
        return;
    }

    const niveauLabels = {
        '0': 'Invité',
        '1': 'Utilisateur',
        '2': 'Modérateur',
        '3': 'Administrateur'
    };

    usersList.innerHTML = users.map(user => `
        <div class="user-item">
            <div class="user-info">
                <div class="user-name">${user.nom}</div>
                <div class="user-meta">Niveau ${user.niveauAcces} - ${niveauLabels[user.niveauAcces]} | Type: ${user.typeAcces}</div>
            </div>
            <div class="user-actions">
                <button class="btn-icon btn-edit" onclick="editUser(${user.id}, '${user.nom}', '${user.niveauAcces}')">Modifier</button>
                <button class="btn-icon btn-delete" onclick="deleteUser(${user.id}, '${user.nom}')">Supprimer</button>
            </div>
        </div>
    `).join('');

    console.log('Liste affichée avec succès');
}

// Éditer un utilisateur
function editUser(id, username, niveau)
{
    editMode = true;
    document.getElementById('user-id').value = id;
    document.getElementById('username').value = username;
    document.getElementById('password').value = '';
    document.getElementById('niveau').value = niveau;
    document.getElementById('form-title').textContent = 'Modifier un utilisateur';
    document.getElementById('cancel-edit').style.display = 'block';
    window.scrollTo(
    {
        top: 0,
        behavior: 'smooth'
    });
}

// Supprimer un utilisateur
function deleteUser(id, username)
{
    if (!confirm('Êtes-vous sûr de vouloir supprimer l utilisateur "' + username + '" ?'))
    {
        return;
    }

    fetch(`/api/users/delete/${id}`,
        {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data =>
        {
            if (data.success)
            {
                alert('Utilisateur supprimé avec succès');
                loadUsers();
            }
            else
            {
                alert('Erreur: ' + (data.message || 'Impossible de supprimer l utilisateur'));
            }
        })
        .catch(error =>
        {
            console.error('Erreur:', error);
            alert('Erreur lors de la suppression de l utilisateur');
        });
}

// Réinitialiser le formulaire
function resetForm()
{
    editMode = false;
    document.getElementById('user-id').value = '';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('niveau').value = '0';
    document.getElementById('form-title').textContent = 'Créer un utilisateur';
    document.getElementById('cancel-edit').style.display = 'none';
}
