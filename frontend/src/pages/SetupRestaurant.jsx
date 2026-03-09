import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { setupAPI, authAPI } from '../services/api'
import {
  Building2, User, Lock, Eye, EyeOff, Phone, MapPin, Camera,
  Check, AlertCircle, ChevronRight, ChevronLeft, Zap, Mail, ShieldCheck, X
} from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Profil',       icon: User },
  { id: 2, label: 'Photo',        icon: Camera },
  { id: 3, label: 'Sécurité',     icon: ShieldCheck },
  { id: 4, label: 'Confirmation', icon: Check },
]

const BG = 'linear-gradient(160deg, #0a1628 0%, #0f172a 50%, #0c1220 100%)'

export default function SetupRestaurant() {
  const { token }   = useParams()
  const navigate    = useNavigate()
  const fileRef     = useRef()

  const [info, setInfo]               = useState(null)
  const [loadingInfo, setLoadingInfo] = useState(true)
  const [infoError, setInfoError]     = useState('')

  const [step, setStep]               = useState(1)
  const [form, setForm]               = useState({
    firstName: '', lastName: '', phone: '',
    restaurantAddress: '',
    password: '', confirm: '',
    photo: null, photoPreview: null
  })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState(false)
  const [focusedField, setFocusedField] = useState(null)

  useEffect(() => {
    setupAPI.getInfo(token)
      .then(res => setInfo(res.invitation))
      .catch(err => setInfoError(err.message))
      .finally(() => setLoadingInfo(false))
  }, [token])

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handlePhoto = e => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('La photo ne doit pas dépasser 5 Mo')
      return
    }
    const reader = new FileReader()
    reader.onload = ev => setForm(prev => ({ ...prev, photo: file, photoPreview: ev.target.result }))
    reader.readAsDataURL(file)
    setError('')
  }

  const removePhoto = () => {
    setForm(prev => ({ ...prev, photo: null, photoPreview: null }))
    if (fileRef.current) fileRef.current.value = ''
  }

  const validateStep = () => {
    if (step === 1) {
      if (!form.firstName.trim() || !form.lastName.trim()) {
        setError('Prénom et nom sont requis')
        return false
      }
    }
    if (step === 3) {
      if (!form.password) { setError('Le mot de passe est requis'); return false }
      if (form.password.length < 6) { setError('Minimum 6 caractères'); return false }
      if (form.password !== form.confirm) { setError('Les mots de passe ne correspondent pas'); return false }
    }
    return true
  }

  const handleNext = () => {
    if (!validateStep()) return
    setError('')
    setStep(s => s + 1)
  }

  const handleBack = () => { setError(''); setStep(s => s - 1) }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const res = await setupAPI.complete(token, {
        firstName:         form.firstName,
        lastName:          form.lastName,
        password:          form.password,
        phone:             form.phone || undefined,
        restaurantAddress: form.restaurantAddress || undefined
      })

      // Stocker le token JWT avant l'upload de photo
      localStorage.setItem('token', res.token)
      localStorage.setItem('currentRestaurant', JSON.stringify(res.user.restaurants[0]))

      // Upload photo si sélectionnée
      if (form.photo) {
        try { await authAPI.uploadPhoto(form.photo) } catch (e) { /* non-bloquant */ }
      }

      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 2200)
    } catch (err) {
      setError(err.message || 'Erreur lors de la configuration')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Styles ────────────────────────────────────────────────
  const inp = (field, icon = true) => ({
    width: '100%',
    padding: icon ? '13px 14px 13px 44px' : '13px 14px',
    background: 'rgba(15,23,42,0.7)',
    border: `1.5px solid ${focusedField === field ? '#f59e0b' : 'rgba(51,65,85,0.8)'}`,
    borderRadius: '12px', color: 'white', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(245,158,11,0.12)' : 'none'
  })

  const label = (txt, opt = false) => (
    <label style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
      {txt} {opt && <span style={{ color: '#475569', fontWeight: 400 }}>(facultatif)</span>}
    </label>
  )

  const iconStyle = field => ({
    position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)',
    color: focusedField === field ? '#fbbf24' : '#475569', pointerEvents: 'none', transition: 'color 0.2s'
  })

  const pageBackground = (
    <>
      <div style={{ position: 'fixed', top: '-15%', right: '-8%', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-20%', left: '-12%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />
    </>
  )

  // ─── Loading ───────────────────────────────────────────────
  if (loadingInfo) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '52px', height: '52px', border: '3px solid rgba(245,158,11,0.2)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#64748b', fontSize: '14px' }}>Vérification de l'invitation...</p>
      </div>
    </div>
  )

  // ─── Invalide ──────────────────────────────────────────────
  if (infoError) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '20px', background: 'rgba(239,68,68,0.1)', borderRadius: '50%', marginBottom: '20px', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle size={40} style={{ color: '#f87171' }} />
        </div>
        <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>Invitation invalide</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px', lineHeight: 1.6 }}>{infoError}</p>
        <a href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'rgba(51,65,85,0.6)', border: '1px solid rgba(71,85,105,0.4)', borderRadius: '12px', color: 'white', textDecoration: 'none', fontSize: '14px' }}>
          Retour à la connexion
        </a>
      </div>
    </div>
  )

  // ─── Succès ────────────────────────────────────────────────
  if (success) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '24px', background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.1))', borderRadius: '50%', marginBottom: '24px', border: '1px solid rgba(16,185,129,0.3)', boxShadow: '0 0 40px rgba(16,185,129,0.15)' }}>
          <Check size={48} style={{ color: '#10b981' }} />
        </div>
        <h1 style={{ color: 'white', fontSize: '26px', fontWeight: 700, marginBottom: '10px' }}>Restaurant configuré !</h1>
        <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: '6px' }}>
          Bienvenue sur ShiftClose, <strong style={{ color: 'white' }}>{form.firstName}</strong> !
        </p>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px' }}>Redirection vers votre tableau de bord...</p>
        <div style={{ width: '36px', height: '36px', border: '3px solid rgba(16,185,129,0.2)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
      </div>
    </div>
  )

  // ─── Boutons nav ───────────────────────────────────────────
  const NavButtons = ({ onNext, nextLabel = 'Suivant', onSubmit }) => (
    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
      {step > 1 && (
        <button onClick={handleBack} disabled={submitting} style={{ flex: 1, padding: '14px', background: 'rgba(51,65,85,0.5)', border: '1px solid rgba(71,85,105,0.4)', borderRadius: '14px', color: '#94a3b8', fontWeight: 600, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <ChevronLeft size={18} /> Retour
        </button>
      )}
      {onSubmit ? (
        <button onClick={onSubmit} disabled={submitting} style={{ flex: 2, padding: '14px', background: submitting ? 'rgba(51,65,85,0.8)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: '14px', color: 'white', fontWeight: 600, fontSize: '15px', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: submitting ? 'none' : '0 8px 24px rgba(16,185,129,0.4)', opacity: submitting ? 0.7 : 1 }}>
          {submitting
            ? <><div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Création...</>
            : <><Check size={18} /> Créer mon compte</>
          }
        </button>
      ) : (
        <button onClick={onNext || handleNext} style={{ flex: step === 1 ? '1 1 100%' : 2, padding: '14px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none', borderRadius: '14px', color: 'white', fontWeight: 600, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(245,158,11,0.4)' }}>
          {nextLabel} <ChevronRight size={18} />
        </button>
      )}
    </div>
  )

  // ─── Formulaire principal ──────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {pageBackground}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px 28px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(59,130,246,0.45)' }}>
            <Zap size={22} color="white" fill="white" />
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '22px', letterSpacing: '-0.4px' }}>ShiftClose</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 16px 48px', position: 'relative', zIndex: 10 }}>
        <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ── Carte invitation ── */}
          <div style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '20px', padding: '18px 22px', backdropFilter: 'blur(24px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', flexShrink: 0, borderRadius: '13px', background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,191,36,0.1))', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={22} style={{ color: '#f59e0b' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Restaurant</p>
                <h2 style={{ color: 'white', fontSize: '17px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{info?.restaurantName}</h2>
              </div>
            </div>
            <div style={{ marginTop: '14px', display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={12} style={{ color: '#64748b' }} />
                <span style={{ color: '#64748b', fontSize: '12px' }}>Invité par <span style={{ color: '#cbd5e1' }}>{info?.invitedByName}</span></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={12} style={{ color: '#64748b' }} />
                <span style={{ color: '#fbbf24', fontSize: '12px' }}>{info?.email}</span>
              </div>
            </div>
          </div>

          {/* ── Indicateur d'étapes ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {STEPS.map((s, i) => {
              const done = step > s.id, active = step === s.id, pending = step < s.id
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', background: done ? 'linear-gradient(135deg,#10b981,#059669)' : active ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'rgba(51,65,85,0.5)', border: pending ? '1.5px solid rgba(71,85,105,0.5)' : 'none', color: pending ? '#64748b' : 'white', boxShadow: active ? '0 3px 10px rgba(245,158,11,0.4)' : done ? '0 3px 8px rgba(16,185,129,0.3)' : 'none', transition: 'all 0.3s' }}>
                      {done ? <Check size={15} /> : s.id}
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: active ? 600 : 400, color: active ? '#fbbf24' : done ? '#34d399' : '#475569', whiteSpace: 'nowrap' }}>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ width: '50px', height: '2px', margin: '0 3px', marginBottom: '16px', background: step > s.id ? 'linear-gradient(90deg,#10b981,#059669)' : 'rgba(51,65,85,0.5)', transition: 'background 0.3s', flexShrink: 0 }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Carte formulaire ── */}
          <div style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(51,65,85,0.7)', borderRadius: '24px', padding: '28px 26px 24px', backdropFilter: 'blur(24px)', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}>

            {/* Erreur */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', color: '#f87171', fontSize: '14px', marginBottom: '20px' }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
              </div>
            )}

            {/* ══ Étape 1 : Profil ══ */}
            {step === 1 && (
              <>
                <div style={{ marginBottom: '22px' }}>
                  <h1 style={{ color: 'white', fontSize: '21px', fontWeight: 700, letterSpacing: '-0.4px', marginBottom: '5px' }}>Votre profil</h1>
                  <p style={{ color: '#64748b', fontSize: '13px' }}>Informations personnelles du Manager.</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Prénom + Nom */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      {label('Prénom')}
                      <div style={{ position: 'relative' }}>
                        <User size={14} style={iconStyle('firstName')} />
                        <input type="text" name="firstName" value={form.firstName} onChange={handleChange}
                          placeholder="Jean" required autoFocus
                          style={inp('firstName')}
                          onFocus={() => setFocusedField('firstName')} onBlur={() => setFocusedField(null)}
                          onKeyDown={e => e.key === 'Enter' && handleNext()} />
                      </div>
                    </div>
                    <div>
                      {label('Nom')}
                      <div style={{ position: 'relative' }}>
                        <User size={14} style={iconStyle('lastName')} />
                        <input type="text" name="lastName" value={form.lastName} onChange={handleChange}
                          placeholder="Dupont" required
                          style={inp('lastName')}
                          onFocus={() => setFocusedField('lastName')} onBlur={() => setFocusedField(null)}
                          onKeyDown={e => e.key === 'Enter' && handleNext()} />
                      </div>
                    </div>
                  </div>
                  {/* Téléphone */}
                  <div>
                    {label('Téléphone', true)}
                    <div style={{ position: 'relative' }}>
                      <Phone size={14} style={iconStyle('phone')} />
                      <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                        placeholder="+1 514 123 4567"
                        style={inp('phone')}
                        onFocus={() => setFocusedField('phone')} onBlur={() => setFocusedField(null)} />
                    </div>
                  </div>
                  {/* Adresse restaurant */}
                  <div>
                    {label('Adresse du restaurant', true)}
                    <div style={{ position: 'relative' }}>
                      <MapPin size={14} style={iconStyle('restaurantAddress')} />
                      <input type="text" name="restaurantAddress" value={form.restaurantAddress} onChange={handleChange}
                        placeholder="123 Rue Principale, Montréal, QC"
                        style={inp('restaurantAddress')}
                        onFocus={() => setFocusedField('restaurantAddress')} onBlur={() => setFocusedField(null)} />
                    </div>
                  </div>
                </div>
                <NavButtons />
              </>
            )}

            {/* ══ Étape 2 : Photo ══ */}
            {step === 2 && (
              <>
                <div style={{ marginBottom: '22px' }}>
                  <h1 style={{ color: 'white', fontSize: '21px', fontWeight: 700, letterSpacing: '-0.4px', marginBottom: '5px' }}>Photo de profil</h1>
                  <p style={{ color: '#64748b', fontSize: '13px' }}>Ajoutez une photo pour personnaliser votre profil. <span style={{ color: '#475569' }}>(Facultatif)</span></p>
                </div>

                {/* Zone photo */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  {/* Avatar preview */}
                  <div style={{ position: 'relative' }}>
                    {form.photoPreview ? (
                      <div style={{ position: 'relative' }}>
                        <img src={form.photoPreview} alt="preview" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #f59e0b', boxShadow: '0 0 0 4px rgba(245,158,11,0.15)' }} />
                        <button onClick={removePhoto} style={{ position: 'absolute', top: '-4px', right: '-4px', width: '26px', height: '26px', background: '#ef4444', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <X size={14} color="white" />
                        </button>
                      </div>
                    ) : (
                      <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(51,65,85,0.6)', border: '2px dashed rgba(71,85,105,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#64748b', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>
                        <Camera size={32} />
                        <span style={{ fontSize: '11px' }}>Ajouter</span>
                      </div>
                    )}
                  </div>

                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} style={{ display: 'none' }} />

                  {!form.photoPreview && (
                    <button onClick={() => fileRef.current?.click()} style={{ padding: '10px 24px', background: 'rgba(51,65,85,0.6)', border: '1px solid rgba(71,85,105,0.5)', borderRadius: '12px', color: '#cbd5e1', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Camera size={16} /> Choisir une photo
                    </button>
                  )}
                  {form.photoPreview && (
                    <button onClick={() => fileRef.current?.click()} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid rgba(71,85,105,0.4)', borderRadius: '10px', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>
                      Changer la photo
                    </button>
                  )}

                  <p style={{ color: '#475569', fontSize: '12px', textAlign: 'center' }}>JPG, PNG ou WebP · Max 5 Mo</p>
                </div>

                <NavButtons nextLabel={form.photo ? 'Suivant' : 'Passer'} />
              </>
            )}

            {/* ══ Étape 3 : Sécurité ══ */}
            {step === 3 && (
              <>
                <div style={{ marginBottom: '22px' }}>
                  <h1 style={{ color: 'white', fontSize: '21px', fontWeight: 700, letterSpacing: '-0.4px', marginBottom: '5px' }}>Sécurité</h1>
                  <p style={{ color: '#64748b', fontSize: '13px' }}>Choisissez un mot de passe sécurisé.</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Mot de passe */}
                  <div>
                    {label('Mot de passe')}
                    <div style={{ position: 'relative' }}>
                      <Lock size={14} style={iconStyle('password')} />
                      <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                        placeholder="Minimum 6 caractères" required autoFocus
                        style={{ ...inp('password'), paddingRight: '48px' }}
                        onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px', display: 'flex' }}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {/* Barre de force */}
                    {form.password && (
                      <div style={{ marginTop: '8px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {[1,2,3].map(i => (
                          <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: form.password.length >= i * 3 ? (i === 1 ? '#ef4444' : i === 2 ? '#f59e0b' : '#10b981') : 'rgba(51,65,85,0.6)', transition: 'background 0.2s' }} />
                        ))}
                        <span style={{ fontSize: '11px', color: form.password.length < 3 ? '#ef4444' : form.password.length < 6 ? '#f59e0b' : '#10b981', marginLeft: '6px', whiteSpace: 'nowrap' }}>
                          {form.password.length < 3 ? 'Faible' : form.password.length < 6 ? 'Moyen' : 'Fort'}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Confirmer */}
                  <div>
                    {label('Confirmer le mot de passe')}
                    <div style={{ position: 'relative' }}>
                      <Lock size={14} style={{ ...iconStyle('confirm'), color: form.confirm && form.confirm !== form.password ? '#f87171' : focusedField === 'confirm' ? '#fbbf24' : '#475569' }} />
                      <input type={showPassword ? 'text' : 'password'} name="confirm" value={form.confirm} onChange={handleChange}
                        placeholder="Répétez le mot de passe" required
                        style={{ ...inp('confirm'), borderColor: form.confirm && form.confirm !== form.password ? 'rgba(239,68,68,0.6)' : focusedField === 'confirm' ? '#f59e0b' : 'rgba(51,65,85,0.8)' }}
                        onFocus={() => setFocusedField('confirm')} onBlur={() => setFocusedField(null)} />
                    </div>
                    {form.confirm && form.confirm !== form.password && (
                      <p style={{ color: '#f87171', fontSize: '12px', marginTop: '5px' }}>Les mots de passe ne correspondent pas</p>
                    )}
                    {form.confirm && form.confirm === form.password && (
                      <p style={{ color: '#10b981', fontSize: '12px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={12} /> Mots de passe identiques
                      </p>
                    )}
                  </div>
                </div>
                <NavButtons />
              </>
            )}

            {/* ══ Étape 4 : Confirmation ══ */}
            {step === 4 && (
              <>
                <div style={{ marginBottom: '22px' }}>
                  <h1 style={{ color: 'white', fontSize: '21px', fontWeight: 700, letterSpacing: '-0.4px', marginBottom: '5px' }}>Récapitulatif</h1>
                  <p style={{ color: '#64748b', fontSize: '13px' }}>Vérifiez vos informations avant de créer votre compte.</p>
                </div>

                {/* Photo + nom */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(15,23,42,0.6)', borderRadius: '14px', marginBottom: '16px' }}>
                  {form.photoPreview
                    ? <img src={form.photoPreview} alt="avatar" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #f59e0b', flexShrink: 0 }} />
                    : <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ color: 'white', fontWeight: 700, fontSize: '20px' }}>{form.firstName[0]?.toUpperCase()}</span>
                      </div>
                  }
                  <div>
                    <p style={{ color: 'white', fontWeight: 600, fontSize: '16px' }}>{form.firstName} {form.lastName}</p>
                    <p style={{ color: '#fbbf24', fontSize: '12px', marginTop: '2px' }}>Manager · {info?.restaurantName}</p>
                  </div>
                </div>

                {/* Détails */}
                <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(51,65,85,0.5)', borderRadius: '14px', overflow: 'hidden', marginBottom: '8px' }}>
                  {[
                    { label: 'Email', value: info?.email, color: 'white' },
                    { label: 'Téléphone', value: form.phone || '—', color: form.phone ? 'white' : '#475569' },
                    { label: 'Adresse restaurant', value: form.restaurantAddress || '—', color: form.restaurantAddress ? 'white' : '#475569' },
                    { label: 'Rôle', value: 'Manager', badge: true },
                  ].map((row, i, arr) => (
                    <div key={row.label} style={{ padding: '13px 18px', borderBottom: i < arr.length - 1 ? '1px solid rgba(51,65,85,0.4)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: '#64748b', fontSize: '13px', flexShrink: 0 }}>{row.label}</span>
                      {row.badge
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '20px', color: '#fbbf24', fontSize: '12px', fontWeight: 600 }}>Manager</span>
                        : <span style={{ color: row.color, fontSize: '13px', fontWeight: 500, textAlign: 'right', wordBreak: 'break-word' }}>{row.value}</span>
                      }
                    </div>
                  ))}
                </div>

                <NavButtons onSubmit={handleSubmit} />
              </>
            )}
          </div>

          <p style={{ textAlign: 'center', color: '#1e3a5f', fontSize: '12px' }}>
            © {new Date().getFullYear()} ShiftClose · Gestion de Cash Out
          </p>
        </div>
      </div>
    </div>
  )
}
