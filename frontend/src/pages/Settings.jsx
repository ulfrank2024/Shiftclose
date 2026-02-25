import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import {
  Settings as SettingsIcon,
  Globe,
  Bell,
  Percent,
  Building2,
  Plus,
  Trash2,
  Save,
  Check
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

  const [tipOutRules, setTipOutRules] = useState([
    { id: 1, position: 'Busboy', percentage: 1.5 },
    { id: 2, position: 'Bartender', percentage: 1.0 },
    { id: 3, position: 'Host', percentage: 0.5 }
  ])

  const [newRule, setNewRule] = useState({ position: '', percentage: '' })

  const addTipOutRule = () => {
    if (newRule.position && newRule.percentage) {
      setTipOutRules([
        ...tipOutRules,
        { id: Date.now(), ...newRule, percentage: parseFloat(newRule.percentage) }
      ])
      setNewRule({ position: '', percentage: '' })
    }
  }

  const removeTipOutRule = (id) => {
    setTipOutRules(tipOutRules.filter(rule => rule.id !== id))
  }

  const handleSave = () => {
    console.log('Saving settings:', { notifications, tipOutRules })
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

      {/* ── Tip Out Configuration (Manager only) ── */}
      {isManager && (
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-green-500/10 rounded-xl">
              <Percent size={20} className="text-green-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">{t('settings.tipOutConfig')}</h2>
              <p className="text-xs text-slate-400 mt-0.5">Règles de redistribution des pourboires</p>
            </div>
          </div>

          <div className="border-t border-slate-700/60 mb-6" />

          {/* Rules list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {tipOutRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between gap-4 p-5 bg-slate-700/30 rounded-xl border border-slate-600/30 hover:border-slate-500/50 transition-colors"
              >
                {/* Left: position */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Percent size={16} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{rule.position}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{t('settings.percentage')}</p>
                  </div>
                </div>

                {/* Right: value + delete */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-2xl font-bold text-green-400 tabular-nums">
                    {rule.percentage}%
                  </span>
                  <button
                    onClick={() => removeTipOutRule(rule.id)}
                    className="p-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors border border-transparent hover:border-red-500/20"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add new rule */}
          <div className="p-5 bg-slate-800/60 rounded-xl border border-dashed border-slate-600/60">
            <p className="text-sm font-semibold text-slate-300 mb-4">{t('settings.addRule')}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newRule.position}
                onChange={(e) => setNewRule({ ...newRule, position: e.target.value })}
                placeholder={t('settings.position')}
                className="flex-1 px-4 py-3 rounded-xl text-white text-sm"
              />
              <div className="relative w-full sm:w-32">
                <input
                  type="number"
                  value={newRule.percentage}
                  onChange={(e) => setNewRule({ ...newRule, percentage: e.target.value })}
                  placeholder="0"
                  step="0.5"
                  min="0"
                  max="100"
                  className="w-full px-4 py-3 rounded-xl text-white text-sm pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">%</span>
              </div>
              <button
                onClick={addTipOutRule}
                disabled={!newRule.position || !newRule.percentage}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus size={18} />
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

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
