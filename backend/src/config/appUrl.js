// Helper : retourne la première URL propre depuis FRONTEND_URL
// FRONTEND_URL peut contenir plusieurs URLs séparées par des virgules
// ex: "https://cheftips.app,https://www.cheftips.app"
export const getAppUrl = () =>
  (process.env.FRONTEND_URL || 'https://cheftips.app')
    .split(',')[0]
    .trim()
    .replace(/\/$/, '') // supprimer le slash final si présent
