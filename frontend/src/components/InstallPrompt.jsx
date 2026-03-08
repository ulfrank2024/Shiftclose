import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, X, Smartphone, Monitor, Share } from 'lucide-react'

/**
 * Bouton / bannière d'installation PWA.
 * - Android & Desktop Chrome/Edge : utilise beforeinstallprompt (natif)
 * - iOS Safari : affiche un guide "Partager → Ajouter à l'écran d'accueil"
 * - Déjà installé ou dans la PWA standalone : invisible
 */
export default function InstallPrompt() {
  const { t } = useTranslation()
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isInStandaloneMode =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true

  useEffect(() => {
    if (isInStandaloneMode) return  // Déjà installé → ne rien montrer

    // Android / Desktop Chrome / Edge
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // iOS : montrer le guide si Safari et pas encore installé
    if (isIOS && !isInStandaloneMode) {
      // Attendre 5 secondes avant d'afficher pour ne pas déranger
      const t = setTimeout(() => setIsVisible(true), 5000)
      return () => {
        clearTimeout(t)
        window.removeEventListener('beforeinstallprompt', handler)
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Android / Desktop : déclencher le prompt natif
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setIsVisible(false)
      setDeferredPrompt(null)
    } else if (isIOS) {
      setShowIOSGuide(true)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    setIsVisible(false)
    // Ne plus montrer pendant 7 jours
    localStorage.setItem('pwa_install_dismissed', Date.now().toString())
  }

  // Vérifier si l'utilisateur a déjà refusé récemment
  useEffect(() => {
    const dismissedAt = localStorage.getItem('pwa_install_dismissed')
    if (dismissedAt && Date.now() - parseInt(dismissedAt) < 7 * 24 * 60 * 60 * 1000) {
      setIsVisible(false)
    }
  }, [])

  if (!isVisible || dismissed || isInStandaloneMode) return null

  return (
    <>
      {/* Bannière principale */}
      <div
        style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9998,
          width: 'calc(100% - 32px)',
          maxWidth: '480px',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid rgba(71, 85, 105, 0.5)',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          animation: 'slideUp 0.4s ease'
        }}
      >
        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateX(-50%) translateY(20px); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
        `}</style>

        {/* Logo app */}
        <div style={{
          width: '44px', height: '44px', flexShrink: 0,
          backgroundColor: '#3b82f6',
          borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '22px' }}>S</span>
        </div>

        {/* Texte */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: 'white', fontWeight: 600, fontSize: '14px', margin: 0 }}>
            {t('pwa.installTitle', 'Installer ShiftClose')}
          </p>
          <p style={{ color: '#94a3b8', fontSize: '12px', margin: '2px 0 0' }}>
            {isIOS
              ? t('pwa.installDescIOS', 'Accès rapide depuis votre écran d\'accueil')
              : t('pwa.installDesc', 'Installez l\'app pour un accès rapide hors ligne')
            }
          </p>
        </div>

        {/* Bouton installer */}
        <button
          onClick={handleInstall}
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
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
          {isIOS ? <Share size={14} /> : <Download size={14} />}
          {t('pwa.install', 'Installer')}
        </button>

        {/* Fermer */}
        <button
          onClick={handleDismiss}
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

      {/* Guide iOS : modal */}
      {showIOSGuide && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            style={{
              width: '100%', maxWidth: '480px',
              background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
              border: '1px solid rgba(71, 85, 105, 0.5)',
              borderRadius: '20px',
              padding: '24px',
              marginBottom: '8px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: 'white', fontWeight: 700, fontSize: '18px', margin: 0 }}>
                {t('pwa.iosGuideTitle', 'Installer sur iPhone / iPad')}
              </h3>
              <button onClick={() => setShowIOSGuide(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Étapes iOS */}
            {[
              {
                num: '1',
                icon: <Share size={20} style={{ color: '#60a5fa' }} />,
                title: t('pwa.iosStep1Title', 'Appuyez sur Partager'),
                desc: t('pwa.iosStep1Desc', 'Appuyez sur l\'icône de partage en bas de Safari (le carré avec une flèche).')
              },
              {
                num: '2',
                icon: <Smartphone size={20} style={{ color: '#34d399' }} />,
                title: t('pwa.iosStep2Title', 'Ajouter à l\'écran d\'accueil'),
                desc: t('pwa.iosStep2Desc', 'Faites défiler et appuyez sur "Ajouter à l\'écran d\'accueil".')
              },
              {
                num: '3',
                icon: <Monitor size={20} style={{ color: '#f59e0b' }} />,
                title: t('pwa.iosStep3Title', 'Confirmer'),
                desc: t('pwa.iosStep3Desc', 'Appuyez sur "Ajouter" en haut à droite. L\'app apparaît sur votre écran d\'accueil !')
              }
            ].map((step) => (
              <div key={step.num} style={{
                display: 'flex', gap: '16px', alignItems: 'flex-start',
                padding: '16px',
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                borderRadius: '12px',
                marginBottom: '10px',
                border: '1px solid rgba(71, 85, 105, 0.3)'
              }}>
                <div style={{
                  width: '32px', height: '32px', flexShrink: 0,
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: '14px'
                }}>
                  {step.num}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    {step.icon}
                    <p style={{ color: 'white', fontWeight: 600, fontSize: '14px', margin: 0 }}>{step.title}</p>
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>{step.desc}</p>
                </div>
              </div>
            ))}

            <button
              onClick={() => { setShowIOSGuide(false); setIsVisible(false) }}
              style={{
                width: '100%', marginTop: '8px',
                padding: '14px',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: 'white', fontWeight: 600, fontSize: '15px',
                border: 'none', borderRadius: '12px', cursor: 'pointer'
              }}
            >
              {t('common.understood', 'Compris !')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
