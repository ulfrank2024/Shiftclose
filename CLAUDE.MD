# CLAUDE.md

- Réponds toujours en français.
- a chaque modification ou avancement du projet note ca dans ton fichier
  chaque fois tu fait une mise ajour ou ajustement a la fin deploi sur github
  echo "# Shiftclose" >> README.md
  git init
  git add README.md
  git commit -m "first commit"
  git branch -M main
  git remote add origin https://github.com/ulfrank2024/Shiftclose.git
  git push -u origin main
- a chaque fois que tu cree une nouvelle page ajuste ca aussi pour le mode mobile
- Le projet doit etres toujour en deux langue francais et anglais
- le projet doit pouvopir etre telechargable pour ios , android , windows, mac d on sa doit etre un PWG
- sache tu a carte blanche pour optimiser le projet si j oublie des detail ou fonstionnalite qui peuve demarque ce beau projet
  -theme du projet dark
- pour les differente migration de la base de donne c est tres importatnt de les bien ranger

## 0. Aperçu du Projet (Vision)

**Nom de l'application :** ShiftClose (anciennement Settle)
**C'est quoi ? :** Une application SaaS de gestion de "Cash Out" pour la restauration.
**Problème résolu :** Le stress et les erreurs de calcul lors de la fermeture de caisse en fin de service.
**Utilisateurs cibles :** 1. **Serveurs :** Pour calculer rapidement leurs ventes, leurs pourboires à partager (Tip Out) et équilibrer leur caisse. 2. **Managers :** Pour valider les rapports des employés en 10 secondes et centraliser les données de fin de journée. 3. **Super Admin :** Pour gérer les licences des différents restaurants (ex: Jimmies Pizza, etc.) et superviser le système.

# CLAUDE.md - Projet : ShiftClose

## 0. Aperçu du Projet (Vision)

**Nom de l'application :** ShiftClose
**Concept :** Solution SaaS de gestion de "Cash Out" et de fin de service pour la restauration.
**Objectif :** Éliminer les erreurs de calcul manuel, automatiser le partage des pourboires (Tip Out) et accélérer la fermeture de caisse.
**Utilisateurs :** 1. **Serveurs :** Saisissent leurs chiffres et calculent leurs parts à redistribuer. 2. **Managers :** Valident les rapports et gèrent les finances du restaurant. 3. **Super Admin (Moi) :** Contrôle total, gestion des abonnements clients et statistiques globales.

## 1. Directives de Communication

- **Langue :** Réponds TOUJOURS en français.
- **Suivi :** À chaque modification, mets à jour la section "Historique" en bas de ce fichier.
- **Déploiement :** Après chaque ajustement majeur, prépare le commit et le déploiement (GitHub/Vercel/Render).

## 2. Standards de Développement & UX

- **Mobile-First :** Interface optimisée pour smartphone (PWA), car les serveurs utilisent l'app en mouvement.
- **Multilingue :** Support complet Français/Anglais (i18n).
- **Format PWA :** Doit être installable sur iOS, Android, Windows et Mac.
- **Multi-établissement :** Un utilisateur (Serveur/Manager) peut être lié à plusieurs restaurants et basculer entre eux.

## 3. Stack Technique

- **Frontend :** React.js + Tailwind CSS.
- **Backend :** Node.js + Express.
- **Base de Données :** Firebase (Firestore pour les données, Auth pour la sécurité).
- **Emails :** Nodemailer (pour les invitations et rapports).
- **Hébergement :** Frontend sur Vercel, Backend sur Render.

## 4. Structure de Données & Rôles (Priorité actuelle)

- **Multi-tenancy :** Séparation stricte des données par restaurant.
- **Gestion des Rôles :**
    - **Super Admin :** Accès à tous les restaurants, gestion des abonnements.
    - **Manager :** Peut inviter des employés, configurer les % de Tip Out, valider les rapports.
    -
