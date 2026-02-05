# ShiftClose - Frontend

Application React PWA pour la gestion de Cash Out.

## Technologies

- **React 19** - Framework UI
- **Vite** - Build tool
- **Tailwind CSS v4** - Styling
- **React Router** - Navigation
- **react-i18next** - Internationalisation (FR/EN)
- **Lucide React** - Icônes
- **vite-plugin-pwa** - Progressive Web App

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

L'application démarre sur **http://localhost:3000**

## Build Production

```bash
npm run build
npm run preview
```

## Structure

```
src/
├── components/          # Composants réutilisables
│   ├── Layout.jsx       # Layout principal
│   ├── Navbar.jsx       # Navigation desktop
│   └── BottomNav.jsx    # Navigation mobile
│
├── contexts/            # Contextes React
│   ├── AuthContext.jsx  # Authentification
│   └── LanguageContext.jsx
│
├── i18n/                # Traductions
│   ├── index.js
│   ├── fr.json          # Français
│   └── en.json          # Anglais
│
├── pages/               # Pages de l'application
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── CashOut.jsx
│   ├── Reports.jsx
│   ├── Team.jsx
│   ├── Settings.jsx
│   └── Profile.jsx
│
├── hooks/               # Hooks personnalisés
├── services/            # Services API
├── utils/               # Utilitaires
│
├── App.jsx              # Routing principal
├── main.jsx             # Point d'entrée
└── index.css            # Styles globaux
```

## Fonctionnalités

- **PWA** : Installable sur tous les appareils
- **Mobile-First** : Optimisé pour smartphones
- **Thème Dark** : Interface sombre par défaut
- **Multilingue** : Français et Anglais
- **Multi-restaurant** : Basculer entre restaurants

## Variables d'environnement

Créer un fichier `.env` à la racine :

```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

## Déploiement

Déployé sur **Vercel**.

```bash
npm run build
# Le dossier dist/ est prêt pour le déploiement
```
