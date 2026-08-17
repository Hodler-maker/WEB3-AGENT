# Project TODO - Impact Agent Web3

- [x] Modéliser la base de données (sources RSS, posts publiés, secrets chiffrés, logs d'exécution)
- [x] Mettre en place le stockage sécurisé des clés API (LinkedIn, Groq) côté serveur
- [x] Développer le moteur de veille RSS multilingue et persistant (anti-doublons en DB)
- [x] Intégrer l'IA Groq (Llama 3.3) pour la traduction, la synthèse et la rédaction Master Class
- [x] Intégrer la génération automatique de visuels via IA (1200x627) au lieu de Pillow local
- [x] Implémenter la publication LinkedIn (partage de post + source en premier commentaire)
- [x] Implémenter le cron de planification et les notifications propriétaire
- [x] Développer l'interface rétro-futuriste (scanlines, aberration chromatique, monochrome blanc/néon)
- [x] Intégrer la connexion Wallet Web3 (MetaMask/WalletConnect)
- [x] Créer le tableau de bord, les pages de configuration RSS et des secrets, et le bouton "Publier maintenant"
- [x] Rédiger les tests unitaires vitest et valider le bon fonctionnement

- [x] Renouveler le thème de l'application vers une esthétique "Editorial Tech Pro" (lumineuse, épurée, moderne)
- [x] Étendre le générateur de texte Groq pour produire des tribunes de 800 à 1000 mots (articles longs approfondis)
- [x] Implémenter une vérification stricte anti-doublons (URL exacte, similarité de titre et de mots-clés thématiques en DB)

- [x] Mettre à jour le schéma Drizzle pour associer les sources RSS, les posts et les paramètres utilisateur à un `userId`
- [x] Implémenter l'isolation complète des données par compte utilisateur dans les procédures tRPC
- [x] Ajouter la vérification cryptographique des signatures Web3 (EIP-191) pour associer un portefeuille aux données utilisateur
- [x] Restreindre toutes les actions d'écriture, de configuration et de déclenchement aux utilisateurs authentifiés

- [x] Vérifier que le build de production (Vite + esbuild) s'exécute sans erreur
- [x] Confirmer que l'application complète est déployée sur son domaine permanent et accessible
