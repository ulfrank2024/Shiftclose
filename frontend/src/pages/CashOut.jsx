import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { reportAPI, restaurantAPI } from '../services/api'
import {
  DollarSign, CreditCard, Wallet, Check, AlertCircle, Loader,
  ChevronLeft, ChevronRight, Users, Heart, UtensilsCrossed,
  Wine, Coffee, Briefcase, Shield, User, Plus, Trash2, Info,
  ArrowRight, Receipt
} from 'lucide-react'

// Icônes par rôle
const ROLE_ICONS = {
  kitchen_pool: UtensilsCrossed,
  bar:          Wine,
  commis:       Coffee,
  host:         Briefcase,
  manager:      Shield,
  server:       User,
  default:      User
}

const ROLE_COLORS = {
  kitchen_pool: { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  bar:          { bg: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: 'rgba(139,92,246,0.3)' },
  commis:       { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
  host:         { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.3)' },
  manager:      { bg: 'rgba(99,102,241,0.12)', color: '#818cf8', border: 'rgba(99,102,241,0.3)' },
  donation:     { bg: 'rgba(244,63,94,0.12)',  color: '#fb7185', border: 'rgba(244,63,94,0.3)' }
}

export default function CashOut() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { currentRestaurant, user } = useAuth()

  const [step, setStep]           = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState('')
  const [teamMembers, setTeamMembers] = useState([])
  const [tipOutRules, setTipOutRules] = useState([])
  const totalSteps = 5

  // ── Form data ──────────────────────────────────────────────
  const [sales, setSales] = useState({
    cashSales: '', cardSales: '', otherSales: ''
  })
  const [tips, setTips] = useState({
    cashTips: '', cardTips: ''
  })

  // Sélection des bénéficiaires par rôle
  // Chaque règle tipOut devient un item de distribution
  // distribution: { rule, selectedPersons: [{id, name}], enabled: bool }
  const [distributions, setDistributions] = useState([])

  // Extras
  const [donations, setDonations] = useState([])   // [{personId, personName, amount}]
  const [meals, setMeals]         = useState([])   // [{personId, personName, amount, description}]
  const [newDonation, setNewDonation] = useState({ personId: '', personName: '', amount: '' })
  const [newMeal, setNewMeal]         = useState({ personId: '', personName: '', amount: '', description: '' })

  // Load team + tip-out rules
  useEffect(() => {
    if (!currentRestaurant?.id) return
    const load = async () => {
      try {
        const [teamRes, restRes] = await Promise.all([
          restaurantAPI.getTeam(currentRestaurant.id),
          restaurantAPI.get(currentRestaurant.id)
        ])
        const members = (teamRes.members || []).filter(m => m.id !== user?.id)
        setTeamMembers(members)

        const rules = restRes.restaurant?.tipOutRules || []
        // Build initial distribution state from restaurant's tip-out rules
        setDistributions(rules.map(rule => ({
          rule,
          // Kitchen pool is always enabled, no person selection
          enabled: rule.position?.toLowerCase() !== 'manager', // manager optional by default off
          selectedPersons: []
        })))
      } catch (err) {
        console.error('Load data error:', err)
      }
    }
    load()
  }, [currentRestaurant?.id])

  // ── Calculations ───────────────────────────────────────────
  const totalSales = (parseFloat(sales.cashSales) || 0) +
                     (parseFloat(sales.cardSales) || 0) +
                     (parseFloat(sales.otherSales) || 0)

  const totalTips  = (parseFloat(tips.cashTips) || 0) +
                     (parseFloat(tips.cardTips)  || 0)

  // Cash the server physically has in hand
  const cashAmount = (parseFloat(sales.cashSales) || 0) + (parseFloat(tips.cashTips) || 0)

  // Calculate tip-out amounts
  const calcDistributions = () => {
    const result = []
    for (const d of distributions) {
      if (!d.enabled) continue
      const isPool = d.rule.position?.toLowerCase() === 'cuisine' ||
                     d.rule.position?.toLowerCase() === 'kitchen' ||
                     d.rule.position?.toLowerCase() === 'kitchen_pool'

      const percentage = parseFloat(d.rule.percentage) || 0
      const baseAmount = totalSales

      if (isPool) {
        // Kitchen pool: single entry, no person
        result.push({
          role:        'kitchen_pool',
          personId:    null,
          personName:  'Pool Cuisine',
          percentage,
          baseAmount,
          amount:      baseAmount * percentage / 100,
          ruleLabel:   d.rule.position
        })
      } else {
        // Person-based: one entry per selected person
        // If multiple persons selected, split equally
        const count = d.selectedPersons.length
        if (count === 0) {
          // Optional (manager) or no one selected yet
          result.push({
            role:       d.rule.position?.toLowerCase().replace(/\s/g, '_'),
            personId:   null,
            personName: `— (personne sélectionnée)`,
            percentage,
            baseAmount,
            amount:     0,
            ruleLabel:  d.rule.position,
            noPersonSelected: true
          })
        } else {
          const amountPerPerson = (baseAmount * percentage / 100) / count
          for (const person of d.selectedPersons) {
            result.push({
              role:        d.rule.position?.toLowerCase().replace(/\s/g, '_'),
              personId:    person.id,
              personName:  person.name,
              percentage:  percentage / count, // distribute % equally
              baseAmount,
              amount:      amountPerPerson,
              ruleLabel:   d.rule.position
            })
          }
        }
      }
    }
    return result
  }

  const tipOutBreakdown = calcDistributions()
  const tipOutTotal     = tipOutBreakdown.filter(d => !d.noPersonSelected).reduce((s, d) => s + d.amount, 0)
  const donationTotal   = donations.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0)
  const netTips         = totalTips - tipOutTotal - donationTotal
  const dueBack         = tipOutTotal + cashAmount

  // ── Handlers ───────────────────────────────────────────────
  const toggleDistribution = (idx) => {
    setDistributions(prev => prev.map((d, i) =>
      i === idx ? { ...d, enabled: !d.enabled, selectedPersons: !d.enabled ? d.selectedPersons : [] } : d
    ))
  }

  const togglePersonForDistribution = (distIdx, member) => {
    setDistributions(prev => prev.map((d, i) => {
      if (i !== distIdx) return d
      const exists = d.selectedPersons.find(p => p.id === member.id)
      const updated = exists
        ? d.selectedPersons.filter(p => p.id !== member.id)
        : [...d.selectedPersons, { id: member.id, name: `${member.firstName} ${member.lastName}` }]
      return { ...d, selectedPersons: updated }
    }))
  }

  const addDonation = () => {
    if (!newDonation.personId || !newDonation.amount) return
    setDonations(prev => [...prev, { ...newDonation }])
    setNewDonation({ personId: '', personName: '', amount: '' })
  }

  const addMeal = () => {
    if (!newMeal.personId || !newMeal.amount) return
    setMeals(prev => [...prev, { ...newMeal }])
    setNewMeal({ personId: '', personName: '', amount: '', description: '' })
  }

  const handleSubmit = async () => {
    if (!currentRestaurant?.id) { setError('Aucun restaurant sélectionné.'); return }
    setSubmitting(true)
    setError('')
    try {
      await reportAPI.create(currentRestaurant.id, {
        cashSales:          parseFloat(sales.cashSales)  || 0,
        cardSales:          parseFloat(sales.cardSales)  || 0,
        otherSales:         parseFloat(sales.otherSales) || 0,
        cashTips:           parseFloat(tips.cashTips)    || 0,
        cardTips:           parseFloat(tips.cardTips)    || 0,
        cashAmount,
        tipOutBreakdown:    tipOutBreakdown.filter(d => !d.noPersonSelected),
        voluntaryDonations: donations.map(d => ({
          personId: d.personId, personName: d.personName, amount: parseFloat(d.amount) || 0
        })),
        mealDeductions:     meals.map(m => ({
          personId: m.personId, personName: m.personName,
          amount: parseFloat(m.amount) || 0, description: m.description
        }))
      })
      navigate('/reports')
    } catch (err) {
      setError(err.message || 'Erreur lors de la soumission.')
    } finally {
      setSubmitting(false)
    }
  }

  const canNext = () => {
    if (step === 1) return totalSales > 0
    if (step === 2) return true // tips optional
    if (step === 3) return true
    if (step === 4) return true
    return true
  }

  // ── Input style helper ─────────────────────────────────────
  const inputSm = {
    padding: '10px 14px 10px 36px',
    background: 'rgba(15,23,42,0.7)',
    border: '1px solid #334155',
    borderRadius: '10px',
    color: 'white',
    fontSize: '15px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  }

  // ── Step renderers ─────────────────────────────────────────

  // STEP 1 — Ventes
  const renderStep1 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(16,185,129,0.12)', borderRadius: '18px', marginBottom: '14px' }}>
          <DollarSign style={{ color: '#34d399' }} size={34} />
        </div>
        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 700, margin: '0 0 6px' }}>Ventes du shift</h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>La base de calcul du tip-out</p>
      </div>

      {[
        { key: 'cashSales',  label: 'Ventes comptant (cash)' },
        { key: 'cardSales',  label: 'Ventes par carte' },
        { key: 'otherSales', label: 'Autres ventes' }
      ].map(f => (
        <div key={f.key}>
          <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>{f.label}</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#475569', fontWeight: 700 }}>$</span>
            <input type="number" min="0" step="0.01" placeholder="0.00"
              value={sales[f.key]}
              onChange={e => setSales(prev => ({ ...prev, [f.key]: e.target.value }))}
              style={inputSm} />
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '14px', marginTop: '4px' }}>
        <span style={{ color: '#94a3b8', fontWeight: 500 }}>Total Ventes</span>
        <span style={{ color: '#34d399', fontSize: '26px', fontWeight: 800 }}>${totalSales.toFixed(2)}</span>
      </div>
    </div>
  )

  // STEP 2 — Pourboires
  const renderStep2 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(59,130,246,0.12)', borderRadius: '18px', marginBottom: '14px' }}>
          <CreditCard style={{ color: '#60a5fa' }} size={34} />
        </div>
        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 700, margin: '0 0 6px' }}>Pourboires reçus</h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Argent comptant + carte crédit</p>
      </div>

      {[
        { key: 'cashTips', label: 'Pourboires comptant (cash)' },
        { key: 'cardTips', label: 'Pourboires par carte' }
      ].map(f => (
        <div key={f.key}>
          <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>{f.label}</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#475569', fontWeight: 700 }}>$</span>
            <input type="number" min="0" step="0.01" placeholder="0.00"
              value={tips[f.key]}
              onChange={e => setTips(prev => ({ ...prev, [f.key]: e.target.value }))}
              style={inputSm} />
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '14px', marginTop: '4px' }}>
        <span style={{ color: '#94a3b8', fontWeight: 500 }}>Total Pourboires</span>
        <span style={{ color: '#60a5fa', fontSize: '26px', fontWeight: 800 }}>${totalTips.toFixed(2)}</span>
      </div>

      <div style={{ padding: '12px 16px', background: 'rgba(51,65,85,0.3)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Info size={15} style={{ color: '#64748b', flexShrink: 0 }} />
        <p style={{ color: '#64748b', fontSize: '12px', margin: 0, lineHeight: 1.5 }}>
          Le tip-out est calculé sur les <strong style={{ color: '#94a3b8' }}>ventes totales (${totalSales.toFixed(2)})</strong>, pas sur les pourboires.
        </p>
      </div>
    </div>
  )

  // STEP 3 — Distribution
  const renderStep3 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '4px' }}>
        <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(245,158,11,0.12)', borderRadius: '18px', marginBottom: '14px' }}>
          <Users style={{ color: '#fbbf24' }} size={34} />
        </div>
        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 700, margin: '0 0 6px' }}>Distribution Tip-Out</h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Sélectionne qui travaille avec toi ce soir</p>
      </div>

      {distributions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px', color: '#475569' }}>
          <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ fontSize: '14px' }}>Aucune règle de tip-out configurée par le manager.</p>
        </div>
      )}

      {distributions.map((d, idx) => {
        const position = d.rule.position || ''
        const posLower = position.toLowerCase()
        const isPool   = posLower === 'cuisine' || posLower === 'kitchen_pool' || posLower === 'kitchen'
        const roleKey  = isPool ? 'kitchen_pool' : posLower.replace(/\s/g, '_')
        const colors   = ROLE_COLORS[roleKey] || ROLE_COLORS.commis
        const Icon     = ROLE_ICONS[roleKey]  || ROLE_ICONS.default
        const pct      = parseFloat(d.rule.percentage) || 0
        const amount   = d.enabled ? totalSales * pct / 100 : 0

        return (
          <div key={idx} style={{ background: 'rgba(15,23,42,0.6)', border: `1px solid ${d.enabled ? colors.border : 'rgba(51,65,85,0.5)'}`, borderRadius: '16px', overflow: 'hidden', transition: 'border-color 0.2s' }}>
            {/* Header de la règle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: isPool ? 'default' : 'pointer', background: d.enabled ? colors.bg : 'transparent' }}
              onClick={() => !isPool && toggleDistribution(idx)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 38, height: 38, borderRadius: '10px', background: colors.bg, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} style={{ color: colors.color }} />
                </div>
                <div>
                  <p style={{ color: 'white', fontWeight: 600, fontSize: '14px', margin: 0, textTransform: 'capitalize' }}>
                    {position}
                    {isPool && <span style={{ marginLeft: '6px', fontSize: '11px', color: colors.color, background: colors.bg, padding: '2px 7px', borderRadius: '20px', border: `1px solid ${colors.border}` }}>Toujours inclus</span>}
                  </p>
                  <p style={{ color: '#64748b', fontSize: '12px', margin: '2px 0 0' }}>
                    {pct}% des ventes = <span style={{ color: colors.color, fontWeight: 600 }}>${amount.toFixed(2)}</span>
                  </p>
                </div>
              </div>

              {/* Toggle switch (pas pour kitchen pool) */}
              {!isPool && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {d.enabled && <span style={{ color: colors.color, fontSize: '12px', fontWeight: 600 }}>${amount.toFixed(2)}</span>}
                  <div style={{
                    width: 44, height: 24, borderRadius: '12px', position: 'relative',
                    background: d.enabled ? colors.color : '#334155', transition: 'background 0.2s',
                    cursor: 'pointer'
                  }}>
                    <div style={{
                      position: 'absolute', top: '3px',
                      left: d.enabled ? '23px' : '3px',
                      width: '18px', height: '18px', borderRadius: '50%',
                      background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }} />
                  </div>
                </div>
              )}
            </div>

            {/* Sélection des personnes (si pas pool et activé) */}
            {d.enabled && !isPool && (
              <div style={{ padding: '12px 16px 14px', borderTop: `1px solid rgba(51,65,85,0.5)` }}>
                <p style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>
                  Qui travaille comme {position} ce soir ?
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {teamMembers.map(member => {
                    const name = `${member.firstName} ${member.lastName}`
                    const selected = d.selectedPersons.find(p => p.id === member.id)
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => togglePersonForDistribution(idx, member)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '6px 12px', borderRadius: '20px', cursor: 'pointer',
                          background: selected ? colors.bg : 'rgba(30,41,59,0.6)',
                          border: selected ? `1.5px solid ${colors.border}` : '1px solid #334155',
                          color: selected ? colors.color : '#94a3b8',
                          fontSize: '13px', fontWeight: selected ? 600 : 400, transition: 'all 0.15s'
                        }}
                      >
                        {selected && <Check size={12} />}
                        {name}
                      </button>
                    )
                  })}
                  {teamMembers.length === 0 && (
                    <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>Aucun membre disponible</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Résumé rapide */}
      {tipOutTotal > 0 && (
        <div style={{ padding: '14px 18px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 500 }}>Total Tip-Out</span>
          <span style={{ color: '#fbbf24', fontSize: '22px', fontWeight: 800 }}>${tipOutTotal.toFixed(2)}</span>
        </div>
      )}
    </div>
  )

  // STEP 4 — Extras (dons + repas)
  const renderStep4 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '4px' }}>
        <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(244,63,94,0.1)', borderRadius: '18px', marginBottom: '14px' }}>
          <Heart style={{ color: '#fb7185' }} size={34} />
        </div>
        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 700, margin: '0 0 6px' }}>Extras (optionnel)</h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Dons supplémentaires & repas à déduire</p>
      </div>

      {/* Dons volontaires */}
      <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(51,65,85,0.5)', borderRadius: '16px', padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Heart size={16} style={{ color: '#fb7185' }} />
          <p style={{ color: 'white', fontWeight: 600, fontSize: '15px', margin: 0 }}>Dons volontaires</p>
          <span style={{ fontSize: '12px', color: '#64748b' }}>— en plus du tip-out</span>
        </div>

        {donations.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '10px', marginBottom: '8px' }}>
            <span style={{ color: '#f8fafc', fontSize: '14px' }}>{d.personName}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#fb7185', fontWeight: 700 }}>${parseFloat(d.amount).toFixed(2)}</span>
              <button type="button" onClick={() => setDonations(prev => prev.filter((_, j) => j !== i))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: '2px' }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
          <select
            value={newDonation.personId}
            onChange={e => {
              const member = teamMembers.find(m => m.id === e.target.value)
              setNewDonation(prev => ({
                ...prev,
                personId:   e.target.value,
                personName: member ? `${member.firstName} ${member.lastName}` : ''
              }))
            }}
            style={{ flex: 1, minWidth: '140px', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#f8fafc', fontSize: '13px', outline: 'none' }}
          >
            <option value="">Choisir une personne</option>
            {teamMembers.map(m => (
              <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
            ))}
          </select>
          <div style={{ position: 'relative', width: '90px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#475569', fontWeight: 700, fontSize: '14px' }}>$</span>
            <input type="number" min="0" step="0.01" placeholder="0.00"
              value={newDonation.amount}
              onChange={e => setNewDonation(prev => ({ ...prev, amount: e.target.value }))}
              style={{ width: '100%', padding: '9px 9px 9px 24px', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#f8fafc', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <button type="button" onClick={addDonation}
            disabled={!newDonation.personId || !newDonation.amount}
            style={{
              padding: '9px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: (!newDonation.personId || !newDonation.amount) ? '#334155' : 'rgba(244,63,94,0.3)',
              color: (!newDonation.personId || !newDonation.amount) ? '#64748b' : '#fb7185',
              display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '13px'
            }}>
            <Plus size={14} /> Ajouter
          </button>
        </div>
      </div>

      {/* Repas à déduire */}
      <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(51,65,85,0.5)', borderRadius: '16px', padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <UtensilsCrossed size={16} style={{ color: '#94a3b8' }} />
          <p style={{ color: 'white', fontWeight: 600, fontSize: '15px', margin: 0 }}>Repas — déduction</p>
          <span style={{ fontSize: '12px', color: '#64748b' }}>— déduit des tips reçus</span>
        </div>

        {meals.map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)', borderRadius: '10px', marginBottom: '8px' }}>
            <div>
              <span style={{ color: '#f8fafc', fontSize: '14px' }}>{m.personName}</span>
              {m.description && <span style={{ color: '#64748b', fontSize: '12px', marginLeft: '8px' }}>— {m.description}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#94a3b8', fontWeight: 700 }}>-${parseFloat(m.amount).toFixed(2)}</span>
              <button type="button" onClick={() => setMeals(prev => prev.filter((_, j) => j !== i))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: '2px' }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
          <select
            value={newMeal.personId}
            onChange={e => {
              const member = teamMembers.find(m => m.id === e.target.value)
              setNewMeal(prev => ({ ...prev, personId: e.target.value, personName: member ? `${member.firstName} ${member.lastName}` : '' }))
            }}
            style={{ flex: 1, minWidth: '130px', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#f8fafc', fontSize: '13px', outline: 'none' }}
          >
            <option value="">Personne</option>
            {teamMembers.map(m => (
              <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
            ))}
          </select>
          <div style={{ position: 'relative', width: '80px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#475569', fontWeight: 700, fontSize: '14px' }}>$</span>
            <input type="number" min="0" step="0.01" placeholder="0.00"
              value={newMeal.amount}
              onChange={e => setNewMeal(prev => ({ ...prev, amount: e.target.value }))}
              style={{ width: '100%', padding: '9px 9px 9px 22px', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#f8fafc', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <input type="text" placeholder="Description"
            value={newMeal.description}
            onChange={e => setNewMeal(prev => ({ ...prev, description: e.target.value }))}
            style={{ flex: 1, minWidth: '100px', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#f8fafc', fontSize: '13px', outline: 'none' }} />
          <button type="button" onClick={addMeal}
            disabled={!newMeal.personId || !newMeal.amount}
            style={{
              padding: '9px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: (!newMeal.personId || !newMeal.amount) ? '#334155' : 'rgba(100,116,139,0.3)',
              color: (!newMeal.personId || !newMeal.amount) ? '#64748b' : '#94a3b8',
              display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '13px'
            }}>
            <Plus size={14} /> Ajouter
          </button>
        </div>
      </div>
    </div>
  )

  // STEP 5 — Résumé
  const renderStep5 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '4px' }}>
        <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(99,102,241,0.12)', borderRadius: '18px', marginBottom: '14px' }}>
          <Receipt style={{ color: '#818cf8' }} size={34} />
        </div>
        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 700, margin: '0 0 6px' }}>Résumé du Cash Out</h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Vérifie avant de soumettre</p>
      </div>

      {/* Ventes & Tips */}
      <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid #1e293b', borderRadius: '14px', padding: '16px 18px' }}>
        <p style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>Ventes & Pourboires</p>
        {[
          { label: 'Total Ventes',         val: `$${totalSales.toFixed(2)}`,  color: '#f8fafc' },
          { label: 'Total Pourboires',     val: `$${totalTips.toFixed(2)}`,   color: '#f8fafc' },
          { label: 'Cash en main',         val: `$${cashAmount.toFixed(2)}`,  color: '#fbbf24' }
        ].map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(51,65,85,0.3)' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>{r.label}</span>
            <span style={{ color: r.color, fontWeight: 600 }}>{r.val}</span>
          </div>
        ))}
      </div>

      {/* Distributions */}
      {tipOutBreakdown.filter(d => !d.noPersonSelected).length > 0 && (
        <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid #1e293b', borderRadius: '14px', padding: '16px 18px' }}>
          <p style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>Distribution Tip-Out</p>
          {tipOutBreakdown.filter(d => !d.noPersonSelected).map((d, i) => {
            const colors = ROLE_COLORS[d.role] || ROLE_COLORS.commis
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(51,65,85,0.3)' }}>
                <div>
                  <span style={{ color: colors.color, fontSize: '13px', fontWeight: 500, textTransform: 'capitalize' }}>{d.personName}</span>
                  <span style={{ color: '#475569', fontSize: '11px', marginLeft: '6px' }}>({d.ruleLabel} — {d.percentage.toFixed(2)}%)</span>
                </div>
                <span style={{ color: colors.color, fontWeight: 700 }}>${d.amount.toFixed(2)}</span>
              </div>
            )
          })}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: '4px' }}>
            <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '13px' }}>Sous-total Tip-Out</span>
            <span style={{ color: '#fbbf24', fontWeight: 800 }}>${tipOutTotal.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Dons */}
      {donations.length > 0 && (
        <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid #1e293b', borderRadius: '14px', padding: '16px 18px' }}>
          <p style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>Dons volontaires</p>
          {donations.map((d, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(51,65,85,0.3)' }}>
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>{d.personName}</span>
              <span style={{ color: '#fb7185', fontWeight: 700 }}>${parseFloat(d.amount).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Repas */}
      {meals.length > 0 && (
        <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid #1e293b', borderRadius: '14px', padding: '16px 18px' }}>
          <p style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>Déductions repas</p>
          {meals.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(51,65,85,0.3)' }}>
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>{m.personName}{m.description ? ` — ${m.description}` : ''}</span>
              <span style={{ color: '#94a3b8', fontWeight: 700 }}>-${parseFloat(m.amount).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Résultat final */}
      <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(59,130,246,0.1))', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '16px', padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>Net pourboires</span>
          <span style={{ color: '#34d399', fontWeight: 700 }}>${netTips.toFixed(2)}</span>
        </div>
        <div style={{ height: '1px', background: 'rgba(99,102,241,0.3)', margin: '10px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: '15px', margin: '0 0 3px' }}>💵 Due Back</p>
            <p style={{ color: '#64748b', fontSize: '11px', margin: 0 }}>Tip-Out (${tipOutTotal.toFixed(2)}) + Cash (${cashAmount.toFixed(2)})</p>
          </div>
          <span style={{ color: '#818cf8', fontSize: '28px', fontWeight: 800 }}>${dueBack.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )

  const steps = [renderStep1, renderStep2, renderStep3, renderStep4, renderStep5]

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto' }}>

      {/* ── Barre de progression ─────────────────────────────── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ color: '#64748b', fontSize: '13px' }}>Étape {step} sur {totalSteps}</span>
          <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>{Math.round((step / totalSteps) * 100)}%</span>
        </div>
        <div style={{ height: '6px', background: '#1e293b', borderRadius: '9999px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6, #6366f1)', borderRadius: '9999px', width: `${(step / totalSteps) * 100}%`, transition: 'width 0.4s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', padding: '0 2px' }}>
          {['Ventes', 'Tips', 'Distribution', 'Extras', 'Résumé'].map((label, i) => (
            <span key={i} style={{ fontSize: '10px', color: i < step ? '#60a5fa' : '#334155', fontWeight: i < step ? 600 : 400, textAlign: 'center' }}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Contenu de l'étape ───────────────────────────────── */}
      <div style={{ background: 'linear-gradient(145deg, #1e293b 0%, #1a2332 100%)', border: '1px solid rgba(71,85,105,0.5)', borderRadius: '20px', padding: '28px 24px', minHeight: '400px' }}>
        {steps[step - 1]?.()}
      </div>

      {/* ── Erreur ───────────────────────────────────────────── */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px', padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', color: '#f87171', fontSize: '14px' }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* ── Navigation ───────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            disabled={submitting}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '13px 20px', borderRadius: '12px', border: '1px solid #334155',
              background: 'transparent', color: '#94a3b8', fontWeight: 600, fontSize: '14px', cursor: 'pointer'
            }}
          >
            <ChevronLeft size={18} /> Retour
          </button>
        )}

        {step < totalSteps ? (
          <button
            onClick={() => canNext() && setStep(step + 1)}
            disabled={!canNext()}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '13px', borderRadius: '12px', border: 'none', cursor: canNext() ? 'pointer' : 'not-allowed',
              background: canNext()
                ? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)'
                : '#334155',
              color: canNext() ? 'white' : '#64748b',
              fontWeight: 600, fontSize: '15px',
              boxShadow: canNext() ? '0 6px 20px rgba(99,102,241,0.35)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Continuer <ChevronRight size={18} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '13px', borderRadius: '12px', border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              background: submitting ? '#334155' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white', fontWeight: 600, fontSize: '15px',
              boxShadow: submitting ? 'none' : '0 6px 20px rgba(16,185,129,0.35)',
              transition: 'all 0.2s', opacity: submitting ? 0.7 : 1
            }}
          >
            {submitting
              ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Envoi...</>
              : <><Check size={18} /> Soumettre le rapport</>
            }
          </button>
        )}
      </div>
    </div>
  )
}
