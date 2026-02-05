import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  DollarSign,
  CreditCard,
  Wallet,
  Check,
  AlertCircle
} from 'lucide-react'

export default function CashOut() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
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

  const handleSubmit = () => {
    // TODO: Submit to Firebase
    console.log('Submitting report:', {
      ...formData,
      totalSales,
      totalTips,
      tipOutAmount,
      netTips,
      expectedCash,
      difference
    })
    navigate('/reports')
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-green-500/10 rounded-xl mb-3">
                <DollarSign className="text-green-400" size={32} />
              </div>
              <h2 className="text-xl font-semibold text-white">{t('cashOut.sales')}</h2>
              <p className="text-slate-400 text-sm mt-1">Entrez vos ventes du shift</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t('cashOut.cashSales')}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    value={formData.cashSales}
                    onChange={(e) => handleChange('cashSales', e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 rounded-lg text-white text-lg"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t('cashOut.cardSales')}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    value={formData.cardSales}
                    onChange={(e) => handleChange('cardSales', e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 rounded-lg text-white text-lg"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t('cashOut.otherSales')}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    value={formData.otherSales}
                    onChange={(e) => handleChange('otherSales', e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 rounded-lg text-white text-lg"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-medium">{t('cashOut.totalSales')}</span>
                  <span className="text-2xl font-bold text-green-400">${totalSales.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-blue-500/10 rounded-xl mb-3">
                <CreditCard className="text-blue-400" size={32} />
              </div>
              <h2 className="text-xl font-semibold text-white">{t('cashOut.tips')}</h2>
              <p className="text-slate-400 text-sm mt-1">Entrez vos pourboires reçus</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t('cashOut.cashTips')}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    value={formData.cashTips}
                    onChange={(e) => handleChange('cashTips', e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 rounded-lg text-white text-lg"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t('cashOut.cardTips')}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    value={formData.cardTips}
                    onChange={(e) => handleChange('cardTips', e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 rounded-lg text-white text-lg"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-medium">{t('cashOut.totalTips')}</span>
                  <span className="text-2xl font-bold text-blue-400">${totalTips.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-amber-500/10 rounded-xl mb-3">
                <Wallet className="text-amber-400" size={32} />
              </div>
              <h2 className="text-xl font-semibold text-white">{t('cashOut.tipOut')}</h2>
              <p className="text-slate-400 text-sm mt-1">Pourcentage à redistribuer</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t('cashOut.tipOutPercent')}
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={formData.tipOutPercent}
                    onChange={(e) => handleChange('tipOutPercent', parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-2xl font-bold text-amber-400 w-16 text-right">
                    {formData.tipOutPercent}%
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-700/50 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('cashOut.totalTips')}</span>
                  <span className="text-white">${totalTips.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('cashOut.tipOutAmount')} ({formData.tipOutPercent}%)</span>
                  <span className="text-amber-400">-${tipOutAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-600">
                  <span className="text-slate-300 font-medium">{t('cashOut.netTips')}</span>
                  <span className="text-2xl font-bold text-green-400">${netTips.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-purple-500/10 rounded-xl mb-3">
                <Wallet className="text-purple-400" size={32} />
              </div>
              <h2 className="text-xl font-semibold text-white">{t('cashOut.cashInHand')}</h2>
              <p className="text-slate-400 text-sm mt-1">Comptez vos espèces</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t('cashOut.cashInHand')}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    value={formData.cashInHand}
                    onChange={(e) => handleChange('cashInHand', e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 rounded-lg text-white text-lg"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-700/50 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('cashOut.expectedCash')}</span>
                  <span className="text-white">${expectedCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('cashOut.cashInHand')}</span>
                  <span className="text-white">${cashInHand.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-600">
                  <span className="text-slate-300 font-medium">{t('cashOut.difference')}</span>
                  <span className={`text-2xl font-bold flex items-center gap-2 ${
                    difference === 0 ? 'text-green-400' : difference > 0 ? 'text-blue-400' : 'text-red-400'
                  }`}>
                    {difference === 0 ? (
                      <><Check size={24} /> {t('cashOut.balanced')}</>
                    ) : difference > 0 ? (
                      <>+${difference.toFixed(2)} {t('cashOut.over')}</>
                    ) : (
                      <><AlertCircle size={20} /> ${Math.abs(difference).toFixed(2)} {t('cashOut.short')}</>
                    )}
                  </span>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">{t('cashOut.summary')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('cashOut.totalSales')}</span>
                    <span className="text-white">${totalSales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('cashOut.totalTips')}</span>
                    <span className="text-white">${totalTips.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('cashOut.tipOutAmount')}</span>
                    <span className="text-amber-400">-${tipOutAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-700">
                    <span className="text-white font-medium">{t('cashOut.netTips')}</span>
                    <span className="text-green-400 font-bold">${netTips.toFixed(2)}</span>
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
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">
            {t('cashOut.step')} {step} {t('cashOut.of')} {totalSteps}
          </span>
          <span className="text-sm text-slate-400">
            {Math.round((step / totalSteps) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="card min-h-[400px]">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
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
            className="btn btn-success flex-1"
          >
            <Check size={20} />
            {t('cashOut.submitReport')}
          </button>
        )}
      </div>
    </div>
  )
}
