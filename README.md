# ShiftClose

Application SaaS de gestion de "Cash Out" pour la restauration.

## Description

ShiftClose aide les serveurs et managers de restaurants à gérer efficacement la fermeture de caisse en fin de service :
- Calcul automatique des ventes et pourboires
- Gestion du Tip Out (partage des pourboires)
- Validation des rapports par les managers
- Interface multilingue (Français/Anglais)

## Structure du Projet

```
ShiftClose/
├── frontend/          # Application React (PWA)
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── i18n/
│   │   └── pages/
│   └── package.json
│
├── backend/           # API Node.js/Express
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── routes/
│   └── package.json
│
├── CLAUDE.MD          # Documentation projet
└── README.md
```

## Stack Technique

| Composant | Technologies |
|-----------|-------------|
| **Frontend** | React 19, Vite, Tailwind CSS v4 |
| **Backend** | Node.js, Express |
| **Base de données** | Firebase (Firestore) |
| **Authentification** | Firebase Auth |
| **Emails** | Nodemailer |
| **PWA** | vite-plugin-pwa |

## Installation

### Prérequis

- Node.js 18+
- npm ou yarn
- Compte Firebase (pour la base de données)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Le frontend démarre sur **http://localhost:3000**

### Backend

```bash
cd backend
cp .env.example .env
# Configurer les variables d'environnement
npm install
npm run dev
```

Le backend démarre sur **http://localhost:5000**

## Fonctionnalités par Rôle

### Serveurs
- Soumettre un rapport de Cash Out
- Calculer automatiquement le Tip Out
- Consulter l'historique des rapports

### Managers
- Valider/Rejeter les rapports
- Gérer l'équipe (invitations)
- Configurer les règles de Tip Out
- Voir les statistiques

### Super Admin
- Gérer tous les restaurants
- Gérer les abonnements
- Statistiques globales

## Déploiement

- **Frontend** : Vercel
- **Backend** : Render

## Licence

Propriétaire - Tous droits réservés
