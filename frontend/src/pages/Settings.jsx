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
  Save
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
    // TODO: Save to Firebase
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-slate-700 rounded-xl">
          <SettingsIcon size={24} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t('settings.title')}</h1>
          <p className="text-slate-400 text-sm mt-0.5">Gérez vos préférences et paramètres</p>
        </div>
      </div>

      {/* Language */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-blue-500/10 rounded-xl">
            <Globe size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">{t('settings.language')}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Choisissez votre langue préférée</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => changeLanguage('fr')}
            className={`flex-1 p-5 rounded-xl border-2 transition-colors text-center ${
              language === 'fr'
                ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500'
            }`}
          >
            <span className="text-3xl mb-3 block">🇫🇷</span>
            <span className="font-semibold text-sm">{t('settings.french')}</span>
          </button>
          <button
            onClick={() => changeLanguage('en')}
            className={`flex-1 p-5 rounded-xl border-2 transition-colors text-center ${
              language === 'en'
                ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500'
            }`}
          >
            <span className="text-3xl mb-3 block">🇬🇧</span>
            <span className="font-semibold text-sm">{t('settings.english')}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-amber-500/10 rounded-xl">
            <Bell size={20} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">{t('settings.notifications')}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Recevez des alertes en temps réel</p>
          </div>
        </div>

        <div className="space-y-3">
          {Object.entries(notifications).map(([key, value]) => (
            <label
              key={key}
              className="flex items-center justify-between p-4 bg-slate-700/40 rounded-xl cursor-pointer hover:bg-slate-700/60 transition-colors border border-slate-600/30"
            >
              <span className="text-white">
                {key === 'reportSubmitted' && 'Rapport soumis'}
                {key === 'reportValidated' && 'Rapport validé'}
                {key === 'teamInvite' && 'Invitation équipe'}
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${
                  value ? 'bg-blue-500' : 'bg-slate-600'
                }`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
                    value ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'
                  }`} />
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Tip Out Configuration (Manager only) */}
      {isManager && (
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-green-500/10 rounded-xl">
              <Percent size={20} className="text-green-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">{t('settings.tipOutConfig')}</h2>
              <p className="text-xs text-slate-400 mt-0.5">Règles de redistribution des pourboires</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {tipOutRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-4 bg-slate-700/40 rounded-xl border border-slate-600/30"
              >
                <div>
                  <p className="text-white font-semibold">{rule.position}</p>
                  <p className="text-sm text-slate-400 mt-0.5">{t('settings.percentage')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 font-bold">{rule.percentage}%</span>
                  <button
                    onClick={() => removeTipOutRule(rule.id)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add new rule */}
          <div className="p-5 bg-slate-700/20 rounded-xl border border-dashed border-slate-600/60">
            <p className="text-sm font-medium text-slate-300 mb-4">{t('settings.addRule')}</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={newRule.position}
                onChange={(e) => setNewRule({ ...newRule, position: e.target.value })}
                placeholder={t('settings.position')}
                className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm"
              />
              <div className="relative w-28">
                <input
                  type="number"
                  value={newRule.percentage}
                  onChange={(e) => setNewRule({ ...newRule, percentage: e.target.value })}
                  placeholder="0"
                  step="0.5" min="0" max="100"
                  className="w-full px-4 py-2.5 rounded-xl text-white text-sm pr-7"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
              </div>
              <button
                onClick={addTipOutRule}
                className="px-4 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center gap-1.5 text-sm font-medium"
              >
                <Plus size={18} />
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restaurant Info (Manager only) */}
      {isManager && currentRestaurant && (
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-purple-500/10 rounded-xl">
              <Building2 size={20} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">{t('settings.restaurant')}</h2>
              <p className="text-xs text-slate-400 mt-0.5">Informations de votre établissement</p>
            </div>
          </div>

          <div className="space-y-5">
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

            <div className="grid grid-cols-2 gap-5">
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

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="btn btn-primary w-full py-4 text-base"
      >
        <Save size={20} />
        {t('common.save')}
      </button>
    </div>
  )
}
