import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { restaurantAPI } from '../services/api'
import {
  Settings as SettingsIcon,
  Globe,
  Bell,
  Building2,
  Save,
  Check,
  Loader,
  AlertCircle,
  MapPin,
  Clock,
  DollarSign
} from 'lucide-react'

const TIMEZONES = [
  'America/Montreal',
  'America/Toronto',
  'America/Vancouver',
  'America/Edmonton',
  'America/Winnipeg',
  'America/Halifax',
  'America/St_Johns',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/Paris',
  'Europe/London',
  'UTC'
]

const CURRENCIES = [
  { value: 'CAD', label: 'CAD ($)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CHF', label: 'CHF (Fr)' },
]

export default function Settings() {
  const { t } = useTranslation()
  const { language, changeLanguage } = useLanguage()
  const { currentRestaurant, isManager } = useAuth()

  // ── Restaurant form state ───────────────────────────────
  const [restaurant, setRestaurant] = useState({
    name: '',
    address: '',
    timezone: 'America/Montreal',
    currency: 'CAD'
  })
  const [loadingRestaurant, setLoadingRestaurant] = useState(false)
  const [savingRestaurant, setSavingRestaurant]   = useState(false)
  const [restaurantError, setRestaurantError]     = useState('')
  const [restaurantSuccess, setRestaurantSuccess] = useState(false)

  // ── Notifications state ─────────────────────────────────
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('notifications_prefs')
      return saved ? JSON.parse(saved) : { reportSubmitted: true, reportValidated: true, teamInvite: true }
    } catch { return { reportSubmitted: true, reportValidated: true, teamInvite: true } }
  })
  const [notifSaved, setNotifSaved] = useState(false)

  // ── Charger les infos du restaurant ────────────────────
  useEffect(() => {
    if (!currentRestaurant?.id || !isManager) return
    setLoadingRestaurant(true)
    restaurantAPI.get(currentRestaurant.id)
      .then(res => {
        const r = res.restaurant || res
        setRestaurant({
          name:     r.name     || '',
          address:  r.address  || '',
          timezone: r.timezone || 'America/Montreal',
          currency: r.currency || 'CAD'
        })
      })
      .catch(() => setRestaurantError('Erreur lors du chargement des infos restaurant'))
      .finally(() => setLoadingRestaurant(false))
  }, [currentRestaurant?.id, isManager])

  // ── Sauvegarder le restaurant ───────────────────────────
  const handleSaveRestaurant = async () => {
    if (!restaurant.name.trim()) {
      setRestaurantError('Le nom du restaurant est requis')
      return
    }
    setSavingRestaurant(true)
    setRestaurantError('')
    setRestaurantSuccess(false)
    try {
      await restaurantAPI.update(currentRestaurant.id, {
        name:     restaurant.name.trim(),
        address:  restaurant.address.trim(),
        timezone: restaurant.timezone,
        currency: restaurant.currency
      })
      setRestaurantSuccess(true)
      setTimeout(() => setRestaurantSuccess(false), 3000)
    } catch (err) {
      setRestaurantError(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSavingRestaurant(false)
    }
  }

  // ── Sauvegarder les notifications ──────────────────────
  const handleToggleNotif = (key) => {
    const updated = { ...notifications, [key]: !notifications[key] }
    setNotifications(updated)
    localStorage.setItem('notifications_prefs', JSON.stringify(updated))
    setNotifSaved(true)
    setTimeout(() => setNotifSaved(false), 2000)
  }

  const notificationLabels = {
    reportSubmitted: { label: 'Rapport soumis',   desc: 'Quand un employé soumet un rapport de caisse' },
    reportValidated: { label: 'Rapport validé',   desc: 'Quand votre rapport est approuvé ou rejeté' },
    teamInvite:      { label: 'Invitation équipe', desc: 'Quand vous recevez une invitation à rejoindre un restaurant' }
  }

  const inputClass = `w-full px-4 py-3 rounded-xl text-white bg-slate-800/60 border border-slate-600/50
    focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all`

  return (
    <div className="animate-fade-in max-w-2xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <div className="p-3.5 bg-slate-700/70 rounded-2xl border border-slate-600/40">
          <SettingsIcon size={24} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t('settings.title')}</h1>
          <p className="text-slate-400 text-sm mt-1">Gérez vos préférences et paramètres</p>
        </div>
      </div>

      {/* ── Langue ── */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-blue-500/10 rounded-xl">
            <Globe size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">{t('settings.language')}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Choisissez votre langue préférée</p>
          </div>
        </div>
        <div className="border-t border-slate-700/60 mb-6" />
        <div className="grid grid-cols-2 gap-4">
          {[
            { code: 'fr', flag: '🇫🇷', label: t('settings.french') },
            { code: 'en', flag: '🇬🇧', label: t('settings.english') }
          ].map(({ code, flag, label }) => {
            const active = language === code
            return (
              <button
                key={code}
                onClick={() => changeLanguage(code)}
                className={`relative flex flex-col items-center py-7 px-4 rounded-xl border-2 transition-all ${
                  active
                    ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                    : 'bg-slate-700/40 border-slate-600/60 text-slate-300 hover:border-slate-500 hover:bg-slate-700/60'
                }`}
              >
                {active && (
                  <span className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check size={11} className="text-white" />
                  </span>
                )}
                <span className="text-4xl mb-4 block">{flag}</span>
                <span className="font-semibold text-sm">{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Notifications ── */}
      <div className="card">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl">
              <Bell size={20} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">{t('settings.notifications')}</h2>
              <p className="text-xs text-slate-400 mt-0.5">Préférences de notifications</p>
            </div>
          </div>
          {notifSaved && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <Check size={13} /> Sauvegardé
            </span>
          )}
        </div>
        <div className="border-t border-slate-700/60 mb-6" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Object.entries(notifications).map(([key, value]) => {
            const { label, desc } = notificationLabels[key] || { label: key, desc: '' }
            return (
              <label
                key={key}
                className="flex items-center justify-between gap-4 p-4 bg-slate-700/30 rounded-xl cursor-pointer hover:bg-slate-700/50 transition-colors border border-slate-600/30"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{label}</p>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">{desc}</p>
                </div>
                <div className="relative flex-shrink-0" onClick={() => handleToggleNotif(key)}>
                  <div className={`rounded-full transition-colors duration-200 ${value ? 'bg-blue-500' : 'bg-slate-600'}`}
                    style={{ width: '48px', height: '26px' }}>
                    <div className="w-5 h-5 rounded-full bg-white shadow-md"
                      style={{ marginTop: '3px', marginLeft: value ? '25px' : '3px', transition: 'margin-left 0.2s ease' }}
                    />
                  </div>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* ── Restaurant Info (Manager only) ── */}
      {isManager && currentRestaurant && (
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-purple-500/10 rounded-xl">
              <Building2 size={20} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">{t('settings.restaurant')}</h2>
              <p className="text-xs text-slate-400 mt-0.5">Informations de votre établissement</p>
            </div>
          </div>
          <div className="border-t border-slate-700/60 mb-6" />

          {loadingRestaurant ? (
            <div className="flex items-center justify-center py-10 gap-3 text-slate-400">
              <Loader size={18} className="animate-spin" />
              <span className="text-sm">Chargement...</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {restaurantError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-sm">
                  <AlertCircle size={15} />
                  {restaurantError}
                </div>
              )}

              {restaurantSuccess && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-400 text-sm">
                  <Check size={15} />
                  Modifications sauvegardées avec succès !
                </div>
              )}

              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t('settings.restaurantName')} *
                </label>
                <div className="relative">
                  <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    value={restaurant.name}
                    onChange={e => setRestaurant(p => ({ ...p, name: e.target.value }))}
                    placeholder="Nom du restaurant"
                    className={inputClass}
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>

              {/* Adresse */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t('settings.address')} <span className="text-slate-500 font-normal">(facultatif)</span>
                </label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    value={restaurant.address}
                    onChange={e => setRestaurant(p => ({ ...p, address: e.target.value }))}
                    placeholder="123 Rue Principale, Montréal, QC"
                    className={inputClass}
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>

              {/* Timezone + Devise */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t('settings.timezone')}
                  </label>
                  <div className="relative">
                    <Clock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <select
                      value={restaurant.timezone}
                      onChange={e => setRestaurant(p => ({ ...p, timezone: e.target.value }))}
                      className={inputClass}
                      style={{ paddingLeft: '40px', appearance: 'none' }}
                    >
                      {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t('settings.currency')}
                  </label>
                  <div className="relative">
                    <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <select
                      value={restaurant.currency}
                      onChange={e => setRestaurant(p => ({ ...p, currency: e.target.value }))}
                      className={inputClass}
                      style={{ paddingLeft: '40px', appearance: 'none' }}
                    >
                      {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Bouton sauvegarder restaurant */}
              <button
                onClick={handleSaveRestaurant}
                disabled={savingRestaurant}
                className="btn btn-primary w-full py-3.5 text-sm mt-1"
                style={{ opacity: savingRestaurant ? 0.7 : 1 }}
              >
                {savingRestaurant
                  ? <><Loader size={16} className="animate-spin" /> Sauvegarde...</>
                  : restaurantSuccess
                    ? <><Check size={16} /> Sauvegardé !</>
                    : <><Save size={16} /> Sauvegarder le restaurant</>
                }
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
