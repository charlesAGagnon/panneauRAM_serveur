# PanneauRAM - Documentation Contextuelle pour AI

**Projet:** Système de contrôle industriel pour réservoirs d'eau (Grand Bassin et Petit Bassin)  
**Auteur:** Charles-Antoine Gagnon  
**Version:** 1.0  
**Date:** 2025-12-07

---

## Vue d'ensemble du projet

PanneauRAM est une application web de supervision et contrôle industriel (SCADA) développée pour gérer un système de réservoirs d'eau avec:

- 2 réservoirs principaux (Grand Bassin - GB, Petit Bassin - PB)
- Système de pompes et vannes automatisées
- 6 Raspberry Pi pour différentes fonctions (Balance, Granulaires, etc.)
- Système d'alarmes et réactions automatiques
- Surveillance vidéo RTSP
- Journal de bord complet (commandes et alarmes)
- Gestion multi-utilisateurs avec 4 niveaux d'accès

---

## Architecture technique

### Stack technologique

- **Runtime:** Node.js (CommonJS)
- **Framework web:** Express 5.1.0
- **Templating:** EJS (Embedded JavaScript)
- **Base de données:** MySQL (database: `paneauram`)
- **Communication temps réel:**
  - MQTT 5.14.1 (broker sur localhost:1883)
  - Socket.IO 4.8.1 (WebSocket)
- **Streaming vidéo:** rtsp-relay 1.9.0
- **HTTP client:** Axios 1.13.2
- **WebSocket Express:** express-ws 5.0.2

### Port et configuration

- **Port serveur:** 8080
- **Broker MQTT:** localhost:1883 (configurable vers 172.17.15.91:1883)
- **Caméra RTSP:** rtsp://etudiant:Panneau_RAM@172.17.15.110:554/Streaming/Channels/101
- **BDD MySQL:** host: localhost, user: root, password: rot, database: paneauram

---

## Structure des dossiers

```
web/
├── app.js                    # Point d'entrée principal du serveur
├── package.json              # Dépendances et métadonnées
├── consigne.txt              # Règles de développement importantes
├── models/                   # Logique métier et connexions
│   ├── database.js           # Connexion MySQL
│   ├── journal.js            # Gestion du journal de bord
│   ├── request.js            # Requêtes BDD (utilisateurs, accès)
│   ├── videoStream.js        # Configuration flux RTSP
│   ├── mqtt.js               # MQTT principal (dashboard/panneau)
│   ├── mqtt1.js              # MQTT Raspberry Pi 1 (Balance)
│   ├── mqtt2.js              # MQTT Raspberry Pi 2 (Granulaires)
│   ├── mqtt3.js              # MQTT Raspberry Pi 3
│   ├── mqtt4.js              # MQTT Raspberry Pi 4
│   ├── mqtt5.js              # MQTT Raspberry Pi 5
│   └── mqtt6.js              # MQTT Raspberry Pi 6 (Alarmes)
├── routes/                   # Routeurs Express
│   ├── index.js              # Route d'accueil (login)
│   ├── dashboard.js          # Routes principales (dashboard, journal, profils, API users)
│   ├── raspberrypi.js        # Routes pour les 6 Raspberry Pi
│   ├── camera.js             # Routes caméra
│   └── contacts.js           # Routes page contacts
├── views/                    # Templates EJS
│   ├── error.ejs             # Page d'erreur générique
│   ├── pages/                # Pages principales
│   │   ├── index.ejs         # Page de login
│   │   ├── userNiveau0.ejs   # Dashboard Invité (lecture seule)
│   │   ├── userNiveau1.ejs   # Dashboard Utilisateur
│   │   ├── userNiveau2.ejs   # Dashboard Modérateur
│   │   ├── userNiveau3.ejs   # Dashboard Administrateur
│   │   ├── dashboard.ejs     # Panneau RAM technique
│   │   ├── granulaires.ejs   # Page granulaires
│   │   ├── journal.ejs       # Journal de bord
│   │   ├── alertes.ejs       # Gestion des alertes/alarmes
│   │   ├── camera.ejs        # Surveillance vidéo
│   │   ├── profils.ejs       # Gestion utilisateurs (admin)
│   │   ├── contacts.ejs      # Page contacts
│   │   ├── raspberrypi[1-6].ejs  # Pages individuelles des Pi
│   │   ├── 403.ejs           # Accès refusé
│   │   └── 404.ejs           # Page non trouvée
│   └── partials/             # Composants réutilisables
│       ├── head.ejs          # <head> HTML
│       ├── header.ejs        # En-tête avec infos utilisateur
│       ├── navbar.ejs        # Navigation principale
│       └── footer.ejs        # Pied de page
└── public/                   # Ressources statiques
    ├── stylesheets/          # CSS séparés (voir consigne.txt)
    │   ├── modern.css        # Styles principaux modernes
    │   ├── ui-components.css # Composants UI réutilisables
    │   ├── login.css         # Styles page login
    │   ├── camera.css        # Styles caméra
    │   ├── granulaires.css   # Styles granulaires
    │   └── profils.css       # Styles gestion profils
    ├── scripts/              # JavaScript client-side
    │   ├── dashboard-script.js   # Logique dashboard principal
    │   ├── journal-script.js     # Gestion journal
    │   ├── alertes-script.js     # Gestion alertes
    │   ├── camera-script.js      # Contrôle caméra
    │   └── profils-script.js     # CRUD utilisateurs
    └── images/               # Images et assets
```

---

## Modules principaux

### app.js

Point d'entrée qui:

- Initialise le serveur HTTP sur le port 8080
- Configure Express (views EJS, static files, JSON/URL parsing)
- Initialise le flux vidéo RTSP via `videoStream.js`
- Crée Socket.IO pour communication temps réel
- Initialise 7 handlers MQTT (mqtt.js + mqtt1-6.js)
- Configure les routes (index, contacts, dashboard, raspberrypi, camera)
- Gestion d'erreurs (404, 500)

### models/database.js

- Connexion MySQL simple avec `mysql` package
- Exporte `connection` pour utilisation dans autres modules
- Connexion: `root:rot@localhost/paneauram`

### models/journal.js

Gestion complète du journal de bord avec 2 types d'entrées:

- **LOG_CMD**: Commandes utilisateur (consignes, vannes, etc.)
- **LOG_ALARME**: Alarmes système et reconnaissances

**Fonctions principales:**

- `logCommand(userLogin, commandType, commandValue)` - Enregistre une commande
- `logAlarmReceived(alarmType, reqTime)` - Enregistre une alarme à sa réception
- `logAlarm(userLogin, alarmType, alarmLevel, reqTime)` - Enregistre reconnaissance d'alarme
- `getJournalEntries(filters, callback)` - Récupère entrées avec filtres
- `getJournalStats(callback)` - Statistiques du journal
- `createTableIfNotExists()` - Crée table journal si nécessaire

**Table `journal`:**

```sql
LogID INT AUTO_INCREMENT PRIMARY KEY
Type VARCHAR(20)        -- 'LOG_CMD' ou 'LOG_ALARME'
UserLogin VARCHAR(50)
ReqTime DATETIME
Info TEXT
```

### models/mqtt.js (Dashboard principal)

Handler MQTT pour le panneau de contrôle principal:

**Topics écoutés (états/mesures):**

- `RAM/panneau/etats/NivGB` - Niveau Grand Bassin (%)
- `RAM/panneau/etats/NivPB` - Niveau Petit Bassin (%)
- `RAM/panneau/etats/TmpPB` - Température Petit Bassin
- `RAM/panneau/etats/ValveGB` - État vanne GB (%)
- `RAM/panneau/etats/ValvePB` - État vanne PB (%)
- `RAM/panneau/etats/ValveEC/EF/EEC/EEF` - États vannes entrée/sortie
- `RAM/panneau/etats/Pompe` - État pompe (on/off)
- `RAM/panneau/etats/Mode` - Mode opération (auto/manuel)

**Topics de commande (envoi):**

- `RAM/panneau/cmd/ConsNivGB` - Consigne niveau GB
- `RAM/panneau/cmd/ConsNivPB` - Consigne niveau PB
- `RAM/panneau/cmd/ConsTmpPB` - Consigne température PB
- `RAM/panneau/cmd/ValveXX` - Commandes vannes

**Fonctions:**

- `publish(topic, message)` - Publie message MQTT et log dans journal
- `initializeSocketIO(io)` - Initialise Socket.IO pour diffusion temps réel
- Émet événement `mqtt-data` via Socket.IO à chaque message reçu

### models/mqtt1.js (Raspberry Pi 1 - Balance)

**Topics:**

- `RAM/balance/etats/poids` (float, kg)
- `RAM/balance/etats/tare` (float, kg)
- `RAM/balance/etats/unite` (string)

Émet `mqtt-data-pi1` vers room Socket.IO `pi1`

### models/mqtt2.js (Raspberry Pi 2 - Granulaires)

Gestion des modules granulaires avec états et commandes pour chaque module.

### models/mqtt3-5.js

Handlers MQTT pour Raspberry Pi 3, 4 et 5 (structure similaire).

### models/mqtt6.js (Alarmes et Réactions Automatiques)

Le plus complexe - Gère le système d'alarmes avec réactions automatiques:

**Topics d'alarmes (lecture):**

- `RAM/alarmes/etats/ALR_GB_OVF` - Débordement GB
- `RAM/alarmes/etats/ALR_GB_NIV_MAX` - Niveau max GB
- `RAM/alarmes/etats/ALR_PB_OVF` - Débordement PB
- `RAM/alarmes/etats/ALR_PB_NIV_MAX` - Niveau max PB
- `RAM/alarmes/etats/ALR_CNX_BAL` - Connexion balance
- `RAM/alarmes/etats/ALR_CNX_POW` - Connexion alimentation

**Topics de mesures (pour réactions):**

- `RAM/panneau/etats/NivGB`
- `RAM/panneau/etats/NivPB`

**Topics de configuration (seuils):**

- `RAM/alarmes/cmd/NivLhGB` - Seuil haut GB
- `RAM/alarmes/cmd/TgNivGB` - Seuil garde GB
- `RAM/alarmes/cmd/TrNivGB` - Seuil réduction GB
- `RAM/alarmes/cmd/NivLhPB` - Seuil haut PB
- `RAM/alarmes/cmd/TgNivPB` - Seuil garde PB
- `RAM/alarmes/cmd/TrNivPB` - Seuil réduction PB

**Réactions automatiques:**

- `ALR_GB_OVF` → Réduit ConsNivGB à NivLhGB (valeur configurée)
- `ALR_GB_NIV_MAX` → Réduit ConsNivGB de 10%
- `ALR_PB_OVF` → Réduit ConsNivPB à NivLhPB (valeur configurée)
- `ALR_PB_NIV_MAX` → Réduit ConsNivPB de 10%
- `ALR_CNX_BAL/POW` → Notification seulement (pas d'action auto)

Constante: `REDUCTION_PERCENT = 0.10` (modifiable)

**Fonctions:**

- `handleAlarmReaction(alarmKey)` - Gère les réactions automatiques
- Enregistre automatiquement dans journal via `journalModel.logAlarmReceived()`

### models/videoStream.js

Configure le streaming RTSP:

- URL caméra: `rtsp://etudiant:Panneau_RAM@172.17.15.110:554/Streaming/Channels/101`
- Route WebSocket: `/api/camera/stream`
- Utilise `rtsp-relay` package
- Retourne `scriptUrl` pour inclusion client-side

### models/request.js

Module pour requêtes BDD utilisateurs (à documenter selon implémentation):

- `verifierUtilisateur(username, password)` - Authentification
- `getNiveauAcces(username, password, callback)` - Récupère niveau
- `getAllUsers()` - Liste tous les utilisateurs
- `createUser()` - Création utilisateur
- `updateUser()` - Modification utilisateur
- `deleteUser()` - Suppression utilisateur
- `setUserPassword()` - Changement mot de passe

---

## Routes principales

### routes/index.js

- `GET /` - Page d'accueil (login)

### routes/dashboard.js

Routes principales de l'application:

**Pages:**

- `POST /dashboard` - Authentification et redirection userNiveauX
- `GET /dashboard` - Retour dashboard avec paramètres URL
- `POST /dashboard/changePassword` - Changement mot de passe
- `GET /ram` - Page panneau RAM technique
- `GET /granulaires` - Page granulaires
- `GET /journal` - Journal de bord (niveaux 1-3)
- `GET /alertes` - Gestion alertes (tous niveaux, contrôle selon niveau)
- `GET /camera` - Surveillance vidéo (niveaux 1-3)
- `GET /profils` - Gestion utilisateurs (niveau 3 uniquement)

**API REST:**

- `GET /api/users` - Liste utilisateurs (legacy)
- `GET /api/users/list` - Liste utilisateurs (nouveau)
- `POST /api/users/create` - Créer utilisateur
- `PUT /api/users/update/:id` - Modifier utilisateur
- `DELETE /api/users/delete/:id` - Supprimer utilisateur
- `GET /api/journal` - Récupérer entrées journal avec filtres
- `GET /api/journal/export` - Exporter journal en CSV

### routes/raspberrypi.js

Génère dynamiquement les routes pour les 6 Raspberry Pi:

- `GET /raspberrypi1` à `/raspberrypi6`
- Tous les niveaux (0-3) peuvent LIRE
- Niveaux 1-3 peuvent ÉCRIRE (niveau 0 = lecture seule)
- Passe `canWrite` au template selon niveau

### routes/camera.js

- `GET /camera/view` - Vue caméra
- `GET /camera/test` - Test caméra
- WebSocket: `/api/camera/stream` (configuré dans videoStream.js)

### routes/contacts.js

- `GET /contacts` - Page contacts

---

## Pages web et niveaux d'accès

### Système à 4 niveaux

| Niveau | TypeAcces      | Permissions                                                        |
| ------ | -------------- | ------------------------------------------------------------------ |
| 0      | Invité         | Lecture seule (dashboard, tous les Pi en lecture)                  |
| 1      | Utilisateur    | Lecture + Écriture de base (contrôles limités)                     |
| 2      | Modérateur     | Toutes permissions + configuration alarmes                         |
| 3      | Administrateur | TOUTES permissions + gestion utilisateurs + configuration complète |

### Pages par niveau

**Niveau 0 (Invité) - userNiveau0.ejs:**

- Dashboard avec visualisation cylindres (GB/PB)
- Affichage niveaux, température, états vannes/pompe
- Aucun contrôle interactif
- Accès lecture aux 6 Raspberry Pi
- PAS d'accès: journal, caméra, profils

**Niveau 1 (Utilisateur) - userNiveau1.ejs:**

- Dashboard complet avec contrôles de base
- Modification consignes (ConsNivGB, ConsNivPB, ConsTmpPB)
- Contrôle vannes et pompe (mode manuel)
- Accès: journal, caméra, alertes (lecture), tous les Pi (écriture)
- PAS d'accès: profils, configuration alarmes

**Niveau 2 (Modérateur) - userNiveau2.ejs:**

- Toutes permissions niveau 1
- Configuration des seuils d'alarmes (NivLhGB/PB, TgNivGB/PB, TrNivGB/PB)
- Gestion complète des alertes (reconnaissance, configuration réactions)
- PAS d'accès: profils (gestion utilisateurs)

**Niveau 3 (Administrateur) - userNiveau3.ejs:**

- TOUTES les permissions
- Gestion complète des utilisateurs (CRUD)
- Accès page `/profils` avec:
  - Création utilisateurs
  - Modification utilisateurs (username, password, niveau)
  - Suppression utilisateurs
  - Changement de son propre mot de passe

### Navigation commune (navbar.ejs)

Menu adaptatif selon niveau:

- Accueil (Dashboard)
- Panneau RAM (technique)
- Granulaires
- Journal (niveaux 1-3)
- Alertes (tous niveaux)
- Caméra (niveaux 1-3)
- Raspberry Pi 1-6 (tous niveaux)
- Profils (niveau 3 uniquement)
- Contacts
- Déconnexion

---

## Système de journal de bord

### Types d'entrées

**1. LOG_CMD (Commandes utilisateur)**
Enregistrées via `journalModel.logCommand(userLogin, commandType, commandValue)`:

- Toutes les modifications de consignes (ConsNivGB, ConsNivPB, ConsTmpPB)
- Commandes vannes (ValveGB, ValvePB, ValveEC, etc.)
- Changements de mode (auto/manuel)
- Contrôle pompe

**Format Info:** `Type: ConsNivGB, Valeur: 75`

**2. LOG_ALARME (Alarmes système)**
Deux moments d'enregistrement:

a) **Réception alarme** (automatique par mqtt6.js):

```javascript
journalModel.logAlarmReceived(alarmKey, new Date().toISOString());
// UserLogin = 'SYSTEME'
```

b) **Reconnaissance utilisateur** (via interface alertes):

```javascript
journalModel.logAlarm(userLogin, alarmType, alarmLevel, reqTime);
// Inclut timestamp de reconnaissance
```

**Format Info:** `Type: ALR_GB_OVF, Niveau: Critique, Reconnaissance: 2025-11-23T14:30:00Z`

### Consultation du journal

- Page `/journal` (niveaux 1-3)
- Filtres: date début/fin, utilisateur, type (LOG_CMD/LOG_ALARME)
- Affichage: LogID, Type, Utilisateur, Date/Heure, Information
- Export CSV disponible via `/api/journal/export`
- Limite: 500 entrées les plus récentes

### Statistiques

- Endpoint: `/api/journal/stats`
- Groupement par type et date
- 30 derniers jours

---

## Système d'alarmes et réactions automatiques

### Architecture

Géré entièrement par `models/mqtt6.js` (Raspberry Pi 6):

1. Écoute topics d'alarmes `RAM/alarmes/etats/ALR_*`
2. Écoute mesures actuelles `RAM/panneau/etats/Niv*`
3. Écoute configuration seuils `RAM/alarmes/cmd/*`
4. Détecte activation alarme (transition vers ON)
5. Enregistre dans journal automatiquement
6. Déclenche réaction automatique si applicable
7. Envoie commande MQTT de correction
8. Notifie frontend via Socket.IO (`mqtt-data-alarmes`)

### Types d'alarmes

**1. Débordements (OVF - Overflow):**

- `ALR_GB_OVF` - Grand Bassin déborde
- `ALR_PB_OVF` - Petit Bassin déborde
- **Réaction:** Réduction immédiate au seuil haut configuré (NivLhGB/PB)

**2. Niveaux maximaux:**

- `ALR_GB_NIV_MAX` - GB atteint niveau max
- `ALR_PB_NIV_MAX` - PB atteint niveau max
- **Réaction:** Réduction de 10% du niveau actuel

**3. Connexions:**

- `ALR_CNX_BAL` - Perte connexion balance
- `ALR_CNX_POW` - Perte alimentation
- **Réaction:** Notification uniquement (pas d'action auto)

### Configuration des seuils

Modifiable par niveaux 2-3 via interface alertes:

**Grand Bassin:**

- `NivLhGB` - Niveau Limite Haute (défaut: 90%)
- `TgNivGB` - Niveau de Garde/Alerte (seuil warning)
- `TrNivGB` - Niveau de Réduction (seuil action)

**Petit Bassin:**

- `NivLhPB` - Niveau Limite Haute (défaut: 90%)
- `TgNivPB` - Niveau de Garde/Alerte
- `TrNivPB` - Niveau de Réduction

### Reconnaissance des alarmes

Interface `/alertes` permet:

- Visualisation alarmes actives en temps réel
- Reconnaissance manuelle par utilisateur (niveaux 1-3)
- Enregistrement dans journal avec UserLogin
- Historique des alarmes

### Processus complet

```
1. Capteur détecte condition alarme
2. Raspberry Pi publie: RAM/alarmes/etats/ALR_GB_OVF = ON
3. mqtt6.js reçoit message
4. Détecte transition OFF → ON
5. Enregistre: journalModel.logAlarmReceived('ALR_GB_OVF', timestamp)
6. Exécute: handleAlarmReaction('ALR_GB_OVF')
7. Calcule nouvelle consigne (ex: NivLhGB = 90%)
8. Publie: RAM/panneau/cmd/ConsNivGB = 90
9. mqtt.js reçoit commande, log dans journal
10. Frontend Socket.IO notifié (mqtt-data-alarmes)
11. Interface affiche alarme
12. Utilisateur reconnait alarme (optionnel)
13. Enregistre: journalModel.logAlarm(user, 'ALR_GB_OVF', 'Critique', timestamp)
```

---

## Conventions de code (consigne.txt)

**RÈGLES STRICTES À RESPECTER:**

### 1. Aucun émoji dans le code

```javascript
// ❌ INTERDIT
console.log("✅ Connexion réussie");

// ✓ CORRECT
console.log("Connexion reussie");
```

### 2. Code le plus simple possible

- Éviter la sur-ingénierie
- Privilégier la lisibilité
- Commentaires explicites en français
- Éviter les abstractions complexes inutiles

### 3. CSS dans des fichiers séparés

```javascript
// ❌ INTERDIT
<div style="color: red; font-size: 16px;">

// ✓ CORRECT
<div class="error-message">
// + définir .error-message dans public/stylesheets/
```

### Style de code

- CommonJS (`require`, `module.exports`)
- Indentation: espaces (généralement 4)
- Commentaires JSDoc pour fonctions importantes
- En-têtes de fichier avec @file, @author, @version, @date, @brief

### Organisation CSS

Fichiers CSS thématiques dans `public/stylesheets/`:

- `modern.css` - Styles globaux modernes
- `ui-components.css` - Composants réutilisables (cards, buttons, forms)
- `login.css` - Page de connexion
- `camera.css` - Page caméra
- `granulaires.css` - Page granulaires
- `profils.css` - Gestion utilisateurs

---

## Communication temps réel

### Socket.IO

Architecture événementielle pour diffusion données MQTT vers clients web:

**Événements émis par serveur:**

- `mqtt-data` - Données panneau principal (mqtt.js)
- `mqtt-data-pi1` - Données Raspberry Pi 1 (balance)
- `mqtt-data-pi2` - Données Raspberry Pi 2 (granulaires)
- `mqtt-data-pi3-5` - Données autres Pi
- `mqtt-data-alarmes` - Données alarmes (mqtt6.js)

**Structure message:**

```javascript
{
    topic: 'RAM/panneau/etats/NivGB',
    key: 'NivGB',
    value: 75.5,
    timestamp: '2025-11-23T14:30:00.000Z'
}
```

**Rooms Socket.IO:**

- `pi1` - Clients connectés à Raspberry Pi 1
- `pi2-pi6` - Idem pour autres Pi
- Broadcast global pour mqtt-data principal

**Client-side (scripts):**

```javascript
const socket = io();
socket.on("mqtt-data", function (data) {
  // Mettre à jour interface
  document.getElementById("val-gb").textContent = data.value + "%";
});
```

### MQTT

**Patterns de topics:**

- `RAM/{module}/etats/{capteur}` - Lecture états/mesures
- `RAM/{module}/cmd/{commande}` - Écriture commandes/consignes

**Modules:**

- `panneau` - Système principal (réservoirs, vannes, pompe)
- `alarmes` - Système d'alarmes
- `balance` - Balance (Pi 1)
- `granulaires` - Modules granulaires (Pi 2)

---

## Base de données MySQL

### Connexion

```javascript
// models/database.js
{
    host: 'localhost',
    user: 'root',
    password: 'rot',
    database: 'paneauram'
}
```

### Tables principales

**1. journal**

```sql
CREATE TABLE journal (
    LogID INT AUTO_INCREMENT PRIMARY KEY,
    Type VARCHAR(20),           -- 'LOG_CMD' ou 'LOG_ALARME'
    UserLogin VARCHAR(50),
    ReqTime DATETIME,
    Info TEXT
);
```

**2. utilisateurs (à documenter selon schéma réel)**
Probablement:

- UserID (PK)
- Login/Username
- Password (hash)
- Niveau (0-3)
- TypeAcces (Invité/Utilisateur/Modérateur/Administrateur)

---

## Points d'attention pour développement

### Sécurité

- Authentification basique (améliorer avec bcrypt/JWT)
- Pas de sessions persistantes (params URL)
- Vérifier niveau d'accès dans CHAQUE route
- Valider entrées utilisateur côté serveur

### Performance

- Limite journal: 500 entrées (ajouter pagination si nécessaire)
- Reconnexion MQTT automatique
- Gestion erreurs Socket.IO (reconnexion client)

### Maintenance

- Logs console détaillés (garder pour debug)
- Constantes configurables (REDUCTION_PERCENT, etc.)
- URLs broker MQTT commentées pour bascule prod/dev

### Extension future

- Ajouter plus de Raspberry Pi (dupliquer mqtt7.js, etc.)
- Nouveaux types d'alarmes (modifier mqtt6.js)
- Nouveaux niveaux d'accès (ajouter userNiveau4.ejs)
- Historique graphique des mesures
- Dashboard analytics/statistiques avancées

---

## Commandes utiles

### Développement

```powershell
# Installer dépendances
npm install

# Lancer serveur
node app.js

# Serveur démarre sur http://localhost:8080
```

### Base de données

```sql
-- Créer table journal
CREATE TABLE IF NOT EXISTS journal (
    LogID INT AUTO_INCREMENT PRIMARY KEY,
    Type VARCHAR(20),
    UserLogin VARCHAR(50),
    ReqTime DATETIME,
    Info TEXT
);

-- Voir dernières entrées
SELECT * FROM journal ORDER BY ReqTime DESC LIMIT 50;

-- Statistiques alarmes
SELECT Type, COUNT(*) as count
FROM journal
WHERE Type = 'LOG_ALARME'
GROUP BY Type;
```

### MQTT (test avec mosquitto_pub/sub)

```bash
# Écouter tous les messages
mosquitto_sub -h localhost -t 'RAM/#' -v

# Publier commande test
mosquitto_pub -h localhost -t 'RAM/panneau/cmd/ConsNivGB' -m '75'

# Simuler alarme
mosquitto_pub -h localhost -t 'RAM/alarmes/etats/ALR_GB_OVF' -m 'ON'
```

---

## Flux de données typiques

### 1. Modification consigne par utilisateur

```
User (Niveau 1) → Frontend (dashboard) → Socket.IO emit
→ Serveur reçoit commande → mqtt.js.publish('RAM/panneau/cmd/ConsNivGB', 75)
→ journalModel.logCommand(user, 'ConsNivGB', 75)
→ Broker MQTT → Raspberry Pi reçoit → Actionneur ajuste
→ Raspberry Pi publie nouvel état → mqtt.js reçoit
→ Socket.IO broadcast → Frontend met à jour affichage
```

### 2. Déclenchement alarme automatique

```
Capteur détecte débordement → Raspberry Pi publie ALR_GB_OVF=ON
→ mqtt6.js reçoit → Détecte transition OFF→ON
→ journalModel.logAlarmReceived('ALR_GB_OVF', timestamp)
→ handleAlarmReaction() → Calcule correction
→ mqtt6.js.publish('RAM/panneau/cmd/ConsNivGB', 90)
→ mqtt.js reçoit commande → journalModel.logCommand('SYSTEME', ...)
→ Socket.IO 'mqtt-data-alarmes' → Frontend affiche notification rouge
→ User reconnait alarme → POST /api/alarm/acknowledge
→ journalModel.logAlarm(user, 'ALR_GB_OVF', ...)
```

### 3. Consultation journal

```
User (Niveau 2) → GET /journal → Affiche page
→ Frontend JS → fetch('/api/journal?startDate=...&type=LOG_ALARME')
→ journalModel.getJournalEntries(filters, callback)
→ MySQL SELECT avec WHERE conditions → Résultats JSON
→ Frontend affiche tableau → User clique Export CSV
→ GET /api/journal/export → Génère CSV → Téléchargement
```

---

## Glossaire technique

- **GB** - Grand Bassin (réservoir principal)
- **PB** - Petit Bassin (réservoir secondaire)
- **ConsNiv** - Consigne de Niveau (setpoint)
- **ConsTmp** - Consigne de Température
- **NivLh** - Niveau Limite Haute
- **TgNiv** - Target/Garde Niveau (seuil d'alerte)
- **TrNiv** - Trigger/Réduction Niveau (seuil d'action)
- **OVF** - Overflow (débordement)
- **ALR** - Alarme
- **CNX** - Connexion
- **BAL** - Balance
- **POW** - Power (alimentation)
- **SCADA** - Supervisory Control And Data Acquisition
- **MQTT** - Message Queuing Telemetry Transport
- **RTSP** - Real Time Streaming Protocol
- **EJS** - Embedded JavaScript (templating)

---

## Mise à jour automatique de ce fichier

Ce fichier `.ai-context.md` peut être mis à jour automatiquement à chaque commit Git en utilisant un hook `pre-commit`.

### Configuration Git Hook

**Créer le fichier:** `.git/hooks/pre-commit` (sans extension)

**Rendre exécutable (Linux/Mac):**

```bash
chmod +x .git/hooks/pre-commit
```

**Contenu du hook (PowerShell/cross-platform):**

```powershell
#!/usr/bin/env pwsh
# Git pre-commit hook - Mise à jour automatique .ai-context.md

Write-Host "Mise à jour de .ai-context.md..." -ForegroundColor Cyan

# Récupérer la date actuelle
$date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Analyser les fichiers modifiés
$changedFiles = git diff --cached --name-only

# Si le hook détecte des changements significatifs, mettre à jour
# (Vous pouvez ajouter logique personnalisée ici)

# Ajouter timestamp de mise à jour
$contextFile = ".ai-context.md"
if (Test-Path $contextFile) {
    $content = Get-Content $contextFile -Raw
    $updated = $content -replace "(\*\*Dernière mise à jour:\*\* ).*", "`$1$date"

    # Si pas de ligne "Dernière mise à jour", l'ajouter
    if ($content -notmatch "Dernière mise à jour:") {
        $updated = "**Dernière mise à jour:** $date`n`n" + $content
    }

    Set-Content $contextFile $updated -NoNewline
    git add $contextFile
    Write-Host "✓ .ai-context.md mis à jour et ajouté au commit" -ForegroundColor Green
}

exit 0
```

### Hook alternatif (Shell script pour Linux/Mac)

**Créer:** `.git/hooks/pre-commit`

```bash
#!/bin/bash
# Git pre-commit hook - Mise à jour automatique .ai-context.md

echo "Mise à jour de .ai-context.md..."

DATE=$(date "+%Y-%m-%d %H:%M:%S")
CONTEXT_FILE=".ai-context.md"

if [ -f "$CONTEXT_FILE" ]; then
    # Mettre à jour la date
    sed -i.bak "s/\*\*Dernière mise à jour:\*\* .*/\*\*Dernière mise à jour:\*\* $DATE/" "$CONTEXT_FILE"
    rm -f "${CONTEXT_FILE}.bak"

    # Ajouter au commit
    git add "$CONTEXT_FILE"
    echo "✓ .ai-context.md mis à jour"
fi

exit 0
```

### Script Node.js avancé (update-ai-context.js)

Pour une mise à jour plus intelligente, créer `scripts/update-ai-context.js`:

```javascript
#!/usr/bin/env node
/**
 * Script de mise à jour automatique de .ai-context.md
 * Analyse le projet et met à jour les sections pertinentes
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CONTEXT_FILE = path.join(ROOT, ".ai-context.md");

function analyzeProject() {
  const stats = {
    totalFiles: 0,
    routes: [],
    models: [],
    views: [],
  };

  // Analyser routes/
  const routesDir = path.join(ROOT, "routes");
  if (fs.existsSync(routesDir)) {
    stats.routes = fs.readdirSync(routesDir).filter((f) => f.endsWith(".js"));
    stats.totalFiles += stats.routes.length;
  }

  // Analyser models/
  const modelsDir = path.join(ROOT, "models");
  if (fs.existsSync(modelsDir)) {
    stats.models = fs.readdirSync(modelsDir).filter((f) => f.endsWith(".js"));
    stats.totalFiles += stats.models.length;
  }

  // Analyser views/pages/
  const viewsDir = path.join(ROOT, "views", "pages");
  if (fs.existsSync(viewsDir)) {
    stats.views = fs.readdirSync(viewsDir).filter((f) => f.endsWith(".ejs"));
    stats.totalFiles += stats.views.length;
  }

  return stats;
}

function updateContextFile() {
  if (!fs.existsSync(CONTEXT_FILE)) {
    console.log("❌ .ai-context.md introuvable");
    return false;
  }

  const stats = analyzeProject();
  const date = new Date().toISOString().slice(0, 19).replace("T", " ");

  let content = fs.readFileSync(CONTEXT_FILE, "utf8");

  // Mettre à jour la date
  content = content.replace(/(\*\*Date:\*\*) .*/, `$1 ${date.split(" ")[0]}`);

  // Ajouter section "Dernière analyse" si inexistante
  if (!content.includes("## Dernière analyse automatique")) {
    content += `\n\n---\n\n## Dernière analyse automatique\n\n`;
    content += `**Date:** ${date}\n`;
    content += `**Fichiers analysés:** ${stats.totalFiles}\n`;
    content += `- Routes: ${stats.routes.length}\n`;
    content += `- Models: ${stats.models.length}\n`;
    content += `- Views: ${stats.views.length}\n`;
  } else {
    // Mettre à jour section existante
    content = content.replace(
      /## Dernière analyse automatique[\s\S]*?(?=\n##|$)/,
      `## Dernière analyse automatique\n\n` +
        `**Date:** ${date}\n` +
        `**Fichiers analysés:** ${stats.totalFiles}\n` +
        `- Routes: ${stats.routes.length}\n` +
        `- Models: ${stats.models.length}\n` +
        `- Views: ${stats.views.length}\n`
    );
  }

  fs.writeFileSync(CONTEXT_FILE, content, "utf8");
  console.log("✓ .ai-context.md mis à jour");
  return true;
}

// Exécuter si appelé directement
if (require.main === module) {
  updateContextFile();
}

module.exports = { updateContextFile, analyzeProject };
```

**Hook pre-commit utilisant le script Node.js:**

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Mise à jour de .ai-context.md..."
node scripts/update-ai-context.js

if [ $? -eq 0 ]; then
    git add .ai-context.md
    echo "✓ Contexte AI mis à jour et ajouté au commit"
fi

exit 0
```

### Installation du hook

```powershell
# Windows (PowerShell)
# 1. Créer le fichier .git/hooks/pre-commit (sans extension)
# 2. Copier le contenu du hook PowerShell
# 3. Tester:
git commit -m "Test hook"

# Linux/Mac
chmod +x .git/hooks/pre-commit
git commit -m "Test hook"
```

### Désactiver temporairement le hook

```bash
# Skip le hook pour un commit spécifique
git commit --no-verify -m "Message"
```

---

**Dernière mise à jour:** 2025-12-07 (Génération initiale)

---

_Ce fichier est conçu pour fournir un contexte complet à l'AI lors des interactions futures. Il documente l'architecture, les conventions, et les patterns du projet PanneauRAM sans contenir de code source._

---

## Derniere analyse automatique

**Date:** 2025-12-07 18:19:06
**Fichiers analyses:** 41
- Routes: 5 (camera.js, contacts.js, dashboard.js, index.js, raspberrypi.js)
- Models: 11 (database.js, journal.js, mqtt.js, mqtt1.js, mqtt2.js, mqtt3.js, mqtt4.js, mqtt5.js, mqtt6.js, request.js, videoStream.js)
- Views: 14
- Scripts client: 5
- Stylesheets: 6
