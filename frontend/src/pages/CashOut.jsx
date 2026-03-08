import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { reportAPI, restaurantAPI, payPeriodAPI } from '../services/api'
import {
  Check, AlertCircle, Loader,
  ChevronLeft, ChevronRight, Users,
  Wine, Coffee, Briefcase, Shield, User,
  UtensilsCrossed, Camera, SkipForward, DollarSign
} from 'lucide-react'

// ── Constantes de style par rôle ───────────────────────────────────────────────
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

// ── Noms d'affichage des positions ────────────────────────────────────────────
const POSITION_LABELS = {
  kitchen_pool:  'Pool Cuisine',
  cuisine:       'Pool Cuisine',
  'pool cuisine':'Pool Cuisine',
  bar:           'Bar',
  bartender:     'Bartender',
  commis:        'Commis',
  host:          'Hôte',
  manager:       'Manager',
  server:        'Serveur'
}
const formatPosition = (pos) =>
  pos ? (POSITION_LABELS[pos.toLowerCase()] ?? pos) : 'Position'

// ── Composant principal ────────────────────────────────────────────────────────
export default function CashOut() {
  const { t }                   = useTranslation()
  const navigate                = useNavigate()
  const [searchParams]          = useSearchParams()
  const { currentRestaurant, user } = useAuth()
  const proofInputRef           = useRef(null)

  // Params URL pour soumission manager au nom d'un employé
  const forUserId   = searchParams.get('forUserId')
  const forUserName = searchParams.get('forUserName')

  const [step, setStep]             = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [teamMembers, setTeamMembers] = useState([])
  const [tipOutRules, setTipOutRules] = useState([])
  const [noPeriod, setNoPeriod]     = useState(false)
  const [periodCheckDone, setPeriodCheckDone] = useState(false)

  const totalSteps  = 4
  const stepLabels  = ['Ventes', 'Distributions', 'Preuve', 'Résumé']

  // ── État du formulaire ─────────────────────────────────────────────────────
  const [sales, setSales] = useState({ totalSales: '', comptant: '' })

  // Chaque distribution : { rule, enabled, selectedPersons, meals:{[id]:str}, donations:{[id]:str} }
  const [distributions, setDistributions] = useState([])

  // Preuve photo
  const [proofFile, setProofFile]       = useState(null)
  const [proofPreview, setProofPreview] = useState(null)

  // ── Vérification période de paie active ───────────────────────────────────
  useEffect(() => {
    if (!currentRestaurant?.id) return
    payPeriodAPI.getCurrent(currentRestaurant.id)
      .then(res => {
        setNoPeriod(!res.period)
        setPeriodCheckDone(true)
      })
      .catch(() => {
        // En cas d'erreur réseau, on laisse passer (le backend bloquera si besoin)
        setPeriodCheckDone(true)
      })
  }, [currentRestaurant?.id])

  // ── Chargement équipe + règles tip-out ─────────────────────────────────────
  useEffect(() => {
    if (!currentRestaurant?.id) return
    const load = async () => {
      const [teamResult, restResult] = await Promise.allSettled([
        restaurantAPI.getTeam(currentRestaurant.id),
        restaurantAPI.get(currentRestaurant.id)
      ])

      if (teamResult.status === 'fulfilled') {
        const members = (teamResult.value.members || []).filter(m => m.id !== user?.id)
        setTeamMembers(members)
      }

      if (restResult.status === 'fulfilled') {
        const rules = restResult.value.restaurant?.tipOutRules || []
        setDistributions(rules.map(rule => ({
          rule: { ...rule, enabled: rule.enabled !== false, automatic: !!rule.automatic },
          // Respecte le réglage manager (enabled), mais pas manager = actif par défaut
          enabled: rule.enabled !== false && rule.position?.toLowerCase() !== 'manager',
          selectedPersons: [],
          meals:     {},
          donations: {}
        })))
      } else {
        console.error('Load restaurant error:', restResult.reason)
      }
    }
    load()
  }, [currentRestaurant?.id])

  // ── Calculs ────────────────────────────────────────────────────────────────
  const totalSales = parseFloat(sales.totalSales) || 0
  const comptant   = parseFloat(sales.comptant)   || 0   // peut être négatif

  const isKitchenPool = (dist) =>
    dist.rule?.position?.toLowerCase() === 'kitchen_pool' ||
    dist.rule?.position?.toLowerCase() === 'cuisine'

  // Règle automatique : pool cuisine OU règle marquée automatic par le manager
  const isAutomatic = (dist) => isKitchenPool(dist) || dist.rule?.automatic === true

  // Montant de tip-out par distribution
  const calcDistTipTotal = (dist) => {
    const pct = parseFloat(dist.rule?.percentage) || 0
    return totalSales * pct / 100
  }

  // Montant par personne dans une distribution
  const calcPersonTip = (dist, personCount) => {
    const total = calcDistTipTotal(dist)
    return personCount > 0 ? total / personCount : 0
  }

  // Tip-out total (somme de toutes les distributions activées)
  const tipOutTotal = distributions
    .filter(d => d.enabled)
    .reduce((sum, d) => {
      if (isAutomatic(d)) return sum + calcDistTipTotal(d)
      return sum + (d.selectedPersons.length > 0 ? calcDistTipTotal(d) : 0)
    }, 0)

  // Due back : positif = serveur doit remettre, négatif = gérant doit au serveur
  const dueBack = tipOutTotal + comptant

  // ── Handlers distributions ─────────────────────────────────────────────────
  const toggleDistribution = (idx) => {
    setDistributions(prev => prev.map((d, i) =>
      i !== idx ? d : { ...d, enabled: !d.enabled }
    ))
  }

  const getMemberName = (member) =>
    `${member.firstName || member.first_name || ''} ${member.lastName || member.last_name || ''}`.trim() || member.email

  const togglePersonForDistribution = (distIdx, member) => {
    setDistributions(prev => prev.map((d, i) => {
      if (i !== distIdx) return d
      const already = d.selectedPersons.some(p => p.id === member.id)
      return {
        ...d,
        selectedPersons: already
          ? d.selectedPersons.filter(p => p.id !== member.id)
          : [...d.selectedPersons, { id: member.id, name: getMemberName(member) }]
      }
    }))
  }

  const setPersonMeal = (distIdx, personId, value) => {
    setDistributions(prev => prev.map((d, i) =>
      i !== distIdx ? d : { ...d, meals: { ...d.meals, [personId]: value } }
    ))
  }

  const setPersonDonation = (distIdx, personId, value) => {
    setDistributions(prev => prev.map((d, i) =>
      i !== distIdx ? d : { ...d, donations: { ...d.donations, [personId]: value } }
    ))
  }

  // ── Handler preuve — compression avant stockage ────────────────────────────
  const handleProofSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setProofFile(file)

    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const MAX = 1200
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX }
        else                { width  = Math.round(width  * MAX / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      const compressed = canvas.toDataURL('image/jpeg', 0.75)
      setProofPreview(compressed)
    }
    img.src = objectUrl
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  const canNext = () => {
    if (step === 1) return totalSales > 0
    return true
  }

  const handleNext = () => {
    if (step < totalSteps) setStep(s => s + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(s => s - 1)
  }

  // ── Soumission ─────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const tipOutBreakdown = distributions
        .filter(d => d.enabled)
        .map(d => {
          const pct = parseFloat(d.rule?.percentage) || 0
          const total = calcDistTipTotal(d)
          const pool = isAutomatic(d)
          return {
            position:        d.rule?.position,
            percentage:      pct,
            totalAmount:     total,
            isPool:          isKitchenPool(d),
            isAutomatic:     pool,
            persons: pool ? [] : d.selectedPersons.map(p => {
              const tipAmt   = calcPersonTip(d, d.selectedPersons.length)
              const meal     = parseFloat(d.meals?.[p.id])     || 0
              const donation = parseFloat(d.donations?.[p.id]) || 0
              const net      = tipAmt - meal + donation
              return {
                personId:   p.id,
                personName: p.name,
                tipAmount:  tipAmt,
                meal,
                donation,
                net
              }
            })
          }
        })

      const payload = {
        restaurantId:       currentRestaurant?.id,
        totalSales,
        comptant,
        cashAmount:         comptant,
        tipOutTotal,
        dueBack,
        tipOutBreakdown,
        proofImageBase64:   proofPreview || null,
        voluntaryDonations: [],
        mealDeductions:     [],
        ...(forUserId ? { forUserId } : {})
      }

      await reportAPI.create(currentRestaurant?.id, payload)
      navigate('/reports')
    } catch (err) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Styles communs ─────────────────────────────────────────────────────────
  const card = {
    background: 'rgba(255,255,255,0.03)',
    border:     '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding:    '24px',
    marginBottom: 16
  }

  const inputStyle = {
    width:        '100%',
    background:   'rgba(255,255,255,0.05)',
    border:       '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding:      '12px 16px',
    color:        '#fff',
    fontSize:     15,
    outline:      'none',
    boxSizing:    'border-box'
  }

  const smallInputStyle = {
    background:   'rgba(255,255,255,0.05)',
    border:       '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8,
    padding:      '8px 12px',
    color:        '#fff',
    fontSize:     14,
    outline:      'none',
    width:        120,
    boxSizing:    'border-box'
  }

  const labelStyle = {
    display:      'block',
    fontSize:     13,
    color:        'rgba(255,255,255,0.5)',
    marginBottom: 6,
    fontWeight:   500
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────

  // Écran bloquant si aucune période active
  if (periodCheckDone && noPeriod) {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', padding: '16px', textAlign: 'center' }}>
        <div style={{
          background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: '20px', padding: '40px 32px'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: 'white', fontWeight: 700, fontSize: '20px', margin: '0 0 12px' }}>
            Aucune période de paie active
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.6, margin: '0 0 28px' }}>
            Votre manager n'a pas encore ouvert de période de paie.<br />
            Contactez votre manager pour débloquer le Cash Out.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 24px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white', fontWeight: 600, fontSize: '15px', cursor: 'pointer'
            }}
          >
            ← Retour au tableau de bord
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 80px' }}>

      {/* ── Titre ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>
          {forUserId ? `Saisir pour ${forUserName || 'un employé'}` : 'Cash Out'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', margin: '4px 0 0', fontSize: 14 }}>
          {currentRestaurant?.name || 'Mon Restaurant'}
          {forUserId && (
            <span style={{
              marginLeft: 8,
              background: 'rgba(251,191,36,0.15)',
              border: '1px solid rgba(251,191,36,0.3)',
              borderRadius: 6,
              padding: '2px 8px',
              fontSize: 11,
              color: '#fbbf24',
              fontWeight: 600
            }}>
              Soumission Manager
            </span>
          )}
        </p>
      </div>

      {/* ── Barre de progression ── */}
      <div style={{ marginBottom: 32 }}>
        {/* Labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          {stepLabels.map((label, i) => (
            <span
              key={i}
              style={{
                fontSize:   11,
                fontWeight: 600,
                color:      i + 1 === step
                  ? '#60a5fa'
                  : i + 1 < step
                    ? '#34d399'
                    : 'rgba(255,255,255,0.3)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              {label}
            </span>
          ))}
        </div>
        {/* Barre */}
        <div style={{
          height:       6,
          background:   'rgba(255,255,255,0.08)',
          borderRadius: 99,
          overflow:     'hidden'
        }}>
          <div style={{
            height:       '100%',
            width:        `${((step - 1) / (totalSteps - 1)) * 100}%`,
            background:   'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            borderRadius: 99,
            transition:   'width 0.4s ease'
          }} />
        </div>
        {/* Étape x/y */}
        <div style={{ textAlign: 'right', marginTop: 6 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
            Étape {step} / {totalSteps}
          </span>
        </div>
      </div>

      {/* ── ÉTAPE 1 : Ventes ── */}
      {step === 1 && (
        <div className="animate-fade-in">
          <div style={card}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
              Ventes du service
            </h2>
            <p style={{
              fontSize:    13,
              color:       'rgba(255,255,255,0.45)',
              margin:      '0 0 20px',
              padding:     '10px 14px',
              background:  'rgba(59,130,246,0.08)',
              border:      '1px solid rgba(59,130,246,0.2)',
              borderRadius: 8
            }}>
              Ces données proviennent de votre fiche machine
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>
                Vente totale <span style={{ color: '#f87171' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position:   'absolute',
                  left:       14,
                  top:        '50%',
                  transform:  'translateY(-50%)',
                  color:      'rgba(255,255,255,0.4)',
                  fontSize:   16,
                  fontWeight: 700,
                  pointerEvents: 'none'
                }}>$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={sales.totalSales}
                  onChange={e => setSales(s => ({ ...s, totalSales: e.target.value }))}
                  style={{ ...inputStyle, paddingLeft: 32 }}
                />
              </div>
              {totalSales <= 0 && sales.totalSales !== '' && (
                <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>
                  La vente totale doit être supérieure à 0
                </p>
              )}
            </div>

            <div>
              <label style={labelStyle}>
                Comptant{' '}
                <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>
                  (peut être négatif)
                </span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position:   'absolute',
                  left:       14,
                  top:        '50%',
                  transform:  'translateY(-50%)',
                  color:      'rgba(255,255,255,0.4)',
                  fontSize:   16,
                  fontWeight: 700,
                  pointerEvents: 'none'
                }}>$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={sales.comptant}
                  onChange={e => setSales(s => ({ ...s, comptant: e.target.value }))}
                  style={{ ...inputStyle, paddingLeft: 32 }}
                />
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
                Montant en espèces que vous avez en caisse (saisissez une valeur négative si déficit)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── ÉTAPE 2 : Distributions ── */}
      {step === 2 && (
        <div className="animate-fade-in">
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>
              Distributions
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              Ventes totales : <strong style={{ color: '#fff' }}>${totalSales.toFixed(2)}</strong>
            </p>
          </div>

          {distributions.length === 0 && (
            <div style={{
              ...card,
              textAlign:  'center',
              padding:    '40px 24px',
              color:      'rgba(255,255,255,0.4)'
            }}>
              <Users size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p style={{ margin: 0, fontSize: 14 }}>
                Aucune règle de Tip Out configurée.<br />
                Demandez à votre manager de les configurer dans les paramètres.
              </p>
            </div>
          )}

          {/* ── Pool Cuisine — carte dédiée, toujours en premier ── */}
          {distributions.filter(d => isKitchenPool(d) && d.rule?.enabled !== false).map((dist, idx) => {
            const pct       = parseFloat(dist.rule?.percentage) || 0
            const distTotal = calcDistTipTotal(dist)
            return (
              <div key={`pool-${idx}`} style={{
                background:   'rgba(245,158,11,0.08)',
                border:       '2px solid rgba(245,158,11,0.4)',
                borderRadius: 16,
                padding:      '20px 24px',
                marginBottom: 16
              }}>
                {/* En-tête */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width:        48,
                      height:       48,
                      borderRadius: 12,
                      background:   'rgba(245,158,11,0.15)',
                      border:       '1px solid rgba(245,158,11,0.4)',
                      display:      'flex',
                      alignItems:   'center',
                      justifyContent: 'center'
                    }}>
                      <UtensilsCrossed size={22} color="#fbbf24" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <p style={{ margin: 0, fontWeight: 700, color: '#fbbf24', fontSize: 16 }}>
                          Pool Cuisine
                        </p>
                        <span style={{
                          fontSize:     10,
                          background:   'rgba(245,158,11,0.2)',
                          color:        '#fbbf24',
                          border:       '1px solid rgba(245,158,11,0.4)',
                          borderRadius: 4,
                          padding:      '2px 6px',
                          fontWeight:   700,
                          letterSpacing: '0.05em'
                        }}>AUTO</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                        Versé automatiquement — {pct}% des ventes
                      </p>
                    </div>
                  </div>

                  {/* Toggle on/off */}
                  <button
                    onClick={() => toggleDistribution(distributions.indexOf(dist))}
                    style={{
                      width:        44,
                      height:       24,
                      borderRadius: 12,
                      border:       'none',
                      cursor:       'pointer',
                      background:   dist.enabled ? '#fbbf24' : 'rgba(255,255,255,0.1)',
                      position:     'relative',
                      transition:   'background 0.2s'
                    }}
                  >
                    <div style={{
                      width:        18,
                      height:       18,
                      borderRadius: '50%',
                      background:   '#fff',
                      position:     'absolute',
                      top:          3,
                      left:         dist.enabled ? 23 : 3,
                      transition:   'left 0.2s'
                    }} />
                  </button>
                </div>

                {/* Montant calculé */}
                <div style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'space-between',
                  background:     'rgba(245,158,11,0.1)',
                  border:         '1px solid rgba(245,158,11,0.25)',
                  borderRadius:   12,
                  padding:        '14px 18px'
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
                      Montant versé au pool cuisine
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,191,36,0.6)' }}>
                      ${totalSales.toFixed(2)} × {pct}%
                    </p>
                  </div>
                  <p style={{
                    margin:     0,
                    fontSize:   28,
                    fontWeight: 900,
                    color:      dist.enabled ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                    opacity:    dist.enabled ? 1 : 0.5,
                    transition: 'all 0.2s'
                  }}>
                    ${distTotal.toFixed(2)}
                  </p>
                </div>

                {!dist.enabled && (
                  <p style={{ margin: '10px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
                    Pool cuisine désactivé pour ce service
                  </p>
                )}
              </div>
            )
          })}

          {/* ── Règles automatiques (non-pool) — violet ── */}
          {distributions.filter(d => !isKitchenPool(d) && d.rule?.automatic && d.rule?.enabled !== false).map((dist, idx) => {
            const pct       = parseFloat(dist.rule?.percentage) || 0
            const distTotal = calcDistTipTotal(dist)
            return (
              <div key={`auto-${idx}`} style={{
                background:   'rgba(139,92,246,0.08)',
                border:       '2px solid rgba(139,92,246,0.35)',
                borderRadius: 16,
                padding:      '20px 24px',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={22} color="#a78bfa" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <p style={{ margin: 0, fontWeight: 700, color: '#a78bfa', fontSize: 16, textTransform: 'capitalize' }}>
                          {formatPosition(dist.rule?.position)}
                        </p>
                        <span style={{ fontSize: 10, background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.4)', borderRadius: 4, padding: '2px 6px', fontWeight: 700, letterSpacing: '0.05em' }}>AUTO</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: 'rgba(167,139,250,0.6)', marginTop: 2 }}>
                        Versé automatiquement — {pct}% des ventes
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleDistribution(distributions.indexOf(dist))}
                    style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: dist.enabled ? '#8b5cf6' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background 0.2s' }}
                  >
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: dist.enabled ? 23 : 3, transition: 'left 0.2s' }} />
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 12, padding: '14px 18px' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>Montant distribué automatiquement</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'rgba(167,139,250,0.6)' }}>${totalSales.toFixed(2)} × {pct}%</p>
                  </div>
                  <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: dist.enabled ? '#a78bfa' : 'rgba(255,255,255,0.2)', opacity: dist.enabled ? 1 : 0.5, transition: 'all 0.2s' }}>
                    ${distTotal.toFixed(2)}
                  </p>
                </div>
                {!dist.enabled && (
                  <p style={{ margin: '10px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
                    Règle désactivée pour ce service
                  </p>
                )}
              </div>
            )
          })}

          {/* ── Séparateur si règles auto + règles manuelles ── */}
          {distributions.some(d => isAutomatic(d) && d.rule?.enabled !== false) && distributions.some(d => !isAutomatic(d) && d.rule?.enabled !== false) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Distributions équipe
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>
          )}

          {/* ── Distributions manuelles (hors automatiques) ── */}
          {distributions.filter(d => !isAutomatic(d) && d.rule?.enabled !== false).map((dist, distIdx) => {
            const pos       = dist.rule?.position?.toLowerCase() || 'default'
            const colors    = ROLE_COLORS[pos] || ROLE_COLORS.bar
            const Icon      = ROLE_ICONS[pos]  || ROLE_ICONS.default
            const pct       = parseFloat(dist.rule?.percentage) || 0
            const distTotal = calcDistTipTotal(dist)
            const count     = dist.selectedPersons.length
            // Index réel dans le tableau distributions complet
            const realIdx   = distributions.indexOf(dist)

            return (
              <div key={distIdx} style={{
                ...card,
                border:     dist.enabled
                  ? `1px solid ${colors.border}`
                  : '1px solid rgba(255,255,255,0.06)',
                opacity:    dist.enabled ? 1 : 0.5,
                transition: 'all 0.2s ease'
              }}>
                {/* En-tête de la règle */}
                <div style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'space-between',
                  marginBottom:   dist.enabled ? 16 : 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width:        40,
                      height:       40,
                      borderRadius: 10,
                      background:   colors.bg,
                      border:       `1px solid ${colors.border}`,
                      display:      'flex',
                      alignItems:   'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={18} color={colors.color} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: 15 }}>
                        {formatPosition(dist.rule?.position)}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                        {pct}% des ventes — <strong style={{ color: colors.color }}>${distTotal.toFixed(2)}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Toggle activé */}
                  <button
                    onClick={() => toggleDistribution(realIdx)}
                    style={{
                      width:        44,
                      height:       24,
                      borderRadius: 12,
                      border:       'none',
                      cursor:       'pointer',
                      background:   dist.enabled ? colors.color : 'rgba(255,255,255,0.1)',
                      position:     'relative',
                      transition:   'background 0.2s'
                    }}
                  >
                    <div style={{
                      width:        18,
                      height:       18,
                      borderRadius: '50%',
                      background:   '#fff',
                      position:     'absolute',
                      top:          3,
                      left:         dist.enabled ? 23 : 3,
                      transition:   'left 0.2s'
                    }} />
                  </button>
                </div>

                {dist.enabled && (
                  <>
                    {/* Sélection des personnes */}
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ ...labelStyle, marginBottom: 10 }}>
                        Sélectionnez les bénéficiaires :
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {teamMembers
                          .filter(() => true)
                          .map(member => {
                            const selected = dist.selectedPersons.some(p => p.id === member.id)
                            return (
                              <button
                                key={member.id}
                                onClick={() => togglePersonForDistribution(realIdx, member)}
                                style={{
                                  padding:      '6px 14px',
                                  borderRadius: 20,
                                  border:       selected
                                    ? `1px solid ${colors.color}`
                                    : '1px solid rgba(255,255,255,0.12)',
                                  background:   selected ? colors.bg : 'transparent',
                                  color:        selected ? colors.color : 'rgba(255,255,255,0.6)',
                                  cursor:       'pointer',
                                  fontSize:     13,
                                  fontWeight:   selected ? 600 : 400,
                                  transition:   'all 0.15s'
                                }}
                              >
                                {getMemberName(member)}
                              </button>
                            )
                          })}
                        {teamMembers.length === 0 && (
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                            Aucun membre dans l'équipe
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Cartes par personne */}
                    {dist.selectedPersons.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {dist.selectedPersons.map(person => {
                          const tipAmt   = calcPersonTip(dist, count)
                          const meal     = parseFloat(dist.meals?.[person.id])     || 0
                          const donation = parseFloat(dist.donations?.[person.id]) || 0
                          const net      = tipAmt - meal + donation

                          return (
                            <div key={person.id} style={{
                              background:   'rgba(255,255,255,0.04)',
                              border:       '1px solid rgba(255,255,255,0.08)',
                              borderRadius: 12,
                              padding:      '14px 16px'
                            }}>
                              {/* Nom + tip calculé */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{
                                    width:        32,
                                    height:       32,
                                    borderRadius: '50%',
                                    background:   colors.bg,
                                    border:       `1px solid ${colors.border}`,
                                    display:      'flex',
                                    alignItems:   'center',
                                    justifyContent: 'center',
                                    fontSize:     12,
                                    fontWeight:   700,
                                    color:        colors.color
                                  }}>
                                    {(person.name || '?')[0].toUpperCase()}
                                  </div>
                                  <span style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>
                                    {person.name}
                                  </span>
                                </div>
                                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                                  Tip calculé : <strong style={{ color: colors.color }}>${tipAmt.toFixed(2)}</strong>
                                </span>
                              </div>

                              {/* Repas du shift */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', flex: 1, minWidth: 130 }}>
                                  Repas du shift $
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  value={dist.meals?.[person.id] || ''}
                                  onChange={e => setPersonMeal(realIdx, person.id, e.target.value)}
                                  style={smallInputStyle}
                                />
                              </div>

                              {/* Don supplémentaire */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', flex: 1, minWidth: 130 }}>
                                  Don supplémentaire $
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  value={dist.donations?.[person.id] || ''}
                                  onChange={e => setPersonDonation(realIdx, person.id, e.target.value)}
                                  style={smallInputStyle}
                                />
                              </div>

                              {/* Net à remettre */}
                              <div style={{
                                display:        'flex',
                                alignItems:     'center',
                                justifyContent: 'space-between',
                                paddingTop:     10,
                                borderTop:      '1px solid rgba(255,255,255,0.06)'
                              }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                                  Net à remettre
                                </span>
                                <span style={{
                                  fontSize:   16,
                                  fontWeight: 800,
                                  color:      net >= 0 ? '#34d399' : '#f87171'
                                }}>
                                  ${net.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}

          {/* Résumé rapide tip-out */}
          {distributions.length > 0 && (
            <div style={{
              ...card,
              background:   'rgba(251,191,36,0.05)',
              border:       '1px solid rgba(251,191,36,0.2)'
            }}>
              <p style={{ margin: '0 0 4px', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                Total Tip-Out estimé
              </p>
              <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#fbbf24' }}>
                ${tipOutTotal.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── ÉTAPE 3 : Preuve ── */}
      {step === 3 && (
        <div className="animate-fade-in">
          <div style={card}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
              Preuve de calcul
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '0 0 24px' }}>
              Facultatif — cette photo sera jointe à votre rapport.
            </p>

            {/* Zone de capture */}
            <input
              ref={proofInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleProofSelect}
              style={{ display: 'none' }}
            />

            {!proofPreview ? (
              <button
                onClick={() => proofInputRef.current?.click()}
                style={{
                  width:          '100%',
                  minHeight:      200,
                  display:        'flex',
                  flexDirection:  'column',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:            12,
                  background:     'rgba(255,255,255,0.03)',
                  border:         '2px dashed rgba(255,255,255,0.15)',
                  borderRadius:   14,
                  cursor:         'pointer',
                  color:          'rgba(255,255,255,0.5)',
                  transition:     'border-color 0.2s, background 0.2s'
                }}
              >
                <Camera size={40} style={{ opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
                  Photographiez votre feuille de calcul
                </p>
                <p style={{ margin: 0, fontSize: 12, opacity: 0.6 }}>
                  (facultatif)
                </p>
              </button>
            ) : (
              <div>
                <img
                  src={proofPreview}
                  alt="Preuve de calcul"
                  style={{
                    width:        '100%',
                    borderRadius: 12,
                    maxHeight:    320,
                    objectFit:    'cover',
                    marginBottom: 12,
                    border:       '1px solid rgba(255,255,255,0.1)'
                  }}
                />
                <button
                  onClick={() => proofInputRef.current?.click()}
                  style={{
                    width:        '100%',
                    padding:      '10px',
                    background:   'rgba(255,255,255,0.05)',
                    border:       '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 8,
                    color:        'rgba(255,255,255,0.7)',
                    cursor:       'pointer',
                    fontSize:     13
                  }}
                >
                  Changer la photo
                </button>
              </div>
            )}
          </div>

          {/* Bouton passer cette étape */}
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button
              onClick={handleBack}
              style={{
                padding:        '14px 20px',
                background:     'rgba(255,255,255,0.05)',
                border:         '1px solid rgba(255,255,255,0.12)',
                borderRadius:   12,
                color:          'rgba(255,255,255,0.7)',
                cursor:         'pointer',
                fontSize:       14,
                display:        'flex',
                alignItems:     'center',
                gap:            6
              }}
            >
              <ChevronLeft size={18} />
              Retour
            </button>
            <button
              onClick={handleNext}
              style={{
                flex:           1,
                padding:        '14px',
                background:     'transparent',
                border:         '1px solid rgba(255,255,255,0.12)',
                borderRadius:   12,
                color:          'rgba(255,255,255,0.5)',
                cursor:         'pointer',
                fontSize:       14,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            8
              }}
            >
              <SkipForward size={16} />
              Passer cette étape
            </button>
          </div>
        </div>
      )}

      {/* ── ÉTAPE 4 : Résumé ── */}
      {step === 4 && (
        <div className="animate-fade-in">
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 20px' }}>
            Résumé du Cash Out
          </h2>

          {/* Tableau récapitulatif */}
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Récapitulatif
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Vente totale */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Vente totale</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                  ${totalSales.toFixed(2)}
                </span>
              </div>

              {/* Tip-Out total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Tip-Out total</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#fbbf24' }}>
                  -${tipOutTotal.toFixed(2)}
                </span>
              </div>

              {/* Comptant */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Comptant</span>
                <span style={{
                  fontSize:   15,
                  fontWeight: 700,
                  color:      comptant > 0 ? '#34d399' : comptant < 0 ? '#f87171' : 'rgba(255,255,255,0.6)'
                }}>
                  {comptant >= 0 ? '+' : ''}{comptant.toFixed(2)}$
                </span>
              </div>

              {/* Séparateur */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '6px 0' }} />

              {/* Breakdown distributions */}
              {distributions.filter(d => d.enabled).length > 0 && (
                <>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Détail des distributions
                  </p>
                  {distributions
                    .filter(d => d.enabled)
                    .map((dist, i) => {
                      const pool  = isKitchenPool(dist)
                      const pos   = dist.rule?.position?.toLowerCase() || 'default'
                      const colors = ROLE_COLORS[pos] || ROLE_COLORS.bar
                      const count  = dist.selectedPersons.length
                      const total  = calcDistTipTotal(dist)

                      return (
                        <div key={i} style={{
                          background:   colors.bg,
                          border:       `1px solid ${colors.border}`,
                          borderRadius: 10,
                          padding:      '10px 14px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: pool || count === 0 ? 0 : 6 }}>
                            <span style={{ fontSize: 13, color: colors.color, fontWeight: 600 }}>
                              {formatPosition(dist.rule?.position)}
                              {pool ? ' (pool)' : count > 0 ? ` (${count} pers.)` : ''}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: colors.color }}>
                              ${total.toFixed(2)}
                            </span>
                          </div>

                          {!pool && dist.selectedPersons.map(person => {
                            const tipAmt   = calcPersonTip(dist, count)
                            const meal     = parseFloat(dist.meals?.[person.id])     || 0
                            const donation = parseFloat(dist.donations?.[person.id]) || 0
                            const net      = tipAmt - meal + donation
                            return (
                              <div key={person.id} style={{
                                display:        'flex',
                                justifyContent: 'space-between',
                                fontSize:       12,
                                color:          'rgba(255,255,255,0.55)',
                                paddingTop:     4,
                                borderTop:      '1px solid rgba(255,255,255,0.06)',
                                marginTop:      4
                              }}>
                                <span>{person.name}</span>
                                <span style={{ color: net >= 0 ? '#34d399' : '#f87171', fontWeight: 600 }}>
                                  ${net.toFixed(2)}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                </>
              )}
            </div>
          </div>

          {/* DUE BACK — Bloc principal */}
          <div style={{
            borderRadius: 18,
            padding:      '28px 24px',
            marginBottom: 20,
            textAlign:    'center',
            background:   dueBack > 0
              ? 'rgba(239,68,68,0.12)'
              : dueBack < 0
                ? 'rgba(52,211,153,0.12)'
                : 'rgba(255,255,255,0.05)',
            border:       dueBack > 0
              ? '2px solid rgba(239,68,68,0.4)'
              : dueBack < 0
                ? '2px solid rgba(52,211,153,0.4)'
                : '2px solid rgba(255,255,255,0.1)'
          }}>
            <p style={{
              margin:      '0 0 8px',
              fontSize:    13,
              fontWeight:  600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color:        dueBack > 0
                ? 'rgba(248,113,113,0.8)'
                : dueBack < 0
                  ? 'rgba(52,211,153,0.8)'
                  : 'rgba(255,255,255,0.4)'
            }}>
              {dueBack > 0
                ? 'À remettre au gérant 🔴'
                : dueBack < 0
                  ? 'Le gérant vous doit 🟢'
                  : 'Caisse équilibrée ✓'}
            </p>
            <p style={{
              margin:     0,
              fontSize:   48,
              fontWeight: 900,
              lineHeight: 1.1,
              color:      dueBack > 0
                ? '#ef4444'
                : dueBack < 0
                  ? '#34d399'
                  : '#fff'
            }}>
              ${Math.abs(dueBack).toFixed(2)}
            </p>
            {dueBack !== 0 && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                {dueBack > 0
                  ? 'Vous devez remettre ce montant en espèces au gérant'
                  : 'Le gérant vous doit ce montant'}
              </p>
            )}
          </div>

          {/* Preuve jointe */}
          {proofPreview && (
            <div style={{ ...card, marginBottom: 20 }}>
              <p style={{ margin: '0 0 10px', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                Preuve jointe
              </p>
              <img
                src={proofPreview}
                alt="Preuve"
                style={{
                  width:        '100%',
                  borderRadius: 10,
                  maxHeight:    180,
                  objectFit:    'cover'
                }}
              />
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:          10,
              background:   'rgba(239,68,68,0.1)',
              border:       '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10,
              padding:      '12px 16px',
              marginBottom: 16,
              color:        '#f87171',
              fontSize:     14
            }}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Bouton soumettre */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width:          '100%',
              padding:        '16px',
              background:     submitting
                ? 'rgba(255,255,255,0.05)'
                : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              border:         'none',
              borderRadius:   14,
              color:          '#fff',
              fontSize:       16,
              fontWeight:     700,
              cursor:         submitting ? 'not-allowed' : 'pointer',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            10,
              opacity:        submitting ? 0.6 : 1,
              transition:     'all 0.2s'
            }}
          >
            {submitting ? (
              <>
                <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                Envoi en cours...
              </>
            ) : (
              <>
                <Check size={20} />
                {forUserId ? `Soumettre pour ${forUserName || 'l\'employé'}` : 'Soumettre le rapport'}
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Navigation Précédent / Suivant ── */}
      {step !== 3 && step !== 4 && (
        <div style={{
          display:        'flex',
          gap:            12,
          marginTop:      24,
          justifyContent: step === 1 ? 'flex-end' : 'space-between'
        }}>
          {step > 1 && (
            <button
              onClick={handleBack}
              style={{
                padding:        '12px 20px',
                background:     'rgba(255,255,255,0.05)',
                border:         '1px solid rgba(255,255,255,0.12)',
                borderRadius:   12,
                color:          'rgba(255,255,255,0.7)',
                cursor:         'pointer',
                fontSize:       14,
                display:        'flex',
                alignItems:     'center',
                gap:            6
              }}
            >
              <ChevronLeft size={18} />
              Retour
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={!canNext()}
            style={{
              padding:        '12px 24px',
              background:     canNext()
                ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                : 'rgba(255,255,255,0.05)',
              border:         'none',
              borderRadius:   12,
              color:          canNext() ? '#fff' : 'rgba(255,255,255,0.3)',
              cursor:         canNext() ? 'pointer' : 'not-allowed',
              fontSize:       14,
              fontWeight:     600,
              display:        'flex',
              alignItems:     'center',
              gap:            6,
              transition:     'all 0.2s'
            }}
          >
            Suivant
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Navigation pour étape 3 avec photo déjà prise */}
      {step === 3 && proofPreview && (
        <div style={{
          display:        'flex',
          gap:            12,
          marginTop:      24,
          justifyContent: 'space-between'
        }}>
          <button
            onClick={handleBack}
            style={{
              padding:        '12px 20px',
              background:     'rgba(255,255,255,0.05)',
              border:         '1px solid rgba(255,255,255,0.12)',
              borderRadius:   12,
              color:          'rgba(255,255,255,0.7)',
              cursor:         'pointer',
              fontSize:       14,
              display:        'flex',
              alignItems:     'center',
              gap:            6
            }}
          >
            <ChevronLeft size={18} />
            Retour
          </button>

          <button
            onClick={handleNext}
            style={{
              padding:        '12px 24px',
              background:     'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              border:         'none',
              borderRadius:   12,
              color:          '#fff',
              cursor:         'pointer',
              fontSize:       14,
              fontWeight:     600,
              display:        'flex',
              alignItems:     'center',
              gap:            6
            }}
          >
            Suivant
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Navigation Retour sur étape 4 */}
      {step === 4 && (
        <div style={{ marginTop: 16 }}>
          <button
            onClick={handleBack}
            style={{
              padding:        '12px 20px',
              background:     'rgba(255,255,255,0.05)',
              border:         '1px solid rgba(255,255,255,0.12)',
              borderRadius:   12,
              color:          'rgba(255,255,255,0.7)',
              cursor:         'pointer',
              fontSize:       14,
              display:        'flex',
              alignItems:     'center',
              gap:            6
            }}
          >
            <ChevronLeft size={18} />
            Retour
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
