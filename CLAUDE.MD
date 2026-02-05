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
- **Base de Données :** Supabase (PostgreSQL).
- **Emails :** Nodemailer avec Gmail.
- **Hébergement :** Frontend sur Vercel, Backend sur Render.

## 4. Structure de Données & Rôles (Priorité actuelle)

- **Multi-tenancy :** Séparation stricte des données par restaurant.
- **Gestion des Rôles :**
    - **Super Admin :** Accès à tous les restaurants, gestion des abonnements.
    - **Manager :** Peut inviter des employés, configurer les % de Tip Out, valider les rapports.
    - **Serveur :** Peut soumettre ses rapports de Cash Out et consulter son historique.

## 5. Structure du Projet (Monorepo)

```
ShiftClose/
│
├── frontend/                   # Application React (PWA)
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/         # Composants réutilisables
│   │   │   ├── Layout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── BottomNav.jsx
│   │   ├── contexts/           # Contextes React
│   │   │   ├── AuthContext.jsx
│   │   │   └── LanguageContext.jsx
│   │   ├── hooks/              # Hooks personnalisés
│   │   ├── i18n/               # Traductions
│   │   │   ├── index.js
│   │   │   ├── fr.json
│   │   │   └── en.json
│   │   ├── pages/              # Pages de l'app
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CashOut.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── Team.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── Profile.jsx
│   │   ├── services/           # Services API
│   │   ├── utils/              # Utilitaires
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── .env.example
│   └── package.json
│
├── backend/                    # API Node.js/Express
│   ├── src/
│   │   ├── config/             # Configuration
│   │   │   ├── supabase.js     # Supabase Client
│   │   │   └── email.js        # Nodemailer + Gmail
│   │   ├── controllers/        # Logique métier
│   │   │   ├── authController.js
│   │   │   ├── restaurantController.js
│   │   │   ├── reportController.js
│   │   │   └── inviteController.js
│   │   ├── middleware/         # Middleware Express
│   │   │   └── auth.js         # Token + rôles
│   │   ├── routes/             # Routes API
│   │   │   ├── auth.js
│   │   │   ├── restaurants.js
│   │   │   ├── reports.js
│   │   │   └── invitations.js
│   │   └── index.js            # Point d'entrée
│   ├── .env.example
│   └── package.json
│
├── package.json                # Scripts racine (monorepo)
├── .gitignore
├── README.md
└── CLAUDE.MD
```

## 6. Scripts NPM (Racine)

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance frontend + backend en parallèle |
| `npm run dev:frontend` | Lance uniquement le frontend |
| `npm run dev:backend` | Lance uniquement le backend |
| `npm run build` | Build le frontend pour production |
| `npm run install:all` | Installe toutes les dépendances |

---

## Historique des Modifications

### 2026-02-04 - Version 1.0.0 (Initial Release)

**Création initiale du projet :**

1. **Configuration du projet**
   - Initialisation React + Vite
   - Configuration Tailwind CSS v4
   - Configuration PWA (vite-plugin-pwa)
   - Support i18n (react-i18next)

2. **Pages créées**
   - `Login.jsx` - Page de connexion avec support multilingue
   - `Dashboard.jsx` - Tableau de bord avec statistiques
   - `CashOut.jsx` - Formulaire de fermeture de caisse en 4 étapes
   - `Reports.jsx` - Liste et validation des rapports
   - `Team.jsx` - Gestion de l'équipe (Manager only)
   - `Settings.jsx` - Paramètres (langue, notifications, Tip Out)
   - `Profile.jsx` - Profil utilisateur

3. **Composants créés**
   - `Layout.jsx` - Structure principale
   - `Navbar.jsx` - Navigation desktop avec sélecteur de restaurant
   - `BottomNav.jsx` - Navigation mobile (bottom bar)

4. **Fonctionnalités**
   - Thème dark par défaut
   - Design Mobile-First responsive
   - Multilingue FR/EN
   - PWA installable
   - Authentification mock (simulation)
   - Multi-restaurant (switch entre restaurants)

5. **Déploiement**
   - Code poussé sur GitHub : https://github.com/ulfrank2024/Shiftclose

---

### 2026-02-04 - Version 1.1.0 (Backend API)

**Création du backend Node.js/Express :**

1. **Configuration serveur**
   - Express.js avec middleware (cors, helmet, morgan)
   - Firebase Admin SDK pour Firestore et Auth
   - Nodemailer pour les emails

2. **Routes API créées**
   - `POST /api/auth/users` - Création utilisateur
   - `GET /api/auth/profile` - Profil utilisateur
   - `PUT /api/auth/profile` - Mise à jour profil
   - `GET /api/restaurants/my` - Mes restaurants
   - `POST /api/restaurants` - Créer restaurant
   - `GET /api/restaurants/:id` - Détails restaurant
   - `PUT /api/restaurants/:id` - Modifier restaurant
   - `GET /api/restaurants/:id/team` - Équipe
   - `POST /api/reports/:restaurantId` - Créer rapport
   - `GET /api/reports/:restaurantId` - Liste rapports
   - `PUT /api/reports/:id/validate` - Valider rapport
   - `POST /api/invitations/:restaurantId` - Envoyer invitation
   - `POST /api/invitations/accept/:token` - Accepter invitation

3. **Middleware sécurité**
   - Vérification token Firebase
   - Contrôle des rôles (server, manager, superadmin)
   - Accès multi-restaurant

4. **Templates email**
   - Invitation à rejoindre un restaurant
   - Notification de validation de rapport

---

### 2026-02-04 - Version 1.2.0 (Restructuration Monorepo)

**Réorganisation du projet en monorepo :**

1. **Nouvelle structure**
   - Séparation claire `frontend/` et `backend/`
   - Package.json racine avec scripts unifiés
   - README.md dédié pour chaque partie

2. **Scripts racine ajoutés**
   - `npm run dev` - Lance tout en parallèle
   - `npm run dev:frontend` - Frontend seul
   - `npm run dev:backend` - Backend seul
   - `npm run install:all` - Installe tout

3. **Documentation**
   - README.md principal avec vue d'ensemble
   - README.md frontend avec détails techniques
   - README.md backend avec documentation API
   - .env.example pour chaque partie

---

### 2026-02-04 - Version 1.3.0 (Auth JWT + Connexion API)

**Authentification JWT (sans Firebase Auth) :**

1. **Backend - Auth JWT**
   - Ajout bcryptjs pour hash des mots de passe
   - Ajout jsonwebtoken pour génération/vérification tokens
   - Routes `/api/auth/register` et `/api/auth/login`
   - Route `/api/auth/password` pour changer le mot de passe
   - Middleware JWT au lieu de Firebase Auth

2. **Frontend - Services API**
   - Création `services/api.js` avec toutes les fonctions API
   - `authAPI` - register, login, profile, updateProfile
   - `restaurantAPI` - CRUD restaurants
   - `reportAPI` - CRUD rapports
   - `invitationAPI` - gestion invitations

3. **Frontend - AuthContext mis à jour**
   - Connexion réelle au backend
   - Gestion du token JWT dans localStorage
   - Fonctions register, login, logout, refreshUser

4. **Nouvelle page Register**
   - Formulaire d'inscription complet
   - Validation des champs
   - Gestion des erreurs

5. **Firebase utilisé uniquement pour :**
   - Firestore (base de données)
   - Storage (images/fichiers)

---

### 2026-02-05 - Version 1.4.0 (Migration Supabase)

**Migration complète de Firebase vers Supabase :**

1. **Base de données Supabase**
   - Remplacement de Firebase/Firestore par Supabase (PostgreSQL)
   - Création du schéma SQL avec migrations
   - Tables : `users`, `restaurants`, `user_restaurants`, `reports`, `invitations`
   - Relations et clés étrangères configurées
   - Row Level Security (RLS) activée

2. **Backend mis à jour**
   - Nouveau fichier `config/supabase.js` avec client Supabase
   - Suppression de `firebase-admin`, ajout de `@supabase/supabase-js`
   - Tous les contrôleurs migrés vers les requêtes Supabase
   - Middleware auth.js mis à jour pour Supabase

3. **Configuration email Gmail**
   - Nodemailer configuré avec service Gmail
   - Templates email améliorés (responsive, dark theme)
   - Nouveau template de bienvenue

4. **Nouvelles routes API**
   - `DELETE /api/restaurants/:id/team/:userId` - Retirer un membre
   - `PUT /api/restaurants/:id/team/:userId/role` - Modifier rôle membre

5. **Fichiers de migration SQL**
   - `backend/supabase/migrations/001_initial_schema.sql`
   - Instructions pour exécuter dans Supabase Dashboard

**Variables d'environnement mises à jour :**
```
SUPABASE_URL=...
SUPABASE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
NODEMAILER_EMAIL=...
NODEMAILER_PASSWORD=...
FRONTEND_URL=...
```

**Prochaines étapes :**
- Exécuter la migration SQL dans Supabase
- Déploiement Vercel (frontend) + Render (backend)
- Créer le Super Admin initial
- Tests d'intégration
