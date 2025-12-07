#!/usr/bin/env node

/**
 * @file     update-ai-context.js
 * @author   AI Assistant
 * @version  1.0
 * @date     2025-12-07
 * @brief    Script de mise à jour automatique de .ai-context.md
 *           Analyse le projet et met à jour les sections pertinentes
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONTEXT_FILE = path.join(ROOT, '.ai-context.md');

/**
 * Analyse la structure du projet
 * @returns {Object} Statistiques du projet
 */
function analyzeProject()
{
    const stats = {
        totalFiles: 0,
        routes: [],
        models: [],
        views: [],
        scripts: [],
        stylesheets: []
    };

    try
    {
        // Analyser routes/
        const routesDir = path.join(ROOT, 'routes');
        if (fs.existsSync(routesDir))
        {
            stats.routes = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
            stats.totalFiles += stats.routes.length;
        }

        // Analyser models/
        const modelsDir = path.join(ROOT, 'models');
        if (fs.existsSync(modelsDir))
        {
            stats.models = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));
            stats.totalFiles += stats.models.length;
        }

        // Analyser views/pages/
        const viewsDir = path.join(ROOT, 'views', 'pages');
        if (fs.existsSync(viewsDir))
        {
            stats.views = fs.readdirSync(viewsDir).filter(f => f.endsWith('.ejs'));
            stats.totalFiles += stats.views.length;
        }

        // Analyser public/scripts/
        const scriptsDir = path.join(ROOT, 'public', 'scripts');
        if (fs.existsSync(scriptsDir))
        {
            stats.scripts = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.js'));
            stats.totalFiles += stats.scripts.length;
        }

        // Analyser public/stylesheets/
        const stylesDir = path.join(ROOT, 'public', 'stylesheets');
        if (fs.existsSync(stylesDir))
        {
            stats.stylesheets = fs.readdirSync(stylesDir).filter(f => f.endsWith('.css'));
            stats.totalFiles += stats.stylesheets.length;
        }
    }
    catch (error)
    {
        console.error('Erreur lors de l\'analyse du projet:', error.message);
    }

    return stats;
}

/**
 * Détecte les changements significatifs dans les fichiers modifiés
 * @param {Array<string>} changedFiles - Liste des fichiers modifiés
 * @returns {boolean} True si changements significatifs détectés
 */
function hasSignificantChanges(changedFiles)
{
    const significantPatterns = [
        /^routes\//,
        /^models\//,
        /^views\//,
        /^app\.js$/,
        /^package\.json$/,
        /^consigne\.txt$/
    ];

    return changedFiles.some(file =>
        significantPatterns.some(pattern => pattern.test(file))
    );
}

/**
 * Met à jour le fichier .ai-context.md
 * @returns {boolean} True si mise à jour réussie
 */
function updateContextFile()
{
    if (!fs.existsSync(CONTEXT_FILE))
    {
        console.log('Erreur: .ai-context.md introuvable');
        return false;
    }

    try
    {
        const stats = analyzeProject();
        const now = new Date();
        const date = now.toISOString().slice(0, 10); // YYYY-MM-DD
        const datetime = now.toISOString().slice(0, 19).replace('T', ' '); // YYYY-MM-DD HH:MM:SS

        let content = fs.readFileSync(CONTEXT_FILE, 'utf8');

        // Mettre à jour la date principale
        content = content.replace(
            /(\*\*Date:\*\*) .*/,
            `$1 ${date}`
        );

        // Mettre à jour ou ajouter la section "Dernière analyse automatique"
        const analysisSection =
            `## Derniere analyse automatique\n\n` +
            `**Date:** ${datetime}\n` +
            `**Fichiers analyses:** ${stats.totalFiles}\n` +
            `- Routes: ${stats.routes.length} (${stats.routes.join(', ')})\n` +
            `- Models: ${stats.models.length} (${stats.models.join(', ')})\n` +
            `- Views: ${stats.views.length}\n` +
            `- Scripts client: ${stats.scripts.length}\n` +
            `- Stylesheets: ${stats.stylesheets.length}\n`;

        if (content.includes('## Derniere analyse automatique'))
        {
            // Remplacer section existante
            content = content.replace(
                /## Derniere analyse automatique[\s\S]*?(?=\n##|$)/,
                analysisSection
            );
        }
        else
        {
            // Ajouter nouvelle section à la fin
            content = content.trimEnd() + '\n\n---\n\n' + analysisSection;
        }

        // Mettre à jour "Dernière mise à jour" si existe
        if (content.includes('**Derniere mise a jour:**'))
        {
            content = content.replace(
                /(\*\*Derniere mise a jour:\*\*) .*/,
                `$1 ${datetime}`
            );
        }

        fs.writeFileSync(CONTEXT_FILE, content, 'utf8');
        console.log('Succes: .ai-context.md mis a jour');
        console.log(`  - ${stats.totalFiles} fichiers analyses`);
        console.log(`  - ${stats.routes.length} routes, ${stats.models.length} models, ${stats.views.length} views`);
        return true;
    }
    catch (error)
    {
        console.error('Erreur lors de la mise a jour:', error.message);
        return false;
    }
}

/**
 * Point d'entrée principal
 */
function main()
{
    console.log('=== Mise a jour du contexte AI ===');

    // Vérifier si exécuté depuis Git hook
    const isGitHook = process.env.GIT_INDEX_FILE !== undefined;

    if (isGitHook)
    {
        console.log('Execution depuis Git hook pre-commit');
    }

    const success = updateContextFile();

    if (success)
    {
        console.log('=== Mise a jour terminee ===');
        process.exit(0);
    }
    else
    {
        console.log('=== Echec de la mise a jour ===');
        process.exit(1);
    }
}

// Exporter fonctions pour tests
module.exports = {
    updateContextFile,
    analyzeProject,
    hasSignificantChanges
};

// Exécuter si appelé directement
if (require.main === module)
{
    main();
}
