# Guide de Déploiement de Impact Agent Pro sur Vercel

Ce document détaille les étapes nécessaires pour déployer l'application complète **Impact Agent Pro** sur la plateforme **Vercel**.

## ⚠️ Notes importantes avant le déploiement
1. **Base de données** : L'application utilise MySQL / TiDB. Sur Vercel (qui héberge des fonctions serverless), vous devez disposer d'une base de données MySQL distante accessible en externe (par exemple PlanetScale, Aiven, Supabase PostgreSQL avec adaptation, ou un serveur MySQL distant) et configurer `DATABASE_URL`.
2. **Tâches d'arrière-plan (Cron / Heartbeat)** : Le worker permanent s'exécutant en continu (`setInterval`) ne fonctionne pas de la même manière sur l'architecture Serverless de Vercel. Pour l'automatisation quotidienne, vous devez configurer **Vercel Cron Jobs** dans `vercel.json` pour appeler un endpoint API de déclenchement sécurisé.

---

## Étape 1 : Préparation du projet

Assurez-vous que le fichier de configuration `vercel.json` est présent à la racine du projet :

```json
{
  "version": 2,
  "builds": [
    { "use": "@vercel/static-build", "config": { "distDir": "dist/public" } }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "handle": "filesystem" },
    { "src": "/.*", "dest": "/index.html" }
  ]
}
```

## Étape 2 : Variables d'environnement sur Vercel

Dans le tableau de bord Vercel de votre projet, allez dans **Settings > Environment Variables** et ajoutez :
- `DATABASE_URL` : URL de connexion à votre base MySQL distante.
- `JWT_SECRET` : Clé secrète pour les sessions et le chiffrement des clés API.
- `BUILT_IN_FORGE_API_KEY` : Clé API pour la génération de visuels par IA (si utilisée).

## Étape 3 : Importation sur Vercel

1. Poussez votre code sur un dépôt GitHub (ou utilisez l'interface CLI Vercel).
2. Créez un nouveau projet sur Vercel et importez votre dépôt.
3. Vercel détectera automatiquement la configuration Vite / React.
4. Cliquez sur **Deploy**.
