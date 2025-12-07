# 🤖 Documentation AI - PanneauRAM

Ce dossier contient toute la documentation nécessaire pour qu'une Intelligence Artificielle (IA) comprenne et travaille efficacement sur ce projet.

## 📁 Contenu du dossier

### `context.md` ⭐ (Principal)

**Fichier de contexte principal** - À lire en priorité par l'IA

- Vue d'ensemble complète du projet PanneauRAM
- Architecture technique détaillée
- Description de tous les modules et composants
- Conventions de code et règles importantes
- **Mis à jour automatiquement** via Git hook pre-commit

### `AI-CONTEXT-README.md`

Guide complet d'utilisation du système de contexte AI

- Comment utiliser les fichiers de contexte
- Configuration du Git hook
- Exemples d'utilisation avec différentes IA

### `CONTEXTE-AI-SYNTHESE.md`

Synthèse technique détaillée du projet

- Résumé exécutif
- Architecture système
- Détails techniques par module

### `LISEZMOI-CONTEXTE-AI.md`

Version française du guide de démarrage rapide

## 🎯 Utilisation avec une IA

### Pour GitHub Copilot / Claude / ChatGPT:

```
"Lis le fichier .ai/context.md pour comprendre le projet PanneauRAM.
J'ai besoin d'ajouter une fonctionnalité pour..."
```

### Pour les développeurs:

1. Le fichier `context.md` est **automatiquement mis à jour** à chaque commit important
2. Pas besoin de maintenir manuellement la documentation
3. L'IA aura toujours le contexte à jour du projet

## 🔄 Mise à jour automatique

Le fichier `context.md` est mis à jour automatiquement quand vous commitez des changements dans:

- `routes/` - Routes Express
- `models/` - Modèles de données et MQTT
- `views/` - Templates EJS
- `app.js` - Fichier principal
- `package.json` - Dépendances
- `consigne.txt` - Règles du projet

### Script de mise à jour

- **Script**: `../scripts/update-ai-context.js`
- **Hook Git**: `../.git/hooks/pre-commit`
- **Exécution**: Automatique à chaque commit

## 📊 Contenu du fichier context.md

Le fichier principal contient:

1. **Vue d'ensemble du projet**

   - Objectif et contexte
   - Technologies utilisées
   - Architecture système

2. **Structure détaillée**

   - Organisation des dossiers
   - Liste complète des fichiers
   - Rôle de chaque composant

3. **Modules principaux**

   - MQTT (mqtt.js, mqtt1-6.js)
   - Base de données (database.js)
   - Journal de bord (journal.js)
   - Routes et vues

4. **Systèmes clés**

   - Niveaux d'accès utilisateur (0-3)
   - Système d'alarmes
   - Journal de bord (LOG_CMD, LOG_ALARME)
   - Communication MQTT/Socket.IO

5. **Conventions et règles**
   - Pas d'émojis dans le code
   - Code simple et lisible
   - CSS dans des fichiers séparés

## 🚀 Démarrage rapide

1. **Lire le contexte**:

   ```bash
   cat .ai/context.md
   ```

2. **Utiliser avec l'IA**:

   - Mentionnez le fichier dans votre prompt
   - L'IA comprendra instantanément le projet

3. **Développer normalement**:
   - Le contexte se met à jour automatiquement
   - Aucune maintenance manuelle requise

## 🛠️ Maintenance

### Régénérer manuellement le contexte:

```bash
node scripts/update-ai-context.js
```

### Vérifier le hook Git:

```bash
cat .git/hooks/pre-commit
```

### Tester le hook:

```bash
echo "// test" >> app.js
git add app.js
git commit -m "Test hook"
# Le contexte sera mis à jour automatiquement
```

## 📝 Notes importantes

- ⚠️ Ne pas éditer manuellement `context.md` (sera écrasé)
- ✅ Les autres fichiers peuvent être édités
- 🔄 Le dossier `.ai` doit être versionné dans Git
- 📦 Inclus dans les commits automatiquement

## 🤝 Contribution

Quand vous ajoutez de nouvelles fonctionnalités:

1. Commitez normalement votre code
2. Le contexte AI sera mis à jour automatiquement
3. L'IA aura accès aux nouvelles informations au prochain usage

---

**Créé le**: 7 décembre 2025  
**Projet**: PanneauRAM - Système de contrôle industriel  
**Auteur**: Charles-Antoine Gagnon
