# ShiftClose - Backend API

API REST Node.js/Express pour ShiftClose.

## Technologies

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Firebase Admin SDK** - Base de données & Auth
- **Nodemailer** - Envoi d'emails
- **Helmet** - Sécurité HTTP
- **CORS** - Cross-Origin Resource Sharing
- **Morgan** - Logging HTTP

## Installation

```bash
npm install
cp .env.example .env
# Configurer les variables d'environnement
```

## Développement

```bash
npm run dev
```

Le serveur démarre sur **http://localhost:5000**

## Production

```bash
npm start
```

## Structure

```
src/
├── config/              # Configuration
│   ├── firebase.js      # Firebase Admin SDK
│   └── email.js         # Nodemailer + templates
│
├── controllers/         # Logique métier
│   ├── authController.js
│   ├── restaurantController.js
│   ├── reportController.js
│   └── inviteController.js
│
├── middleware/          # Middleware Express
│   └── auth.js          # Vérification token + rôles
│
├── routes/              # Routes API
│   ├── auth.js
│   ├── restaurants.js
│   ├── reports.js
│   └── invitations.js
│
└── index.js             # Point d'entrée
```

## Endpoints API

### Authentification (`/api/auth`)

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| POST | `/users` | Créer utilisateur | Non |
| GET | `/profile` | Profil utilisateur | Oui |
| PUT | `/profile` | Modifier profil | Oui |
| GET | `/users` | Tous les utilisateurs | SuperAdmin |

### Restaurants (`/api/restaurants`)

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | `/my` | Mes restaurants | Oui |
| GET | `/all` | Tous les restaurants | SuperAdmin |
| POST | `/` | Créer restaurant | Manager+ |
| GET | `/:id` | Détails restaurant | Membre |
| PUT | `/:id` | Modifier restaurant | Manager |
| GET | `/:id/team` | Équipe | Manager |

### Rapports (`/api/reports`)

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | `/:restaurantId/stats` | Statistiques | Membre |
| GET | `/:restaurantId` | Liste rapports | Membre |
| POST | `/:restaurantId` | Créer rapport | Membre |
| GET | `/detail/:reportId` | Détails rapport | Membre |
| PUT | `/:reportId/validate` | Valider/Rejeter | Manager |

### Invitations (`/api/invitations`)

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | `/info/:token` | Info invitation | Non |
| POST | `/accept/:token` | Accepter | Oui |
| POST | `/:restaurantId` | Envoyer invitation | Manager |
| GET | `/:restaurantId` | Invitations en attente | Manager |
| DELETE | `/:invitationId` | Annuler invitation | Manager |

## Variables d'environnement

```env
# Server
PORT=5000
NODE_ENV=development

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## Sécurité

- **Authentification** : Firebase ID Token
- **Autorisation** : Rôles (server, manager, superadmin)
- **CORS** : Limité au frontend
- **Helmet** : Headers de sécurité

## Déploiement

Déployé sur **Render**.

Variables à configurer sur Render :
- Toutes les variables du `.env`
- `NODE_ENV=production`
