import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { reportAPI } from '../services/api'
import {
  FileText,
  Check,
  X,
  Clock,
  ChevronDown,
  Download,
  Eye,
  Loader,
  AlertCircle
} from 'lucide-react'

export default function Reports() {
  const { t } = useTranslation()
  const { isManager, currentRestaurant } = useAuth()
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedReport, setSelectedReport] = useState(null)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentRestaurant?.id) return
    fetchReports()
  }, [currentRestaurant?.id, filterStatus])

  const fetchReports = async () => {
    setLoading(true)
    setError('')
    try {
      const filters = filterStatus !== 'all' ? { status: filterStatus } : {}
      const res = await reportAPI.getAll(currentRestaurant.id, filters)
      if (res.success) setReports(res.reports)
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement.')
    } finally {
      setLoading(false)
    }
  }

  const filteredReports = reports

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      validated: 'bg-green-500/10 text-green-400 border-green-500/30',
      rejected: 'bg-red-500/10 text-red-400 border-red-500/30'
    }
    const icons = {
      pending: <Clock size={14} />,
      validated: <Check size={14} />,
      rejected: <X size={14} />
    }
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${styles[status]}`}>
        {icons[status]}
        {t(`reports.${status}`)}
      </span>
    )
  }

  const handleValidate = async (reportId) => {
    setActionLoading(reportId)
    try {
      await reportAPI.validate(reportId, 'validated')
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'validated' } : r))
      if (selectedReport?.id === reportId) setSelectedReport(null)
    } catch (err) {
      setError(err.message || 'Erreur lors de la validation.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (reportId) => {
    setActionLoading(reportId)
    try {
      await reportAPI.validate(reportId, 'rejected')
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'rejected' } : r))
      if (selectedReport?.id === reportId) setSelectedReport(null)
    } catch (err) {
      setError(err.message || 'Erreur lors du rejet.')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">{t('reports.title')}</h1>
          <p className="text-slate-400 text-sm">Historique et validation des rapports de service</p>
        </div>

        <div className="flex gap-2">
          {/* Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 pr-10 text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">{t('common.all')}</option>
              <option value="pending">{t('reports.pending')}</option>
              <option value="validated">{t('reports.validated')}</option>
              <option value="rejected">{t('reports.rejected')}</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Export */}
          <button className="btn btn-secondary text-sm py-2">
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Reports List */}
      {loading ? (
        <div className="card text-center py-12">
          <Loader size={36} className="mx-auto text-slate-500 mb-3 animate-spin" />
          <p className="text-slate-400">Chargement des rapports...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="card text-center py-12">
          <FileText size={48} className="mx-auto text-slate-500 mb-4" />
          <p className="text-slate-400">{t('reports.noReports')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredReports.map((report) => {
            const empName = report.employeeName || '?'
            const initials = empName.split(' ').map(n => n[0]).join('').slice(0, 2)
            const date = new Date(report.createdAt).toLocaleDateString('fr-CA')
            const time = new Date(report.createdAt).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })
            const isActing = actionLoading === report.id
            return (
              <div key={report.id} className="card-sm hover:border-slate-500 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  {/* Left: Employee & Date */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center shrink-0 border border-slate-500/40">
                      <span className="text-white font-semibold text-sm">{initials}</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold mb-1">{empName}</p>
                      <p className="text-sm text-slate-400">{date} à {time}</p>
                    </div>
                  </div>

                  {/* Center: Stats */}
                  <div className="flex flex-wrap gap-6 sm:gap-8">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t('cashOut.totalSales')}</p>
                      <p className="text-white font-semibold">${report.totalSales.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t('cashOut.netTips')}</p>
                      <p className="text-green-400 font-semibold">${report.netTips.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t('cashOut.difference')}</p>
                      <p className={`font-semibold ${
                        report.difference === 0 ? 'text-green-400' :
                        report.difference > 0 ? 'text-blue-400' : 'text-red-400'
                      }`}>
                        {report.difference === 0 ? '✓ Équilibré' :
                         report.difference > 0 ? `+$${report.difference.toFixed(2)}` :
                         `-$${Math.abs(report.difference).toFixed(2)}`}
                      </p>
                    </div>
                  </div>

                  {/* Right: Status & Actions */}
                  <div className="flex items-center gap-3">
                    {getStatusBadge(report.status)}

                    {isManager && report.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleValidate(report.id)}
                          disabled={isActing}
                          className="p-2.5 bg-green-500/10 text-green-400 rounded-xl hover:bg-green-500/20 transition-colors border border-green-500/20"
                          title={t('reports.validate')}
                        >
                          {isActing ? <Loader size={16} className="animate-spin" /> : <Check size={16} />}
                        </button>
                        <button
                          onClick={() => handleReject(report.id)}
                          disabled={isActing}
                          className="p-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors border border-red-500/20"
                          title={t('reports.reject')}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedReport(report)}
                      className="p-2.5 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 hover:text-white transition-colors"
                      title={t('reports.details')}
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-fade-in shadow-2xl">
            {/* Modal Header */}
            <div className="px-7 py-5 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">{t('reports.details')}</h2>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Employee Info */}
            <div className="px-7 py-6 border-b border-slate-700/60">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center border border-slate-500/40 shrink-0">
                  <span className="text-white font-bold text-xl">
                    {(selectedReport.employeeName || '?').split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="text-white font-bold text-lg mb-1">{selectedReport.employeeName}</p>
                  <p className="text-slate-400 text-sm">
                    {new Date(selectedReport.createdAt).toLocaleDateString('fr-CA')} à {new Date(selectedReport.createdAt).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <div className="mt-2">{getStatusBadge(selectedReport.status)}</div>
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="px-7 py-6">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">{t('cashOut.totalSales')}</span>
                  <span className="text-white font-semibold">${selectedReport.totalSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">{t('cashOut.totalTips')}</span>
                  <span className="text-white font-semibold">${selectedReport.totalTips.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">{t('cashOut.tipOutAmount')}</span>
                  <span className="text-amber-400 font-semibold">-${selectedReport.tipOutAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-3 mt-1 px-4 bg-slate-700/40 rounded-xl border border-slate-600/40">
                  <span className="text-white font-bold">{t('cashOut.netTips')}</span>
                  <span className="text-green-400 font-bold text-xl">${selectedReport.netTips.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">{t('cashOut.difference')}</span>
                  <span className={`font-bold ${
                    selectedReport.difference === 0 ? 'text-green-400' :
                    selectedReport.difference > 0 ? 'text-blue-400' : 'text-red-400'
                  }`}>
                    {selectedReport.difference === 0 ? t('cashOut.balanced') :
                     selectedReport.difference > 0 ? `+$${selectedReport.difference.toFixed(2)}` :
                     `-$${Math.abs(selectedReport.difference).toFixed(2)}`}
                  </span>
                </div>
                {selectedReport.validatedByName && (
                  <div className="flex justify-between items-center py-1 pt-4 border-t border-slate-700/60">
                    <span className="text-slate-400 text-sm">Validé par</span>
                    <span className="text-slate-300 text-sm font-medium">{selectedReport.validatedByName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {isManager && selectedReport.status === 'pending' && (
              <div className="px-7 pb-7 flex gap-3">
                <button
                  onClick={() => handleReject(selectedReport.id)}
                  disabled={actionLoading === selectedReport.id}
                  className="btn btn-secondary flex-1 text-red-400"
                >
                  <X size={18} />
                  {t('reports.reject')}
                </button>
                <button
                  onClick={() => handleValidate(selectedReport.id)}
                  disabled={actionLoading === selectedReport.id}
                  className="btn btn-success flex-1"
                >
                  {actionLoading === selectedReport.id
                    ? <Loader size={18} className="animate-spin" />
                    : <Check size={18} />}
                  {t('reports.validate')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
