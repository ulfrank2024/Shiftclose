import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'

/**
 * Bannière discrète en bas d'écran quand une nouvelle version est disponible.
 * L'utilisateur clique "Mettre à jour" → la page se recharge avec la nouvelle version.
 * Aucune réinstallation de l'app nécessaire.
 */
export default function PWAUpdatePrompt() {
  const { t } = useTranslation()
  const [dismissed, setDismissed] = useState(false)

  const {
    needRefresh: [needRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(r) {
      // Vérifier les mises à jour toutes les 60 secondes
      if (r) {
        setInterval(() => r.update(), 60_000)
      }
    }
  })

  if (!needRefresh || dismissed) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',  // au-dessus de la barre de navigation mobile
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: 'calc(100% - 32px)',
        maxWidth: '480px',
        background: 'linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%)',
        border: '1px solid rgba(59, 130, 246, 0.5)',
        borderRadius: '16px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        animation: 'slideUp 0.3s ease'
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      {/* Icône */}
      <div style={{
        width: '40px', height: '40px', flexShrink: 0,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <RefreshCw size={20} style={{ color: '#60a5fa' }} />
      </div>

      {/* Texte */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: 'white', fontWeight: 600, fontSize: '14px', margin: 0 }}>
          {t('pwa.updateAvailable', 'Mise à jour disponible')}
        </p>
        <p style={{ color: '#94a3b8', fontSize: '12px', margin: '2px 0 0' }}>
          {t('pwa.updateDesc', 'Une nouvelle version de ShiftClose est prête.')}
        </p>
      </div>

      {/* Bouton mettre à jour */}
      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          flexShrink: 0,
          padding: '8px 14px',
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          color: 'white',
          fontWeight: 600,
          fontSize: '13px',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        }}
      >
        {t('pwa.update', 'Mettre à jour')}
      </button>

      {/* Fermer */}
      <button
        onClick={() => setDismissed(true)}
        style={{
          flexShrink: 0,
          background: 'none',
          border: 'none',
          color: '#64748b',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex'
        }}
      >
        <X size={16} />
      </button>
    </div>
  )
}
