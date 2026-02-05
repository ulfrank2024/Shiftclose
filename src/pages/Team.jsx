import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users,
  UserPlus,
  Mail,
  MoreVertical,
  Shield,
  User,
  X,
  Check,
  Clock
} from 'lucide-react'

export default function Team() {
  const { t } = useTranslation()
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('server')
  const [openMenu, setOpenMenu] = useState(null)

  // Mock data
  const members = [
    { id: 1, name: 'Marie Lambert', email: 'marie@example.com', role: 'manager', status: 'active' },
    { id: 2, name: 'Jean Dupont', email: 'jean@example.com', role: 'server', status: 'active' },
    { id: 3, name: 'Sophie Martin', email: 'sophie@example.com', role: 'server', status: 'active' },
    { id: 4, name: 'Pierre Tremblay', email: 'pierre@example.com', role: 'server', status: 'inactive' },
    { id: 5, name: 'invitation@pending.com', email: 'invitation@pending.com', role: 'server', status: 'pending' }
  ]

  const getRoleBadge = (role) => {
    if (role === 'manager') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
          <Shield size={12} />
          {t('team.manager')}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
        <User size={12} />
        {t('team.server')}
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
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${styles[status]}`}>
        {icons[status]}
        {t(`team.${status}`)}
      </span>
    )
  }

  const handleInvite = (e) => {
    e.preventDefault()
    console.log('Inviting:', { email: inviteEmail, role: inviteRole })
    // TODO: Send invitation via Firebase/Nodemailer
    setShowInviteModal(false)
    setInviteEmail('')
    setInviteRole('server')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('team.title')}</h1>
          <p className="text-slate-400 mt-1">{members.length} {t('team.members')}</p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="btn btn-primary"
        >
          <UserPlus size={20} />
          {t('team.invite')}
        </button>
      </div>

      {/* Members List */}
      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="card hover:border-slate-500 transition-colors"
          >
            <div className="flex items-center justify-between gap-4">
              {/* Left: Avatar & Info */}
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                  member.status === 'pending' ? 'bg-slate-600' : 'bg-blue-500'
                }`}>
                  {member.status === 'pending' ? (
                    <Mail size={20} className="text-slate-400" />
                  ) : (
                    <span className="text-white font-medium">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">
                    {member.status === 'pending' ? t('team.pending') : member.name}
                  </p>
                  <p className="text-sm text-slate-400 truncate">{member.email}</p>
                </div>
              </div>

              {/* Center: Role */}
              <div className="hidden sm:block">
                {getRoleBadge(member.role)}
              </div>

              {/* Right: Status & Actions */}
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
                          console.log('Change role:', member.id)
                          setOpenMenu(null)
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-600 text-white text-sm"
                      >
                        {t('team.changeRole')}
                      </button>
                      <button
                        onClick={() => {
                          console.log('Remove member:', member.id)
                          setOpenMenu(null)
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-600 text-red-400 text-sm"
                      >
                        {t('team.removeMember')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile: Show role */}
            <div className="sm:hidden mt-3 pt-3 border-t border-slate-700">
              {getRoleBadge(member.role)}
            </div>
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-md w-full animate-fade-in">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">{t('team.invite')}</h2>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
            </div>

            <form onSubmit={handleInvite} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t('team.inviteEmail')}
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t('team.role')}
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setInviteRole('server')}
                    className={`flex-1 p-3 rounded-lg border transition-colors ${
                      inviteRole === 'server'
                        ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <User size={20} className="mx-auto mb-1" />
                    <span className="text-sm">{t('team.server')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInviteRole('manager')}
                    className={`flex-1 p-3 rounded-lg border transition-colors ${
                      inviteRole === 'manager'
                        ? 'bg-purple-500/10 border-purple-500 text-purple-400'
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <Shield size={20} className="mx-auto mb-1" />
                    <span className="text-sm">{t('team.manager')}</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                >
                  <Mail size={18} />
                  {t('team.sendInvite')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
