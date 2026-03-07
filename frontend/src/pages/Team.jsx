import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { restaurantAPI, invitationAPI, deletionAPI } from '../services/api'
import { Calculator } from 'lucide-react'
import {
  Users, UserPlus, Mail, MoreVertical, Shield, User, X, Check, Clock,
  Percent, Settings2, Trash2, Edit3, Save, Plus, Loader2,
  Wine, Coffee, UtensilsCrossed, Briefcase, AlertCircle, UserX,
  Link2, Copy, CheckCheck, Share2
} from 'lucide-react'

const POSITION_ICONS = {
  server: UtensilsCrossed,
  bartender: Wine,
  busboy: Coffee,
  host: Briefcase,
  default: User
}

export default function Team() {
  const { t } = useTranslation()
  const { currentRestaurant, refreshUser } = useAuth()

  // State
  const [activeTab, setActiveTab] = useState('members')
  const [members, setMembers] = useState([])
  const [pendingInvites, setPendingInvites] = useState([])
  const [tipOutRules, setTipOutRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [deletionRequests, setDeletionRequests] = useState([])
  const [showRejectModal, setShowRejectModal]   = useState(false)
  const [rejectTarget, setRejectTarget]         = useState(null)  // { requestId }
  const [rejectNote, setRejectNote]             = useState('')
  const [actionLoadingId, setActionLoadingId]   = useState(null)

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [openMenu, setOpenMenu] = useState(null)

  // Form states
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'server', position: 'server' })
  const [editingTipOut, setEditingTipOut] = useState(null)
  const [newTipOut, setNewTipOut] = useState({ position: '', percentage: '' })
  const [kitchenPoolPct, setKitchenPoolPct] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [inviteFocused, setInviteFocused] = useState(false)
  const [inviteLink, setInviteLink] = useState(null)   // lien généré après invitation
  const [linkCopied, setLinkCopied] = useState(false)  // état du bouton copier

  // Load data
  useEffect(() => {
    if (currentRestaurant?.id) {
      loadData()
    }
  }, [currentRestaurant?.id])

  const loadData = async () => {
    setLoading(true)
    try {
      const [membersRes, invitesRes, restaurantRes, deletionRes] = await Promise.all([
        restaurantAPI.getTeam(currentRestaurant.id),
        invitationAPI.getPending(currentRestaurant.id),
        restaurantAPI.get(currentRestaurant.id),
        deletionAPI.getPending(currentRestaurant.id).catch(() => ({ requests: [] }))
      ])

      setMembers(membersRes.members || [])
      setPendingInvites(invitesRes.invitations || [])
      const allRules = restaurantRes.restaurant?.tipOutRules || []
      // Séparer la règle pool cuisine des autres règles
      const poolRule = allRules.find(r => ['kitchen_pool', 'cuisine', 'pool cuisine'].includes(r.position?.toLowerCase()))
      setKitchenPoolPct(poolRule?.percentage?.toString() || '')
      setTipOutRules(allRules.filter(r => !['kitchen_pool', 'cuisine', 'pool cuisine'].includes(r.position?.toLowerCase())))
      setDeletionRequests(deletionRes.requests || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveDeletion = async (requestId) => {
    setActionLoadingId(requestId)
    try {
      await deletionAPI.approve(currentRestaurant.id, requestId)
      setDeletionRequests(prev => prev.filter(r => r.id !== requestId))
      loadData() // Rafraîchir la liste des membres
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRejectDeletion = async () => {
    if (!rejectTarget) return
    setActionLoadingId(rejectTarget.requestId)
    try {
      await deletionAPI.reject(currentRestaurant.id, rejectTarget.requestId, rejectNote)
      setDeletionRequests(prev => prev.filter(r => r.id !== rejectTarget.requestId))
      setShowRejectModal(false)
      setRejectTarget(null)
      setRejectNote('')
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  // Invite member
  const handleInvite = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await invitationAPI.send(currentRestaurant.id, {
        email: inviteForm.email,
        role: inviteForm.role
      })
      // Afficher le lien dans le modal (au lieu de fermer immédiatement)
      setInviteLink(res.inviteLink)
      setLinkCopied(false)
      loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopyLink = async () => {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 3000)
    } catch {
      // Fallback si clipboard API non disponible
      const input = document.createElement('input')
      input.value = inviteLink
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 3000)
    }
  }

  const handleShareLink = async () => {
    if (!inviteLink) return
    if (navigator.share) {
      await navigator.share({
        title: `Invitation ShiftClose — ${currentRestaurant?.name}`,
        text: `Tu es invité(e) à rejoindre ${currentRestaurant?.name} sur ShiftClose`,
        url: inviteLink
      })
    } else {
      handleCopyLink()
    }
  }

  const closeInviteModal = () => {
    setShowInviteModal(false)
    setInviteLink(null)
    setLinkCopied(false)
    setInviteForm({ email: '', role: 'server', position: 'server' })
  }

  // Cancel invitation
  const handleCancelInvite = async (inviteId) => {
    try {
      await invitationAPI.cancel(inviteId)
      loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  // Remove member
  const handleRemoveMember = async (userId) => {
    if (!confirm(t('team.confirmRemove'))) return
    try {
      await restaurantAPI.removeTeamMember(currentRestaurant.id, userId)
      loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  // Update member role
  const handleUpdateRole = async (userId, newRole) => {
    try {
      await restaurantAPI.updateTeamMemberRole(currentRestaurant.id, userId, newRole)
      setShowRoleModal(false)
      setSelectedMember(null)
      loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  // Toggle cashout permission
  const handleToggleCashout = async (member) => {
    const newValue = !(member.canDoCashout !== false)
    try {
      await restaurantAPI.updateCashoutPermission(currentRestaurant.id, member.id, newValue)
      setMembers(prev => prev.map(m =>
        m.id === member.id ? { ...m, canDoCashout: newValue } : m
      ))
    } catch (err) {
      setError(err.message)
    }
  }

  // Update Tip Out rules
  const handleSaveTipOutRules = async () => {
    setSubmitting(true)
    try {
      // Fusionner pool cuisine + règles individuelles
      const poolRules = kitchenPoolPct && parseFloat(kitchenPoolPct) > 0
        ? [{ position: 'kitchen_pool', percentage: parseFloat(kitchenPoolPct) }]
        : []
      await restaurantAPI.update(currentRestaurant.id, { tipOutRules: [...poolRules, ...tipOutRules] })
      setEditingTipOut(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddTipOut = () => {
    if (!newTipOut.position || !newTipOut.percentage) return
    setTipOutRules([...tipOutRules, {
      position: newTipOut.position,
      percentage: parseFloat(newTipOut.percentage)
    }])
    setNewTipOut({ position: '', percentage: '' })
  }

  const handleRemoveTipOut = (index) => {
    setTipOutRules(tipOutRules.filter((_, i) => i !== index))
  }

  const handleUpdateTipOut = (index, field, value) => {
    const updated = [...tipOutRules]
    updated[index][field] = field === 'percentage' ? parseFloat(value) : value
    setTipOutRules(updated)
  }

  const getRoleBadge = (role) => {
    if (role === 'manager') {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          padding: '3px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500,
          background: 'rgba(139,92,246,0.12)', color: '#a78bfa',
          border: '1px solid rgba(139,92,246,0.3)'
        }}>
          <Shield size={12} />
          {t('roles.manager')}
        </span>
      )
    }
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '3px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500,
        background: 'rgba(59,130,246,0.12)', color: '#60a5fa',
        border: '1px solid rgba(59,130,246,0.3)'
      }}>
        <User size={12} />
        {t('roles.server')}
      </span>
    )
  }

  const getStatusBadge = (status) => {
    const colors = {
      active:   { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.3)' },
      inactive: { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
      pending:  { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' }
    }
    const c = colors[status] || colors.active
    const icons = { active: <Check size={12} />, inactive: <X size={12} />, pending: <Clock size={12} /> }
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '3px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500,
        background: c.bg, color: c.color, border: `1px solid ${c.border}`
      }}>
        {icons[status] || icons.active}
        {t(`team.${status}`)}
      </span>
    )
  }

  const totalTipOutPercent = (parseFloat(kitchenPoolPct) || 0) + tipOutRules.reduce((sum, r) => sum + (r.percentage || 0), 0)

  // Overlay modal style
  const modalOverlay = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 50, padding: '16px'
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
        <Loader2 style={{ width: 32, height: 32, color: '#3b82f6' }} className="animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            {t('team.title')}
          </h1>
          <p style={{ color: '#94a3b8', marginTop: '4px', fontSize: '14px' }}>
            {members.length} {t('team.members')} • {pendingInvites.length} {t('team.pendingInvites')}
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '10px 18px', borderRadius: '12px', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: '#fff', fontWeight: 600, fontSize: '14px',
            boxShadow: '0 4px 14px rgba(59,130,246,0.3)'
          }}
        >
          <UserPlus size={18} />
          {t('team.invite')}
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)',
          color: '#f87171', padding: '12px 16px', borderRadius: '12px'
        }}>
          <AlertCircle size={18} />
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171' }}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="team-tabs">
        {[
          { id: 'members', icon: Users, label: t('team.members') },
          { id: 'pending', icon: Clock, label: t('team.pending') },
          { id: 'tipout', icon: Percent, label: t('team.tipOutConfig') },
          { id: 'deletions', icon: UserX, label: 'Suppressions', count: deletionRequests.length }
        ].map(tab => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '9px 14px', borderRadius: '10px 10px 0 0',
                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '14px',
                fontWeight: active ? 600 : 400,
                background: active ? 'rgba(59,130,246,0.12)' : 'transparent',
                color: active ? '#60a5fa' : '#94a3b8',
                borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <tab.icon size={16} />
              {tab.label}
              {tab.id === 'pending' && pendingInvites.length > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: '18px', height: '18px', padding: '0 5px',
                  background: '#f59e0b', color: '#fff', borderRadius: '9999px', fontSize: '11px', fontWeight: 700
                }}>
                  {pendingInvites.length}
                </span>
              )}
              {tab.id === 'deletions' && deletionRequests.length > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: '18px', height: '18px', padding: '0 5px',
                  background: '#ef4444', color: '#fff', borderRadius: '9999px', fontSize: '11px', fontWeight: 700
                }}>
                  {deletionRequests.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Membres ── */}
      {activeTab === 'members' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {members.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
              <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.4, display: 'block' }} />
              <p>{t('team.noMembers')}</p>
            </div>
          ) : (
            members.map((member) => (
              <div key={member.id} className="card-sm" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>

                  {/* Avatar + info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>
                        {member.firstName?.[0]}{member.lastName?.[0]}
                      </span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ color: '#f8fafc', fontWeight: 500, fontSize: '14px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {member.firstName} {member.lastName}
                      </p>
                      <p style={{ color: '#64748b', fontSize: '12px', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {member.email}
                      </p>
                    </div>
                  </div>

                  {/* Role badge — desktop only */}
                  <div className="member-badge-desktop">
                    {getRoleBadge(member.role)}
                  </div>

                  {/* Status + menu */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {getStatusBadge(member.status)}

                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setOpenMenu(openMenu === member.id ? null : member.id)}
                        style={{
                          padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                          background: 'transparent', color: '#64748b',
                          transition: 'background 0.2s'
                        }}
                      >
                        <MoreVertical size={18} />
                      </button>

                      {openMenu === member.id && (
                        <div style={{
                          position: 'absolute', right: 0, top: '100%', marginTop: '6px',
                          width: '180px', background: '#334155', borderRadius: '10px',
                          border: '1px solid #475569', padding: '6px 0', zIndex: 10
                        }} className="animate-fade-in">
                          <button
                            onClick={() => {
                              setSelectedMember(member)
                              setShowRoleModal(true)
                              setOpenMenu(null)
                            }}
                            style={{
                              width: '100%', textAlign: 'left', padding: '8px 14px',
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#f8fafc', fontSize: '13px',
                              display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                          >
                            <Edit3 size={14} />
                            {t('team.changeRole')}
                          </button>
                          {member.role !== 'manager' && (
                            <button
                              onClick={() => {
                                handleToggleCashout(member)
                                setOpenMenu(null)
                              }}
                              style={{
                                width: '100%', textAlign: 'left', padding: '8px 14px',
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: member.canDoCashout !== false ? '#34d399' : '#94a3b8',
                                fontSize: '13px',
                                display: 'flex', alignItems: 'center', gap: '8px'
                              }}
                            >
                              <Calculator size={14} />
                              {member.canDoCashout !== false ? 'Retirer Cash Out' : 'Autoriser Cash Out'}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              handleRemoveMember(member.id)
                              setOpenMenu(null)
                            }}
                            style={{
                              width: '100%', textAlign: 'left', padding: '8px 14px',
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#f87171', fontSize: '13px',
                              display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                          >
                            <Trash2 size={14} />
                            {t('team.removeMember')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ligne inférieure mobile : rôle + toggle cashout */}
                <div className="member-badge-mobile" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  {getRoleBadge(member.role)}
                  {member.role !== 'manager' && (
                    <button
                      onClick={() => handleToggleCashout(member)}
                      title={member.canDoCashout !== false ? 'Retirer la permission Cash Out' : 'Autoriser Cash Out'}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500,
                        border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                        backgroundColor: member.canDoCashout !== false
                          ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)',
                        color: member.canDoCashout !== false ? '#34d399' : '#64748b'
                      }}
                    >
                      <Calculator size={11} />
                      {member.canDoCashout !== false ? 'Cash Out ✓' : 'Cash Out ✗'}
                    </button>
                  )}
                </div>

                {/* Toggle cashout — desktop (dans le menu contextuel) */}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── En attente ── */}
      {activeTab === 'pending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pendingInvites.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
              <Mail size={48} style={{ margin: '0 auto 16px', opacity: 0.4, display: 'block' }} />
              <p>{t('team.noPending')}</p>
            </div>
          ) : (
            pendingInvites.map((invite) => (
              <div key={invite.id} className="card-sm">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                      background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Mail size={18} style={{ color: '#64748b' }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ color: '#f8fafc', fontWeight: 500, fontSize: '14px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {invite.email}
                      </p>
                      <p style={{ color: '#64748b', fontSize: '12px', margin: '2px 0 0' }}>
                        {t('team.invitedBy')} {invite.invitedByName}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {getRoleBadge(invite.role)}
                    <button
                      onClick={() => handleCancelInvite(invite.id)}
                      style={{
                        padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        background: 'rgba(239,68,68,0.08)', color: '#f87171'
                      }}
                      title={t('common.cancel')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Configuration Tip Out ── */}
      {activeTab === 'tipout' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Résumé total */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.12) 100%)',
            border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: '16px', padding: '20px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 6px' }}>
                {t('team.totalTipOut')}
              </p>
              <p style={{ color: '#f8fafc', fontSize: '32px', fontWeight: 700, margin: 0, lineHeight: 1 }}>
                {totalTipOutPercent.toFixed(1)}%
              </p>
            </div>
            <Percent size={40} style={{ color: '#60a5fa', opacity: 0.5 }} />
          </div>

          {/* ── Pool Cuisine (dédiée) ── */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(217,119,6,0.08) 100%)',
            border: '1px solid rgba(245,158,11,0.35)',
            borderRadius: '16px', padding: '18px 20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: 'rgba(245,158,11,0.2)',
                  border: '1px solid rgba(245,158,11,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <UtensilsCrossed size={22} color="#f59e0b" />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: '#fbbf24', fontSize: 15 }}>Pool Cuisine</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(251,191,36,0.6)' }}>
                    Automatique · aucune sélection de personne
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="0.0"
                  value={kitchenPoolPct}
                  onChange={e => setKitchenPoolPct(e.target.value)}
                  style={{
                    width: 76, padding: '8px 12px', background: '#0f172a',
                    border: '1px solid rgba(245,158,11,0.4)', borderRadius: 10,
                    color: '#fbbf24', fontSize: 16, fontWeight: 700,
                    textAlign: 'center', outline: 'none'
                  }}
                />
                <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: 18 }}>%</span>
              </div>
            </div>
            <p style={{ margin: '12px 0 0', fontSize: 12, color: 'rgba(245,158,11,0.5)', paddingTop: 10, borderTop: '1px solid rgba(245,158,11,0.2)' }}>
              Le montant sera calculé automatiquement lors du Cash Out (% des ventes totales) et affiché séparément.
              {!kitchenPoolPct || parseFloat(kitchenPoolPct) === 0 ? ' Entrez un % pour activer.' : ''}
            </p>
          </div>

          {/* Bouton sauvegarder */}
          <button
            onClick={handleSaveTipOutRules}
            disabled={submitting}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              width: '100%', padding: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: submitting ? '#334155' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff', fontWeight: 600, fontSize: '15px',
              boxShadow: submitting ? 'none' : '0 4px 14px rgba(16,185,129,0.3)',
              transition: 'all 0.2s'
            }}
          >
            {submitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {t('common.save')}
          </button>
        </div>
      )}

      {/* ── Demandes de suppression ── */}
      {activeTab === 'deletions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {deletionRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
              <UserX size={48} style={{ margin: '0 auto 16px', opacity: 0.4, display: 'block' }} />
              <p style={{ margin: 0 }}>Aucune demande de suppression en attente</p>
            </div>
          ) : (
            deletionRequests.map(req => {
              const isActing = actionLoadingId === req.id
              const requestDate = new Date(req.requestedAt).toLocaleDateString('fr-CA', {
                day: 'numeric', month: 'long', year: 'numeric'
              })
              return (
                <div key={req.id} style={{
                  background: 'linear-gradient(145deg, #1e293b 0%, #1a2332 100%)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '16px', padding: '18px 20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    {/* Avatar */}
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>
                        {req.firstName?.[0]}{req.lastName?.[0]}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#f8fafc', fontWeight: 600, fontSize: '15px', margin: 0 }}>
                        {req.firstName} {req.lastName}
                      </p>
                      <p style={{ color: '#64748b', fontSize: '12px', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {req.email}
                      </p>
                    </div>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                      backgroundColor: 'rgba(245,158,11,0.12)', color: '#fbbf24',
                      border: '1px solid rgba(245,158,11,0.3)', flexShrink: 0
                    }}>
                      <Clock size={11} style={{ display: 'inline', marginRight: 4 }} />
                      En attente
                    </span>
                  </div>

                  <p style={{ color: '#475569', fontSize: '12px', margin: '0 0 16px' }}>
                    Demande soumise le {requestDate}
                  </p>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => {
                        setRejectTarget({ requestId: req.id })
                        setShowRejectModal(true)
                      }}
                      disabled={isActing}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        padding: '10px', borderRadius: '10px', border: '1px solid #334155',
                        backgroundColor: 'transparent', color: '#94a3b8',
                        fontSize: '13px', fontWeight: 500, cursor: 'pointer'
                      }}
                    >
                      <X size={15} />
                      Refuser
                    </button>
                    <button
                      onClick={() => handleApproveDeletion(req.id)}
                      disabled={isActing}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        padding: '10px', borderRadius: '10px', border: 'none',
                        backgroundColor: '#ef4444', color: 'white',
                        fontSize: '13px', fontWeight: 600, cursor: isActing ? 'not-allowed' : 'pointer',
                        opacity: isActing ? 0.7 : 1
                      }}
                    >
                      {isActing
                        ? <Loader2 size={15} className="animate-spin" />
                        : <Trash2 size={15} />}
                      Approuver la suppression
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── Modal rejet avec note ── */}
      {showRejectModal && rejectTarget && (
        <div style={modalOverlay} onClick={(e) => e.target === e.currentTarget && setShowRejectModal(false)}>
          <div style={{
            background: 'rgba(15,23,42,0.97)', border: '1px solid #334155',
            borderRadius: '20px', maxWidth: '400px', width: '100%',
            backdropFilter: 'blur(20px)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
          }} className="animate-fade-in">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e293b' }}>
              <h2 style={{ color: '#f8fafc', fontWeight: 700, fontSize: '17px', margin: 0 }}>
                Refuser la demande
              </h2>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                  Note pour l'employé (optionnel)
                </label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Ex: Veuillez contacter les RH avant..."
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 14px', background: '#0f172a',
                    border: '1px solid #334155', borderRadius: '10px',
                    color: '#f8fafc', fontSize: '14px', outline: 'none',
                    resize: 'vertical', boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => { setShowRejectModal(false); setRejectNote('') }}
                  style={{
                    flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #334155',
                    background: 'transparent', color: '#94a3b8', fontWeight: 600, fontSize: '14px', cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleRejectDeletion}
                  disabled={!!actionLoadingId}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    background: '#334155', color: '#94a3b8', fontWeight: 600, fontSize: '14px'
                  }}
                >
                  {actionLoadingId ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                  Refuser
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Invitation ── */}
      {showInviteModal && (
        <div style={modalOverlay} onClick={(e) => e.target === e.currentTarget && closeInviteModal()}>
          <div style={{
            background: 'rgba(15,23,42,0.97)', border: '1px solid #334155',
            borderRadius: '20px', maxWidth: '440px', width: '100%',
            backdropFilter: 'blur(20px)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
          }} className="animate-fade-in">

            {/* En-tête */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px', borderBottom: '1px solid #1e293b'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '10px', flexShrink: 0,
                  background: inviteLink ? 'rgba(52,211,153,0.15)' : 'rgba(59,130,246,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {inviteLink
                    ? <Link2 size={20} style={{ color: '#34d399' }} />
                    : <UserPlus size={20} style={{ color: '#60a5fa' }} />
                  }
                </div>
                <h2 style={{ color: '#f8fafc', fontWeight: 700, fontSize: '17px', margin: 0 }}>
                  {inviteLink ? 'Lien d\'invitation' : t('team.inviteMember')}
                </h2>
              </div>
              <button
                onClick={closeInviteModal}
                style={{
                  padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: 'transparent', color: '#64748b'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* ── État 1 : Formulaire ── */}
            {!inviteLink && (
              <form onSubmit={handleInvite} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                    {t('auth.email')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{
                      position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                      color: inviteFocused ? '#60a5fa' : '#475569', pointerEvents: 'none'
                    }} />
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      onFocus={() => setInviteFocused(true)}
                      onBlur={() => setInviteFocused(false)}
                      placeholder="employe@restaurant.com"
                      required
                      style={{
                        width: '100%', padding: '11px 14px 11px 40px',
                        background: '#0f172a', borderRadius: '10px', color: '#f8fafc', fontSize: '14px',
                        border: inviteFocused ? '1px solid #3b82f6' : '1px solid #334155',
                        boxShadow: inviteFocused ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
                        outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Rôle */}
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                    {t('team.role')}
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[
                      { value: 'server', icon: User, label: t('roles.server'), desc: t('team.serverDesc'), color: '#60a5fa', bg: 'rgba(59,130,246,0.12)', border: '#3b82f6' },
                      { value: 'manager', icon: Shield, label: t('roles.manager'), desc: t('team.managerDesc'), color: '#a78bfa', bg: 'rgba(139,92,246,0.12)', border: '#8b5cf6' }
                    ].map(opt => {
                      const active = inviteForm.role === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setInviteForm({ ...inviteForm, role: opt.value })}
                          style={{
                            padding: '16px 12px', borderRadius: '12px', cursor: 'pointer',
                            background: active ? opt.bg : 'rgba(30,41,59,0.6)',
                            border: active ? `2px solid ${opt.border}` : '2px solid #1e293b',
                            textAlign: 'center', transition: 'all 0.2s'
                          }}
                        >
                          <opt.icon size={22} style={{ color: active ? opt.color : '#475569', margin: '0 auto 8px' }} />
                          <p style={{ color: active ? opt.color : '#94a3b8', fontWeight: 600, fontSize: '13px', margin: '0 0 4px' }}>
                            {opt.label}
                          </p>
                          <p style={{ color: '#475569', fontSize: '11px', margin: 0, lineHeight: 1.4 }}>
                            {opt.desc}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Boutons */}
                <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                  <button
                    type="button"
                    onClick={closeInviteModal}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #334155',
                      background: 'transparent', color: '#94a3b8', fontWeight: 600, fontSize: '14px', cursor: 'pointer'
                    }}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: '#fff', fontWeight: 600, fontSize: '14px',
                      boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
                      opacity: submitting ? 0.7 : 1
                    }}
                  >
                    {submitting ? <Loader2 className="animate-spin" size={16} /> : <Link2 size={16} />}
                    Générer le lien
                  </button>
                </div>
              </form>
            )}

            {/* ── État 2 : Lien généré ── */}
            {inviteLink && (
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Confirmation */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)',
                  borderRadius: '12px', padding: '12px 16px'
                }}>
                  <Check size={18} style={{ color: '#34d399', flexShrink: 0 }} />
                  <div>
                    <p style={{ color: '#34d399', fontWeight: 600, fontSize: '14px', margin: 0 }}>
                      Invitation créée pour {inviteForm.email}
                    </p>
                    <p style={{ color: 'rgba(52,211,153,0.7)', fontSize: '12px', margin: '2px 0 0' }}>
                      Un email a également été envoyé si la livraison est disponible
                    </p>
                  </div>
                </div>

                {/* Lien */}
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                    Lien d'invitation (valide 7 jours)
                  </label>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0',
                    background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', overflow: 'hidden'
                  }}>
                    <div style={{
                      flex: 1, padding: '11px 14px',
                      fontSize: '12px', color: '#64748b',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      fontFamily: 'monospace'
                    }}>
                      {inviteLink}
                    </div>
                    <button
                      onClick={handleCopyLink}
                      style={{
                        padding: '11px 16px', border: 'none', cursor: 'pointer', flexShrink: 0,
                        background: linkCopied ? 'rgba(52,211,153,0.15)' : 'rgba(59,130,246,0.12)',
                        color: linkCopied ? '#34d399' : '#60a5fa',
                        borderLeft: '1px solid #334155',
                        transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '13px', fontWeight: 600
                      }}
                    >
                      {linkCopied ? <CheckCheck size={16} /> : <Copy size={16} />}
                      {linkCopied ? 'Copié !' : 'Copier'}
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px', padding: '14px 16px'
                }}>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px', fontWeight: 600 }}>
                    Comment partager ?
                  </p>
                  <ul style={{ color: '#64748b', fontSize: '12px', margin: 0, paddingLeft: '16px', lineHeight: 1.8 }}>
                    <li>Copiez le lien ci-dessus</li>
                    <li>Envoyez-le par WhatsApp, SMS ou email</li>
                    <li>L'employé clique sur le lien et crée son compte</li>
                  </ul>
                </div>

                {/* Boutons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleShareLink}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      padding: '12px', borderRadius: '10px', border: '1px solid #334155',
                      background: 'rgba(255,255,255,0.04)', color: '#94a3b8',
                      fontWeight: 600, fontSize: '14px', cursor: 'pointer'
                    }}
                  >
                    <Share2 size={16} />
                    Partager
                  </button>
                  <button
                    onClick={closeInviteModal}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: '#fff', fontWeight: 600, fontSize: '14px'
                    }}
                  >
                    <Check size={16} />
                    Terminé
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal Changement de rôle ── */}
      {showRoleModal && selectedMember && (
        <div style={modalOverlay} onClick={(e) => e.target === e.currentTarget && (setShowRoleModal(false), setSelectedMember(null))}>
          <div style={{
            background: 'rgba(15,23,42,0.97)', border: '1px solid #334155',
            borderRadius: '20px', maxWidth: '380px', width: '100%',
            backdropFilter: 'blur(20px)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
          }} className="animate-fade-in">

            <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e293b' }}>
              <h2 style={{ color: '#f8fafc', fontWeight: 700, fontSize: '17px', margin: '0 0 4px' }}>
                {t('team.changeRole')}
              </h2>
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                {selectedMember.firstName} {selectedMember.lastName}
              </p>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { value: 'server', icon: User, label: t('roles.server'), desc: t('team.serverDesc'), color: '#60a5fa', bg: 'rgba(59,130,246,0.1)', border: '#3b82f6' },
                { value: 'manager', icon: Shield, label: t('roles.manager'), desc: t('team.managerDesc'), color: '#a78bfa', bg: 'rgba(139,92,246,0.1)', border: '#8b5cf6' }
              ].map(opt => {
                const active = selectedMember.role === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleUpdateRole(selectedMember.id, opt.value)}
                    style={{
                      width: '100%', padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
                      background: active ? opt.bg : 'rgba(30,41,59,0.6)',
                      border: active ? `2px solid ${opt.border}` : '2px solid #1e293b',
                      textAlign: 'left', transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', gap: '14px'
                    }}
                  >
                    <opt.icon size={20} style={{ color: active ? opt.color : '#475569', flexShrink: 0 }} />
                    <div>
                      <p style={{ color: active ? opt.color : '#94a3b8', fontWeight: 600, fontSize: '14px', margin: '0 0 2px' }}>
                        {opt.label}
                      </p>
                      <p style={{ color: '#475569', fontSize: '12px', margin: 0 }}>
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                )
              })}

              <button
                onClick={() => { setShowRoleModal(false); setSelectedMember(null) }}
                style={{
                  width: '100%', padding: '12px', borderRadius: '10px',
                  border: '1px solid #334155', background: 'transparent',
                  color: '#94a3b8', fontWeight: 600, fontSize: '14px', cursor: 'pointer', marginTop: '4px'
                }}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
