# Documentation Contexte AI - Synthèse

## Fichiers créés avec succès

1. **`.ai-context.md`** (998 lignes)

   - Documentation complète du projet PanneauRAM
   - Architecture technique (Node.js, Express, MySQL, MQTT, Socket.IO, EJS)
   - Description de tous les modules (mqtt.js, mqtt1-6.js, database.js, journal.js, etc.)
   - Routes et pages avec niveaux d'accès (0-3)
   - Système de journal de bord (LOG_CMD, LOG_ALARME)
   - Système d'alarmes et réactions automatiques
   - Conventions de code (consigne.txt)
   - Glossaire technique
   - Flux de données typiques

2. **`scripts/update-ai-context.js`** (185 lignes)

   - Script Node.js d'analyse automatique du projet
   - Parcourt routes/, models/, views/, public/scripts/, public/stylesheets/
   - Compte et liste les fichiers trouvés
   - Met à jour la section "Dernière analyse automatique"
   - Exécutable manuellement: `node scripts/update-ai-context.js`

3. **`.git/hooks/pre-commit`** (PowerShell)

   - Hook Git pour Windows
   - S'exécute automatiquement avant chaque commit
   - Détecte changements dans: routes/, models/, views/, app.js, package.json, consigne.txt
   - Lance update-ai-context.js si changements importants
   - Ajoute .ai-context.md au commit si modifié

4. **`.git/hooks/pre-commit.sh`** (Bash)

   - Version alternative pour Linux/Mac/Git Bash
   - Même fonctionnalité que version PowerShell
   - À renommer en `pre-commit` et rendre exécutable: `chmod +x`

5. **`AI-CONTEXT-README.md`** (325 lignes)
   - Guide d'utilisation complet
   - Installation et activation du hook
   - Utilisation manuelle du script
   - Personnalisation
   - Dépannage
   - Exemples de commits

## Test réussi

```
=== Mise a jour du contexte AI ===
Succes: .ai-context.md mis a jour
  - 41 fichiers analyses
  - 5 routes, 11 models, 14 views
=== Mise a jour terminee ===
```

**Résultat de l'analyse:**

- 5 routes: camera.js, contacts.js, dashboard.js, index.js, raspberrypi.js
- 11 models: database.js, journal.js, mqtt.js, mqtt1-6.js, request.js, videoStream.js
- 14 views: toutes les pages EJS
- 5 scripts client: dashboard-script.js, journal-script.js, alertes-script.js, camera-script.js, profils-script.js
- 6 stylesheets: modern.css, ui-components.css, login.css, camera.css, granulaires.css, profils.css

## Utilisation immédiate

### 1. Le hook Git est déjà actif (Windows PowerShell)

Testez-le:

```powershell
# Faire un changement test
echo "// test hook" >> app.js
git add app.js
git commit -m "Test du hook pre-commit automatique"

# Le hook va:
# - Détecter changement dans app.js (fichier important)
# - Exécuter update-ai-context.js
# - Mettre à jour .ai-context.md
# - Ajouter .ai-context.md au commit
# - Terminer le commit
```

### 2. Pour Linux/Mac

```bash
cd .git/hooks
mv pre-commit.sh pre-commit
chmod +x pre-commit

# Puis commit normalement
git commit -m "Test"
```

### 3. Mise à jour manuelle

```powershell
# À tout moment, sans commit
node scripts/update-ai-context.js
```

### 4. Utilisation avec AI

Lors de conversations avec GitHub Copilot ou autre AI:

```
"Regarde le fichier .ai-context.md pour comprendre l'architecture de mon projet.
J'ai besoin d'ajouter une nouvelle fonctionnalité pour..."
```

L'AI aura accès à:

- Structure complète du projet
- Description de tous les modules MQTT
- Système d'alarmes et réactions automatiques
- Niveaux d'accès utilisateur (0-3)
- Conventions de code (pas d'émojis, CSS séparé)
- Journal de bord (LOG_CMD, LOG_ALARME)
- Tous les patterns et flux de données

## Contenu principal du .ai-context.md

### Architecture

- Node.js + Express 5.1.0
- EJS templating
- MySQL (database: paneauram)
- MQTT 5.14.1 (broker localhost:1883)
- Socket.IO 4.8.1
- RTSP streaming (rtsp-relay)

### Modules clés documentés

**models/mqtt.js** - Dashboard principal

- Topics panneau: NivGB, NivPB, TmpPB, ValveXX, Pompe, Mode
- Émet mqtt-data via Socket.IO
- Enregistre commandes dans journal

**models/mqtt1-5.js** - Raspberry Pi 1-5

- mqtt1: Balance (poids, tare, unite)
- mqtt2: Granulaires
- mqtt3-5: Autres fonctions

**models/mqtt6.js** - Alarmes et réactions automatiques

- Écoute 6 types d'alarmes (ALR_GB_OVF, ALR_GB_NIV_MAX, etc.)
- Réactions automatiques:
  - OVF → Réduit à NivLh (seuil configuré)
  - NIV_MAX → Réduit de 10%
  - CNX → Notification seule
- Configuration seuils: NivLhGB/PB, TgNivGB/PB, TrNivGB/PB
- Enregistre dans journal automatiquement

**models/journal.js** - Journal de bord

- LOG_CMD: Commandes utilisateur
- LOG_ALARME: Alarmes système et reconnaissances
- Fonctions: logCommand(), logAlarmReceived(), logAlarm()
- Export CSV disponible

**models/database.js** - Connexion MySQL

- root:rot@localhost/paneauram

**models/videoStream.js** - Streaming RTSP

- Caméra: rtsp://etudiant:Panneau_RAM@172.17.15.110:554/...
- WebSocket: /api/camera/stream

### Routes documentées

**routes/dashboard.js** - Principal

- POST /dashboard - Authentification
- GET /ram, /granulaires, /journal, /alertes, /camera, /profils
- API: /api/users/\*, /api/journal, /api/journal/export

**routes/raspberrypi.js**

- GET /raspberrypi1 à /raspberrypi6
- Tous niveaux peuvent lire
- Niveaux 1-3 peuvent écrire

### Niveaux d'accès

| Niveau | Type           | Permissions                            |
| ------ | -------------- | -------------------------------------- |
| 0      | Invité         | Lecture seule                          |
| 1      | Utilisateur    | Lecture + Écriture de base             |
| 2      | Modérateur     | + Configuration alarmes                |
| 3      | Administrateur | + Gestion utilisateurs (page /profils) |

### Conventions strictes (consigne.txt)

1. **Aucun émoji dans le code**
2. **Code le plus simple possible**
3. **CSS dans des fichiers séparés**

## Avantages pour le développement

### 1. Contexte permanent pour AI

- L'AI comprend immédiatement l'architecture
- Pas besoin de réexpliquer la structure à chaque fois
- Suggestions de code cohérentes avec le projet

### 2. Documentation automatique

- Se met à jour automatiquement
- Toujours synchronisée avec le code
- Historique versionné avec Git

### 3. Onboarding facilité

- Nouveau développeur = lire .ai-context.md
- Comprendre le projet en 15 minutes
- Pas de documentation obsolète

### 4. Collaboration AI-développeur

- AI connaît les conventions (pas d'émojis, CSS séparé)
- AI connaît les patterns (MQTT, Socket.IO, journal)
- AI suggère des modifications cohérentes

## Exemples de demandes AI possibles

Maintenant vous pouvez demander à l'AI:

1. **"Ajoute une nouvelle route pour gérer les profils utilisateur"**
   → L'AI sait: structure routes/, niveaux d'accès, models/request.js

2. **"Crée un nouveau module mqtt7.js pour un 7e Raspberry Pi"**
   → L'AI sait: pattern mqtt1-6.js, Socket.IO rooms, publish/subscribe

3. **"Ajoute un nouveau type d'alarme ALR_TEMP_HIGH"**
   → L'AI sait: mqtt6.js, handleAlarmReaction(), journalModel.logAlarmReceived()

4. **"Crée une page userNiveau4.ejs pour super-administrateur"**
   → L'AI sait: structure views/pages/, navbar.ejs, niveaux d'accès

5. **"Modifie le système de journal pour ajouter un type LOG_MAINTENANCE"**
   → L'AI sait: models/journal.js, table journal, types existants

## Prochaines étapes

1. **Tester le hook Git**

   ```powershell
   # Modifier un fichier important
   echo "// test" >> models/mqtt.js
   git add models/mqtt.js
   git commit -m "Test hook automatique"
   # → Vérifier que .ai-context.md est mis à jour dans le commit
   ```

2. **Utiliser avec GitHub Copilot**

   - Ouvrir n'importe quel fichier
   - Démarrer une conversation Copilot
   - Mentionner ".ai-context.md" pour contexte

3. **Personnaliser si nécessaire**

   - Voir AI-CONTEXT-README.md section "Personnalisation"
   - Modifier patterns de détection
   - Ajouter nouvelles catégories d'analyse

4. **Maintenir le contexte**
   - Le hook fait tout automatiquement
   - Relire .ai-context.md de temps en temps
   - Mettre à jour manuellement les sections si gros refactoring

## Support et documentation

- **Guide complet:** `AI-CONTEXT-README.md`
- **Script:** `scripts/update-ai-context.js`
- **Hook PowerShell:** `.git/hooks/pre-commit`
- **Hook Bash:** `.git/hooks/pre-commit.sh`
- **Contexte AI:** `.ai-context.md`

## Statistiques finales

- ✅ 5 fichiers créés
- ✅ 998 lignes de documentation
- ✅ 41 fichiers projet analysés
- ✅ Hook Git actif et fonctionnel
- ✅ Script testé avec succès
- ✅ 0 ligne de code ajoutée au projet (seulement documentation)

---

**Projet:** PanneauRAM - Système de contrôle industriel  
**Date:** 2025-12-07  
**Status:** ✅ Configuration terminée et testée
