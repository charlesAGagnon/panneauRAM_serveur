# Configuration du Contexte AI Automatique

Ce dossier contient les outils pour maintenir automatiquement le fichier `.ai-context.md` qui sert de documentation contextuelle pour l'AI.

## Fichiers créés

1. **`.ai-context.md`** (racine du projet)

   - Documentation complète du projet PanneauRAM
   - Architecture, modules, routes, conventions de code
   - Mis à jour automatiquement à chaque commit pertinent

2. **`scripts/update-ai-context.js`**

   - Script Node.js qui analyse le projet
   - Met à jour les statistiques dans `.ai-context.md`
   - Peut être exécuté manuellement ou via Git hook

3. **`.git/hooks/pre-commit`** (PowerShell)

   - Hook Git pour Windows/PowerShell
   - S'exécute automatiquement avant chaque commit
   - Détecte les changements importants (routes/, models/, views/, etc.)
   - Met à jour `.ai-context.md` si nécessaire

4. **`.git/hooks/pre-commit.sh`** (Bash)
   - Version alternative pour Linux/Mac/Git Bash
   - Même fonctionnalité que la version PowerShell

## Installation et activation

### Windows (PowerShell)

Le hook PowerShell est déjà installé à `.git/hooks/pre-commit`.

**Test:**

```powershell
# Faire un changement test
echo "// test" >> app.js
git add app.js
git commit -m "Test du hook pre-commit"

# Vérifier que .ai-context.md a été mis à jour
git log -1 --stat
```

### Linux/Mac (Bash)

```bash
# Utiliser la version .sh et rendre exécutable
cd .git/hooks
mv pre-commit.sh pre-commit
chmod +x pre-commit

# Test
echo "// test" >> app.js
git add app.js
git commit -m "Test du hook pre-commit"
```

### Git Bash sous Windows

```bash
# Dans Git Bash
cd .git/hooks
chmod +x pre-commit.sh
mv pre-commit.sh pre-commit

# Test
git commit -m "Test"
```

## Utilisation manuelle

### Mettre à jour le contexte AI sans commit

```powershell
# Exécuter le script directement
node scripts/update-ai-context.js
```

Cela analysera le projet et mettra à jour `.ai-context.md` avec:

- Nombre total de fichiers
- Liste des routes, models, views, scripts, stylesheets
- Date et heure de la dernière analyse

### Désactiver temporairement le hook

```bash
# Pour un commit spécifique, ignorer le hook
git commit --no-verify -m "Commit sans mise à jour contexte"

# Ou renommer temporairement le hook
mv .git/hooks/pre-commit .git/hooks/pre-commit.disabled
# ... faire vos commits ...
mv .git/hooks/pre-commit.disabled .git/hooks/pre-commit
```

### Désactiver définitivement

```bash
# Supprimer le hook
rm .git/hooks/pre-commit
```

## Fonctionnement du système

### 1. Détection automatique

Le hook détecte les changements dans:

- `routes/` - Nouvelles routes ou modifications
- `models/` - Nouveaux modèles ou changements
- `views/` - Nouveaux templates ou modifications
- `app.js` - Point d'entrée principal
- `package.json` - Dépendances
- `consigne.txt` - Règles de développement

### 2. Analyse du projet

Le script `update-ai-context.js`:

- Parcourt la structure du projet
- Compte les fichiers dans chaque catégorie
- Liste les fichiers trouvés
- Génère des statistiques

### 3. Mise à jour du contexte

Met à jour automatiquement:

- Section "Dernière analyse automatique"
- Date de dernière mise à jour
- Statistiques de fichiers
- Liste des composants

### 4. Ajout au commit

Si le contexte est modifié, il est automatiquement:

- Ajouté au staging area (`git add .ai-context.md`)
- Inclus dans le commit en cours

## Personnalisation

### Modifier les patterns de détection

Éditer `.git/hooks/pre-commit`:

```powershell
# Ajouter d'autres patterns
$importantPatterns = @(
    'routes/',
    'models/',
    'views/',
    'app.js',
    'package.json',
    'consigne.txt',
    'public/scripts/',  # Nouveau pattern
    'config/'            # Nouveau pattern
)
```

### Personnaliser l'analyse

Éditer `scripts/update-ai-context.js`:

```javascript
function analyzeProject() {
  const stats = {
    // Ajouter nouvelles catégories
    configs: [],
    tests: [],
  };

  // Ajouter analyse de nouveaux dossiers
  const configsDir = path.join(ROOT, "config");
  if (fs.existsSync(configsDir)) {
    stats.configs = fs.readdirSync(configsDir);
  }

  return stats;
}
```

### Modifier le format de sortie

Dans `update-ai-context.js`, section `analysisSection`:

```javascript
const analysisSection =
  `## Derniere analyse automatique\n\n` +
  `**Date:** ${datetime}\n` +
  `**Fichiers analyses:** ${stats.totalFiles}\n` +
  `- Routes: ${stats.routes.length}\n` +
  // Ajouter vos propres lignes
  `- Configurations: ${stats.configs.length}\n` +
  `- Tests: ${stats.tests.length}\n`;
```

## Dépannage

### Le hook ne s'exécute pas

```powershell
# Vérifier que le fichier existe
Test-Path .git/hooks/pre-commit

# Vérifier les permissions (Linux/Mac)
ls -la .git/hooks/pre-commit
# Doit être exécutable (-rwxr-xr-x)
chmod +x .git/hooks/pre-commit
```

### Erreur "node: command not found"

Le hook nécessite Node.js installé et dans le PATH.

```powershell
# Vérifier installation Node.js
node --version

# Si non installé, télécharger depuis https://nodejs.org/
```

### Le contexte n'est pas mis à jour

```powershell
# Exécuter manuellement pour voir les erreurs
node scripts/update-ai-context.js

# Vérifier les logs du hook
git commit -m "Test" -v
```

### Conflit de merge sur .ai-context.md

```bash
# En cas de conflit sur .ai-context.md lors d'un merge
git checkout --theirs .ai-context.md
git add .ai-context.md

# Puis régénérer
node scripts/update-ai-context.js
git add .ai-context.md
git commit
```

## Utilisation avec l'AI

### Fournir le contexte à l'AI

Lors d'une conversation avec GitHub Copilot ou autre AI:

```
"Voici le contexte de mon projet (voir .ai-context.md).
J'ai besoin d'ajouter une nouvelle route pour gérer les profils utilisateur."
```

L'AI aura accès à:

- Architecture complète du projet
- Conventions de code (pas d'émojis, CSS séparé, etc.)
- Structure des modules MQTT
- Système d'alarmes
- Niveaux d'accès utilisateur
- Patterns de code existants

### Régénérer le contexte complet

Si vous avez fait de gros changements et voulez refaire toute la documentation:

1. Éditer `.ai-context.md` manuellement ou demander à l'AI
2. Commiter les changements
3. Le hook mettra à jour seulement la section "Dernière analyse"

## Maintenance

### Mise à jour du script

Le script peut être amélioré pour:

- Analyser les dépendances `package.json`
- Extraire les commentaires JSDoc
- Générer un graphe de dépendances
- Détecter les TODO et FIXME
- Analyser la complexité du code

### Versionner le contexte

Le fichier `.ai-context.md` est versionné avec Git, donc:

- Historique complet des changements
- Possibilité de revenir à une version précédente
- Collaboration facilitée (merge des contextes)

## Exemples de commits

```bash
# Commit normal - Hook s'exécute
git add routes/dashboard.js
git commit -m "Ajout route export journal CSV"
# → .ai-context.md mis à jour automatiquement

# Commit sans changement important - Hook ignore
git add README.md
git commit -m "Mise à jour documentation"
# → .ai-context.md non modifié

# Commit multiple avec changements importants
git add models/mqtt7.js routes/raspberrypi.js
git commit -m "Ajout support Raspberry Pi 7"
# → .ai-context.md mis à jour avec nouveaux fichiers
```

## Ressources

- [Git Hooks Documentation](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
- [Node.js File System](https://nodejs.org/api/fs.html)
- [GitHub Copilot Best Practices](https://docs.github.com/en/copilot)

---

**Créé:** 2025-12-07  
**Projet:** PanneauRAM - Système de contrôle industriel  
**Auteur:** AI Assistant
