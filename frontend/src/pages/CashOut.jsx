import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { reportAPI } from '../services/api'
import {
  ChevronLeft,
  ChevronRight,
  DollarSign,
  CreditCard,
  Wallet,
  Check,
  AlertCircle,
  Loader
} from 'lucide-react'

export default function CashOut() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { currentRestaurant } = useAuth()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const totalSteps = 4

  // Form state
  const [formData, setFormData] = useState({
    // Step 1: Sales
    cashSales: '',
    cardSales: '',
    otherSales: '',
    // Step 2: Tips
    cashTips: '',
    cardTips: '',
    // Step 3: Tip Out
    tipOutPercent: 3,
    // Step 4: Cash in hand
    cashInHand: ''
  })

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Calculations
  const totalSales = (parseFloat(formData.cashSales) || 0) +
                     (parseFloat(formData.cardSales) || 0) +
                     (parseFloat(formData.otherSales) || 0)

  const totalTips = (parseFloat(formData.cashTips) || 0) +
                    (parseFloat(formData.cardTips) || 0)

  const tipOutAmount = totalTips * (formData.tipOutPercent / 100)
  const netTips = totalTips - tipOutAmount

  const expectedCash = (parseFloat(formData.cashSales) || 0) +
                       (parseFloat(formData.cashTips) || 0)

  const cashInHand = parseFloat(formData.cashInHand) || 0
  const difference = cashInHand - expectedCash

  const handleSubmit = async () => {
    if (!currentRestaurant?.id) {
      setError('Aucun restaurant sélectionné.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await reportAPI.create(currentRestaurant.id, {
        cashSales: parseFloat(formData.cashSales) || 0,
        cardSales: parseFloat(formData.cardSales) || 0,
        otherSales: parseFloat(formData.otherSales) || 0,
        cashTips: parseFloat(formData.cashTips) || 0,
        cardTips: parseFloat(formData.cardTips) || 0,
        tipOutPercent: formData.tipOutPercent,
        cashInHand: parseFloat(formData.cashInHand) || 0
      })
      navigate('/reports')
    } catch (err) {
      setError(err.message || 'Erreur lors de la soumission.')
    } finally {
      setSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <div className="inline-flex p-4 bg-green-500/10 rounded-2xl mb-4">
                <DollarSign className="text-green-400" size={36} />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">{t('cashOut.sales')}</h2>
              <p className="text-slate-400 text-sm">Entrez vos ventes du shift</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  {t('cashOut.cashSales')}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                  <input
                    type="number"
                    value={formData.cashSales}
                    onChange={(e) => handleChange('cashSales', e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-3.5 rounded-xl text-white text-lg"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  {t('cashOut.cardSales')}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                  <input
                    type="number"
                    value={formData.cardSales}
                    onChange={(e) => handleChange('cardSales', e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-3.5 rounded-xl text-white text-lg"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  {t('cashOut.otherSales')}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                  <input
                    type="number"
                    value={formData.otherSales}
                    onChange={(e) => handleChange('otherSales', e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-3.5 rounded-xl text-white text-lg"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="pt-5 border-t border-slate-700/60">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-medium text-base">{t('cashOut.totalSales')}</span>
                  <span className="text-3xl font-bold text-green-400">${totalSales.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <div className="inline-flex p-4 bg-blue-500/10 rounded-2xl mb-4">
                <CreditCard className="text-blue-400" size={36} />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">{t('cashOut.tips')}</h2>
              <p className="text-slate-400 text-sm">Entrez vos pourboires reçus</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  {t('cashOut.cashTips')}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                  <input
                    type="number"
                    value={formData.cashTips}
                    onChange={(e) => handleChange('cashTips', e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-3.5 rounded-xl text-white text-lg"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  {t('cashOut.cardTips')}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                  <input
                    type="number"
                    value={formData.cardTips}
                    onChange={(e) => handleChange('cardTips', e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-3.5 rounded-xl text-white text-lg"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="pt-5 border-t border-slate-700/60">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-medium text-base">{t('cashOut.totalTips')}</span>
                  <span className="text-3xl font-bold text-blue-400">${totalTips.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <div className="inline-flex p-4 bg-amber-500/10 rounded-2xl mb-4">
                <Wallet className="text-amber-400" size={36} />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">{t('cashOut.tipOut')}</h2>
              <p className="text-slate-400 text-sm">Pourcentage à redistribuer</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-4">
                  {t('cashOut.tipOutPercent')}
                </label>
                <div className="flex items-center gap-5">
                  <input
                    type="range"
                    min="0" max="10" step="0.5"
                    value={formData.tipOutPercent}
                    onChange={(e) => handleChange('tipOutPercent', parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-3xl font-bold text-amber-400 w-20 text-right">
                    {formData.tipOutPercent}%
                  </span>
                </div>
              </div>

              <div className="p-5 bg-slate-700/40 rounded-xl border border-slate-600/40 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">{t('cashOut.totalTips')}</span>
                  <span className="text-white font-medium">${totalTips.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">{t('cashOut.tipOutAmount')} ({formData.tipOutPercent}%)</span>
                  <span className="text-amber-400 font-medium">-${tipOutAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-600/60">
                  <span className="text-slate-200 font-semibold">{t('cashOut.netTips')}</span>
                  <span className="text-3xl font-bold text-green-400">${netTips.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <div className="inline-flex p-4 bg-purple-500/10 rounded-2xl mb-4">
                <Wallet className="text-purple-400" size={36} />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">{t('cashOut.cashInHand')}</h2>
              <p className="text-slate-400 text-sm">Comptez vos espèces</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  {t('cashOut.cashInHand')}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                  <input
                    type="number"
                    value={formData.cashInHand}
                    onChange={(e) => handleChange('cashInHand', e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-3.5 rounded-xl text-white text-lg"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="p-5 bg-slate-700/40 rounded-xl border border-slate-600/40 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">{t('cashOut.expectedCash')}</span>
                  <span className="text-white font-medium">${expectedCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">{t('cashOut.cashInHand')}</span>
                  <span className="text-white font-medium">${cashInHand.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-600/60">
                  <span className="text-slate-200 font-semibold">{t('cashOut.difference')}</span>
                  <span className={`text-2xl font-bold flex items-center gap-2 ${
                    difference === 0 ? 'text-green-400' : difference > 0 ? 'text-blue-400' : 'text-red-400'
                  }`}>
                    {difference === 0 ? (
                      <><Check size={22} /> {t('cashOut.balanced')}</>
                    ) : difference > 0 ? (
                      <>+${difference.toFixed(2)} {t('cashOut.over')}</>
                    ) : (
                      <><AlertCircle size={20} /> ${Math.abs(difference).toFixed(2)} {t('cashOut.short')}</>
                    )}
                  </span>
                </div>
              </div>

              {/* Summary */}
              <div className="p-5 bg-slate-800/80 rounded-xl border border-slate-700/60">
                <h3 className="text-base font-semibold text-white mb-5">{t('cashOut.summary')}</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">{t('cashOut.totalSales')}</span>
                    <span className="text-white font-medium">${totalSales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">{t('cashOut.totalTips')}</span>
                    <span className="text-white font-medium">${totalTips.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">{t('cashOut.tipOutAmount')}</span>
                    <span className="text-amber-400 font-medium">-${tipOutAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-700/60">
                    <span className="text-white font-semibold">{t('cashOut.netTips')}</span>
                    <span className="text-green-400 font-bold text-lg">${netTips.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-slate-400">
            {t('cashOut.step')} {step} {t('cashOut.of')} {totalSteps}
          </span>
          <span className="text-sm font-medium text-slate-300">
            {Math.round((step / totalSteps) * 100)}%
          </span>
        </div>
        <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
        {/* Step dots */}
        <div className="flex justify-between mt-3 px-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-colors ${
              i < step ? 'bg-blue-500' : 'bg-slate-600'
            }`} />
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="card" style={{ minHeight: '420px', padding: '2rem' }}>
        {renderStep()}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 mt-5 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            disabled={submitting}
            className="btn btn-secondary flex-1"
          >
            <ChevronLeft size={20} />
            {t('common.back')}
          </button>
        )}

        {step < totalSteps ? (
          <button
            onClick={() => setStep(step + 1)}
            className="btn btn-primary flex-1"
          >
            {t('common.next')}
            <ChevronRight size={20} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn btn-success flex-1"
          >
            {submitting ? <Loader size={20} className="animate-spin" /> : <Check size={20} />}
            {submitting ? 'Envoi...' : t('cashOut.submitReport')}
          </button>
        )}
      </div>
    </div>
  )
}
