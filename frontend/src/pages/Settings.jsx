import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { restaurantAPI, payPeriodAPI } from '../services/api'
import {
  Settings as SettingsIcon,
  Globe,
  Bell,
  Building2,
  Save,
  Check,
  CalendarDays
} from 'lucide-react'

export default function Settings() {
  const { t } = useTranslation()
  const { language, changeLanguage } = useLanguage()
  const { currentRestaurant, isManager } = useAuth()

  const [notifications, setNotifications] = useState({
    reportSubmitted: true,
    reportValidated: true,
    teamInvite: true
  })

  // ── Pay Period config (manager) ───────────────────────────
  const [payPeriodFrequency, setPayPeriodFrequency] = useState('biweekly')
  const [payPeriodStartDay,  setPayPeriodStartDay]  = useState(1)
  const [payPeriodRefDate,   setPayPeriodRefDate]   = useState('')
  const [savingPeriod, setSavingPeriod] = useState(false)
  const [savedPeriod,  setSavedPeriod]  = useState(false)

  useEffect(() => {
    if (currentRestaurant) {
      setPayPeriodFrequency(currentRestaurant.payPeriodFrequency || 'biweekly')
      setPayPeriodStartDay(currentRestaurant.payPeriodStartDay ?? 1)
      setPayPeriodRefDate(currentRestaurant.payPeriodReferenceDate || '')
    }
  }, [currentRestaurant?.id])

  const handleSavePayPeriod = async () => {
    if (!currentRestaurant?.id) return
    setSavingPeriod(true)
    try {
      // 1. Sauvegarder la config dans le restaurant
      await restaurantAPI.update(currentRestaurant.id, {
        pay_period_frequency:       payPeriodFrequency,
        pay_period_start_day:       parseInt(payPeriodStartDay),
        pay_period_reference_date:  payPeriodRefDate || null
      })
      // 2. Recalculer la période active selon la nouvelle config
      await payPeriodAPI.recalculate(currentRestaurant.id)

      setSavedPeriod(true)
      setTimeout(() => setSavedPeriod(false), 2500)
    } catch (e) {
      console.error('Save pay period error:', e)
    } finally {
      setSavingPeriod(false)
    }
  }

  const handleSave = () => {
    console.log('Saving settings:', { notifications })
  }

  const notificationLabels = {
    reportSubmitted: { label: 'Rapport soumis', desc: 'Quand un employé soumet un rapport de caisse' },
    reportValidated: { label: 'Rapport validé', desc: 'Quand votre rapport est approuvé ou rejeté' },
    teamInvite:      { label: 'Invitation équipe', desc: 'Quand vous recevez une invitation à rejoindre un restaurant' }
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

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

      {/* ── Language ── */}
      <div className="card">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-blue-500/10 rounded-xl">
            <Globe size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">{t('settings.language')}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Choisissez votre langue préférée</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700/60 mb-6" />

        {/* Buttons */}
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
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-amber-500/10 rounded-xl">
            <Bell size={20} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">{t('settings.notifications')}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Recevez des alertes en temps réel</p>
          </div>
        </div>

        <div className="border-t border-slate-700/60 mb-6" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.entries(notifications).map(([key, value]) => {
            const { label, desc } = notificationLabels[key] || { label: key, desc: '' }
            return (
              <label
                key={key}
                className="flex items-center justify-between gap-4 p-5 bg-slate-700/30 rounded-xl cursor-pointer hover:bg-slate-700/50 transition-colors border border-slate-600/30"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{label}</p>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">{desc}</p>
                </div>

                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                    className="sr-only"
                  />
                  {/* Toggle track */}
                  <div className={`w-12 h-6.5 rounded-full transition-colors duration-200 ${
                    value ? 'bg-blue-500' : 'bg-slate-600'
                  }`}
                    style={{ width: '48px', height: '26px' }}
                  >
                    {/* Toggle thumb */}
                    <div
                      className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200"
                      style={{
                        marginTop: '3px',
                        marginLeft: value ? '25px' : '3px',
                        transition: 'margin-left 0.2s ease'
                      }}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                {t('settings.restaurantName')}
              </label>
              <input
                type="text"
                defaultValue={currentRestaurant.name}
                className="w-full px-4 py-3 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                {t('settings.address')}
              </label>
              <input
                type="text"
                placeholder="123 Rue Exemple, Montréal"
                className="w-full px-4 py-3 rounded-xl text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  {t('settings.timezone')}
                </label>
                <select className="w-full px-4 py-3 rounded-xl text-white">
                  <option>America/Montreal</option>
                  <option>America/Toronto</option>
                  <option>America/Vancouver</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  {t('settings.currency')}
                </label>
                <select className="w-full px-4 py-3 rounded-xl text-white">
                  <option>CAD ($)</option>
                  <option>USD ($)</option>
                  <option>EUR (€)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Période de Paie (Manager only) ── */}
      {isManager && currentRestaurant && (
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
              <CalendarDays size={20} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Période de paie</h2>
              <p className="text-xs text-slate-400 mt-0.5">Configurez le cycle de paie de votre restaurant</p>
            </div>
          </div>

          <div className="border-t border-slate-700/60 mb-6" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Fréquence */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Fréquence de paie</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'weekly',    label: 'Hebdomadaire', desc: '7 jours' },
                  { value: 'biweekly', label: 'Bi-hebdomadaire', desc: '14 jours' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setPayPeriodFrequency(opt.value)}
                    className={`relative flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left ${
                      payPeriodFrequency === opt.value
                        ? 'bg-emerald-500/10 border-emerald-500'
                        : 'bg-slate-700/40 border-slate-600/60 hover:border-slate-500'
                    }`}
                  >
                    {payPeriodFrequency === opt.value && (
                      <span className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                        <Check size={9} className="text-white" />
                      </span>
                    )}
                    <span className={`font-semibold text-sm ${payPeriodFrequency === opt.value ? 'text-emerald-400' : 'text-white'}`}>
                      {opt.label}
                    </span>
                    <span className="text-xs text-slate-400 mt-1">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Jour de début */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Jour de début de semaine</label>
              <div style={{ position: 'relative' }}>
                <select
                  value={payPeriodStartDay}
                  onChange={e => setPayPeriodStartDay(parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl text-white"
                  style={{ appearance: 'none', backgroundColor: 'rgba(30,41,59,0.8)', border: '1px solid #334155' }}
                >
                  {['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map((day, i) => (
                    <option key={i} value={i}>{day}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date de référence (pour bi-hebdomadaire) */}
            {payPeriodFrequency === 'biweekly' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Date de référence <span className="text-slate-500">(début du premier cycle)</span>
                </label>
                <input
                  type="date"
                  value={payPeriodRefDate}
                  onChange={e => setPayPeriodRefDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white"
                  style={{ backgroundColor: 'rgba(30,41,59,0.8)', border: '1px solid #334155' }}
                />
                <p className="text-xs text-slate-500 mt-2">
                  Entrez la date d'un lundi (ou du jour de début) pour caler les cycles de 14 jours.
                </p>
              </div>
            )}

            <button
              onClick={handleSavePayPeriod}
              disabled={savingPeriod}
              className="btn btn-primary py-3"
              style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
            >
              {savedPeriod ? <Check size={18} /> : <Save size={18} />}
              {savedPeriod ? 'Sauvegardé !' : savingPeriod ? 'Sauvegarde...' : 'Sauvegarder la période'}
            </button>
          </div>
        </div>
      )}

      {/* ── Save Button ── */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          className="btn btn-primary w-full py-4 text-base"
        >
          <Save size={20} />
          {t('common.save')}
        </button>
      </div>

    </div>
  )
}
