import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { restaurantAPI, invitationAPI } from '../services/api'
import {
  Users, UserPlus, Mail, MoreVertical, Shield, User, X, Check, Clock,
  Percent, Settings2, Trash2, Edit3, Save, Plus, Loader2,
  Wine, Coffee, UtensilsCrossed, Briefcase, AlertCircle
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

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showTipOutModal, setShowTipOutModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [openMenu, setOpenMenu] = useState(null)

  // Form states
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'server', position: 'server' })
  const [editingTipOut, setEditingTipOut] = useState(null)
  const [newTipOut, setNewTipOut] = useState({ position: '', percentage: '' })
  const [submitting, setSubmitting] = useState(false)

  // Load data
  useEffect(() => {
    if (currentRestaurant?.id) {
      loadData()
    }
  }, [currentRestaurant?.id])

  const loadData = async () => {
    setLoading(true)
    try {
      const [membersRes, invitesRes, restaurantRes] = await Promise.all([
        restaurantAPI.getTeam(currentRestaurant.id),
        invitationAPI.getPending(currentRestaurant.id),
        restaurantAPI.get(currentRestaurant.id)
      ])

      setMembers(membersRes.members || [])
      setPendingInvites(invitesRes.invitations || [])
      setTipOutRules(restaurantRes.restaurant?.tipOutRules || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Invite member
  const handleInvite = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await invitationAPI.send(currentRestaurant.id, {
        email: inviteForm.email,
        role: inviteForm.role
      })
      setShowInviteModal(false)
      setInviteForm({ email: '', role: 'server', position: 'server' })
      loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
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

  // Update Tip Out rules
  const handleSaveTipOutRules = async () => {
    setSubmitting(true)
    try {
      await restaurantAPI.update(currentRestaurant.id, { tipOutRules })
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
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
          <Shield size={12} />
          {t('roles.manager')}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
        <User size={12} />
        {t('roles.server')}
      </span>
    )
  }

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-500/10 text-green-400 border-green-500/30',
      inactive: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
      pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    }
    const icons = {
      active: <Check size={12} />,
      inactive: <X size={12} />,
      pending: <Clock size={12} />
    }
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${styles[status] || styles.active}`}>
        {icons[status] || icons.active}
        {t(`team.${status}`)}
      </span>
    )
  }

  const totalTipOutPercent = tipOutRules.reduce((sum, r) => sum + (r.percentage || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('team.title')}</h1>
          <p className="text-slate-400 mt-1">
            {members.length} {t('team.members')} • {pendingInvites.length} {t('team.pendingInvites')}
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="btn btn-primary"
        >
          <UserPlus size={20} />
          {t('team.invite')}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-4 rounded-xl flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-1 overflow-x-auto">
        {[
          { id: 'members', icon: Users, label: t('team.members') },
          { id: 'pending', icon: Clock, label: t('team.pending') },
          { id: 'tipout', icon: Percent, label: t('team.tipOutConfig') }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
            {tab.id === 'pending' && pendingInvites.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-amber-500 text-white rounded-full">
                {pendingInvites.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {members.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>{t('team.noMembers')}</p>
            </div>
          ) : (
            members.map((member) => (
              <div key={member.id} className="card-sm hover:border-slate-600 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
                      <span className="text-white font-medium">
                        {member.firstName?.[0]}{member.lastName?.[0]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-sm text-slate-400 truncate">{member.email}</p>
                    </div>
                  </div>

                  <div className="hidden sm:block">
                    {getRoleBadge(member.role)}
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(member.status)}

                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === member.id ? null : member.id)}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <MoreVertical size={18} className="text-slate-400" />
                      </button>

                      {openMenu === member.id && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-slate-700 rounded-lg shadow-xl border border-slate-600 py-2 z-10 animate-fade-in">
                          <button
                            onClick={() => {
                              setSelectedMember(member)
                              setShowRoleModal(true)
                              setOpenMenu(null)
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-600 text-white text-sm flex items-center gap-2"
                          >
                            <Edit3 size={14} />
                            {t('team.changeRole')}
                          </button>
                          <button
                            onClick={() => {
                              handleRemoveMember(member.id)
                              setOpenMenu(null)
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-600 text-red-400 text-sm flex items-center gap-2"
                          >
                            <Trash2 size={14} />
                            {t('team.removeMember')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="sm:hidden mt-4 pt-4 border-t border-slate-700">
                  {getRoleBadge(member.role)}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingInvites.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Mail size={48} className="mx-auto mb-4 opacity-50" />
              <p>{t('team.noPending')}</p>
            </div>
          ) : (
            pendingInvites.map((invite) => (
              <div key={invite.id} className="card-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center">
                      <Mail size={20} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{invite.email}</p>
                      <p className="text-sm text-slate-400">
                        {t('team.invitedBy')} {invite.invitedByName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getRoleBadge(invite.role)}
                    <button
                      onClick={() => handleCancelInvite(invite.id)}
                      className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                      title={t('common.cancel')}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'tipout' && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="card bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">{t('team.totalTipOut')}</p>
                <p className="text-3xl font-bold text-white">{totalTipOutPercent.toFixed(1)}%</p>
              </div>
              <Percent size={40} className="text-blue-400 opacity-50" />
            </div>
          </div>

          {/* Tip Out Rules */}
          <div className="space-y-4">
            {tipOutRules.map((rule, index) => {
              const IconComponent = POSITION_ICONS[rule.position.toLowerCase()] || POSITION_ICONS.default
              return (
                <div key={index} className="card-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                        <IconComponent size={20} className="text-blue-400" />
                      </div>
                      {editingTipOut === index ? (
                        <input
                          type="text"
                          value={rule.position}
                          onChange={(e) => handleUpdateTipOut(index, 'position', e.target.value)}
                          className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-white"
                        />
                      ) : (
                        <span className="text-white font-medium capitalize">{rule.position}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {editingTipOut === index ? (
                        <input
                          type="number"
                          step="0.1"
                          value={rule.percentage}
                          onChange={(e) => handleUpdateTipOut(index, 'percentage', e.target.value)}
                          className="w-20 px-3 py-1 bg-slate-700 border border-slate-600 rounded text-white text-right"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-green-400">{rule.percentage}%</span>
                      )}

                      {editingTipOut === index ? (
                        <button
                          onClick={() => setEditingTipOut(null)}
                          className="p-2 hover:bg-green-500/10 text-green-400 rounded-lg"
                        >
                          <Check size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditingTipOut(index)}
                          className="p-2 hover:bg-slate-700 text-slate-400 rounded-lg"
                        >
                          <Edit3 size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveTipOut(index)}
                        className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Add New */}
          <div className="card border-dashed border-slate-600">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder={t('team.positionName')}
                value={newTipOut.position}
                onChange={(e) => setNewTipOut({ ...newTipOut, position: e.target.value })}
                className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  placeholder="%"
                  value={newTipOut.percentage}
                  onChange={(e) => setNewTipOut({ ...newTipOut, percentage: e.target.value })}
                  className="w-24 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500"
                />
                <button
                  onClick={handleAddTipOut}
                  disabled={!newTipOut.position || !newTipOut.percentage}
                  className="btn btn-primary disabled:opacity-50"
                >
                  <Plus size={18} />
                  {t('common.add')}
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveTipOutRules}
            disabled={submitting}
            className="btn btn-primary w-full"
          >
            {submitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Save size={20} />
            )}
            {t('common.save')}
          </button>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full animate-fade-in">
            <div className="px-7 py-5 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">{t('team.inviteMember')}</h2>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-2 hover:bg-slate-700 rounded-xl transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
            </div>

            <form onSubmit={handleInvite} className="px-7 py-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="employee@example.com"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  {t('team.role')}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setInviteForm({ ...inviteForm, role: 'server' })}
                    className={`p-5 rounded-xl border-2 transition-colors ${
                      inviteForm.role === 'server'
                        ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <User size={24} className="mx-auto mb-2.5" />
                    <span className="text-sm font-medium">{t('roles.server')}</span>
                    <p className="text-xs text-slate-500 mt-1.5">{t('team.serverDesc')}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInviteForm({ ...inviteForm, role: 'manager' })}
                    className={`p-5 rounded-xl border-2 transition-colors ${
                      inviteForm.role === 'manager'
                        ? 'bg-purple-500/10 border-purple-500 text-purple-400'
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <Shield size={24} className="mx-auto mb-2.5" />
                    <span className="text-sm font-medium">{t('roles.manager')}</span>
                    <p className="text-xs text-slate-500 mt-1.5">{t('team.managerDesc')}</p>
                  </button>
                </div>
              </div>

              <div className="pt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary flex-1"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Mail size={18} />
                  )}
                  {t('team.sendInvite')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {showRoleModal && selectedMember && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-sm w-full animate-fade-in">
            <div className="px-7 py-5 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">{t('team.changeRole')}</h2>
              <p className="text-slate-400 text-sm mt-1.5">
                {selectedMember.firstName} {selectedMember.lastName}
              </p>
            </div>

            <div className="px-7 py-6 space-y-4">
              <button
                onClick={() => handleUpdateRole(selectedMember.id, 'server')}
                className={`w-full p-5 rounded-xl border-2 text-left transition-colors ${
                  selectedMember.role === 'server'
                    ? 'bg-blue-500/10 border-blue-500'
                    : 'bg-slate-700 border-slate-600 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center gap-4">
                  <User className="text-blue-400" size={20} />
                  <div>
                    <p className="text-white font-medium">{t('roles.server')}</p>
                    <p className="text-slate-400 text-sm mt-0.5">{t('team.serverDesc')}</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleUpdateRole(selectedMember.id, 'manager')}
                className={`w-full p-5 rounded-xl border-2 text-left transition-colors ${
                  selectedMember.role === 'manager'
                    ? 'bg-purple-500/10 border-purple-500'
                    : 'bg-slate-700 border-slate-600 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center gap-4">
                  <Shield className="text-purple-400" size={20} />
                  <div>
                    <p className="text-white font-medium">{t('roles.manager')}</p>
                    <p className="text-slate-400 text-sm mt-0.5">{t('team.managerDesc')}</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowRoleModal(false)
                  setSelectedMember(null)
                }}
                className="btn btn-secondary w-full mt-2"
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
