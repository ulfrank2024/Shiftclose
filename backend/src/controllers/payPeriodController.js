import { supabase } from '../config/supabase.js'

// ─────────────────────────────────────────────────────────────
// Helper : Calcule les bornes de la période courante
// ─────────────────────────────────────────────────────────────
function computePeriodBounds(frequency, startDay, referenceDate, today = new Date()) {
  // today = date locale (sans heure)
  const todayStr = today.toISOString().split('T')[0]
  const todayMs  = new Date(todayStr).getTime()

  if (frequency === 'weekly') {
    // startDay : 0=Dim, 1=Lun, …, 6=Sam
    const dayOfWeek = today.getDay() // 0=Dim
    let diff = (dayOfWeek - startDay + 7) % 7
    const start = new Date(todayMs - diff * 86400000)
    const end   = new Date(start.getTime() + 6 * 86400000)
    return {
      start_date: start.toISOString().split('T')[0],
      end_date:   end.toISOString().split('T')[0]
    }
  }

  // biweekly : cycles de 14 jours depuis referenceDate
  const ref = referenceDate
    ? new Date(referenceDate).getTime()
    : new Date(todayStr).getTime()

  const daysSinceRef = Math.floor((todayMs - ref) / 86400000)
  const cycleOffset  = ((daysSinceRef % 14) + 14) % 14
  const start = new Date(todayMs - cycleOffset * 86400000)
  const end   = new Date(start.getTime() + 13 * 86400000)
  return {
    start_date: start.toISOString().split('T')[0],
    end_date:   end.toISOString().split('T')[0]
  }
}

// ─────────────────────────────────────────────────────────────
// Internal : Récupère la période active du restaurant (sans auto-création)
// Retourne { id, start_date, end_date, status } ou null
// ─────────────────────────────────────────────────────────────
export async function getOrCreateCurrentPeriod(restaurantId) {
  const todayStr = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('pay_periods')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('status', 'active')
    .lte('start_date', todayStr)
    .gte('end_date', todayStr)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data || null
}

// ─────────────────────────────────────────────────────────────
// GET /pay-periods/:restaurantId/current
// Retourne la période active ou null
// ─────────────────────────────────────────────────────────────
export const getCurrentPeriod = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const period = await getOrCreateCurrentPeriod(restaurantId)

    if (!period) {
      return res.json({ success: true, period: null, stats: null })
    }

    // Stats rapides de la période
    const { data: reports } = await supabase
      .from('reports')
      .select('total_sales, tip_out_amount, employee_id, status')
      .eq('restaurant_id', restaurantId)
      .eq('pay_period_id', period.id)

    const userId = req.user.id
    let periodStats = { totalSales: 0, totalTipOut: 0, myTipOut: 0, myReportCount: 0 }
    for (const r of reports || []) {
      periodStats.totalSales  += parseFloat(r.total_sales)    || 0
      periodStats.totalTipOut += parseFloat(r.tip_out_amount) || 0
      if (r.employee_id === userId) {
        periodStats.myTipOut      += parseFloat(r.tip_out_amount) || 0
        periodStats.myReportCount += 1
      }
    }

    // Tips reçus dans la période pour cet utilisateur
    const { data: received } = await supabase
      .from('tip_distributions')
      .select('amount')
      .eq('restaurant_id', restaurantId)
      .eq('to_employee_id', userId)
      .eq('pay_period_id', period.id)
      .eq('is_meal_deduction', false)

    periodStats.myTipsReceived = (received || []).reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)

    res.json({
      success: true,
      period: formatPeriod(period),
      stats:  periodStats
    })
  } catch (error) {
    console.error('getCurrentPeriod error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// ─────────────────────────────────────────────────────────────
// GET /pay-periods/:restaurantId
// Liste toutes les périodes du restaurant (paginé)
// ─────────────────────────────────────────────────────────────
export const listPeriods = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const { page = 1, limit = 20 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)

    const { data: periods, error, count } = await supabase
      .from('pay_periods')
      .select('*', { count: 'exact' })
      .eq('restaurant_id', restaurantId)
      .order('start_date', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1)

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la récupération' })
    }

    res.json({
      success: true,
      periods: (periods || []).map(formatPeriod),
      total:   count || 0,
      page:    parseInt(page),
      limit:   parseInt(limit)
    })
  } catch (error) {
    console.error('listPeriods error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// ─────────────────────────────────────────────────────────────
// PUT /pay-periods/:restaurantId/:periodId
// Ajuster les dates d'une période (manager seulement)
// ─────────────────────────────────────────────────────────────
export const updatePeriod = async (req, res) => {
  try {
    const { restaurantId, periodId } = req.params
    const { start_date, end_date } = req.body

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date et end_date requis' })
    }

    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({ error: 'start_date doit être avant end_date' })
    }

    const { data: period, error } = await supabase
      .from('pay_periods')
      .update({ start_date, end_date })
      .eq('id', periodId)
      .eq('restaurant_id', restaurantId)
      .eq('status', 'active')
      .select()
      .single()

    if (error || !period) {
      return res.status(404).json({ error: 'Période introuvable ou déjà clôturée' })
    }

    res.json({ success: true, period: formatPeriod(period) })
  } catch (error) {
    console.error('updatePeriod error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// ─────────────────────────────────────────────────────────────
// PUT /pay-periods/:restaurantId/:periodId/close
// Clôturer une période → créer automatiquement la suivante
// ─────────────────────────────────────────────────────────────
export const closePeriod = async (req, res) => {
  try {
    const { restaurantId, periodId } = req.params

    // Récupérer la période à clôturer
    const { data: period, error: fetchErr } = await supabase
      .from('pay_periods')
      .select('*')
      .eq('id', periodId)
      .eq('restaurant_id', restaurantId)
      .eq('status', 'active')
      .single()

    if (fetchErr || !period) {
      return res.status(404).json({ error: 'Période active introuvable' })
    }

    // Clôturer la période
    const { error: closeErr } = await supabase
      .from('pay_periods')
      .update({
        status:    'closed',
        closed_at: new Date().toISOString(),
        closed_by: req.user.id
      })
      .eq('id', periodId)

    if (closeErr) {
      return res.status(500).json({ error: 'Erreur lors de la clôture' })
    }

    // Résumé pour export CSV
    const summary = await buildPeriodSummary(restaurantId, periodId)

    res.json({
      success:      true,
      closedPeriod: formatPeriod({ ...period, status: 'closed' }),
      summary
    })
  } catch (error) {
    console.error('closePeriod error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// ─────────────────────────────────────────────────────────────
// POST /pay-periods/:restaurantId
// Créer manuellement une nouvelle période (manager seulement)
// ─────────────────────────────────────────────────────────────
export const createPeriod = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const { start_date, end_date } = req.body

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date et end_date requis' })
    }

    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({ error: 'La date de fin doit être après la date de début' })
    }

    // Vérifier chevauchement avec une période active existante
    const { data: overlap } = await supabase
      .from('pay_periods')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('status', 'active')
      .lte('start_date', end_date)
      .gte('end_date', start_date)
      .limit(1)
      .single()

    if (overlap) {
      return res.status(409).json({ error: 'Une période active existe déjà sur cette plage de dates' })
    }

    const { data: newPeriod, error } = await supabase
      .from('pay_periods')
      .insert({
        restaurant_id: restaurantId,
        start_date,
        end_date,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la création' })
    }

    res.status(201).json({ success: true, period: formatPeriod(newPeriod) })
  } catch (error) {
    console.error('createPeriod error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// ─────────────────────────────────────────────────────────────
// GET /pay-periods/:restaurantId/:periodId/summary
// Stats complètes d'une période (pour export)
// ─────────────────────────────────────────────────────────────
export const getPeriodSummary = async (req, res) => {
  try {
    const { restaurantId, periodId } = req.params

    // Vérifier que la période appartient au restaurant
    const { data: period, error } = await supabase
      .from('pay_periods')
      .select('*')
      .eq('id', periodId)
      .eq('restaurant_id', restaurantId)
      .single()

    if (error || !period) {
      return res.status(404).json({ error: 'Période introuvable' })
    }

    const summary = await buildPeriodSummary(restaurantId, periodId)

    res.json({ success: true, period: formatPeriod(period), summary })
  } catch (error) {
    console.error('getPeriodSummary error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// ─────────────────────────────────────────────────────────────
// Internal : Construit le résumé complet d'une période
// ─────────────────────────────────────────────────────────────
async function buildPeriodSummary(restaurantId, periodId) {
  // Tous les rapports de la période
  const { data: reports } = await supabase
    .from('reports')
    .select('employee_id, employee_name, total_sales, tip_out_amount, status, created_at')
    .eq('restaurant_id', restaurantId)
    .eq('pay_period_id', periodId)
    .order('created_at', { ascending: true })

  // Toutes les distributions de la période
  const { data: distributions } = await supabase
    .from('tip_distributions')
    .select('to_employee_id, to_employee_name, amount, role, is_donation')
    .eq('restaurant_id', restaurantId)
    .eq('pay_period_id', periodId)
    .eq('is_meal_deduction', false)

  // Agréger par employé
  const byEmployee = {}

  for (const r of reports || []) {
    if (!byEmployee[r.employee_id]) {
      byEmployee[r.employee_id] = {
        employeeId:   r.employee_id,
        employeeName: r.employee_name,
        totalSales:   0,
        tipOutGiven:  0,
        reportCount:  0,
        tipsReceived: 0
      }
    }
    byEmployee[r.employee_id].totalSales  += parseFloat(r.total_sales)    || 0
    byEmployee[r.employee_id].tipOutGiven += parseFloat(r.tip_out_amount) || 0
    byEmployee[r.employee_id].reportCount += 1
  }

  for (const d of distributions || []) {
    if (!d.to_employee_id) continue
    if (!byEmployee[d.to_employee_id]) {
      byEmployee[d.to_employee_id] = {
        employeeId:   d.to_employee_id,
        employeeName: d.to_employee_name,
        totalSales:   0,
        tipOutGiven:  0,
        reportCount:  0,
        tipsReceived: 0
      }
    }
    byEmployee[d.to_employee_id].tipsReceived += parseFloat(d.amount) || 0
  }

  const employees = Object.values(byEmployee)
  const totals = employees.reduce((acc, e) => {
    acc.totalSales    += e.totalSales
    acc.totalTipOut   += e.tipOutGiven
    acc.totalReceived += e.tipsReceived
    acc.totalReports  += e.reportCount
    return acc
  }, { totalSales: 0, totalTipOut: 0, totalReceived: 0, totalReports: 0 })

  return { employees, totals }
}

// ─────────────────────────────────────────────────────────────
// PUT /pay-periods/:restaurantId/recalculate
// Recalcule la période active selon la config courante du restaurant
// (utilisé après un changement de fréquence/date de référence dans Settings)
// ─────────────────────────────────────────────────────────────
export const recalculatePeriod = async (req, res) => {
  try {
    const { restaurantId } = req.params

    // Lire la nouvelle config
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('pay_period_frequency, pay_period_start_day, pay_period_reference_date')
      .eq('id', restaurantId)
      .single()

    const frequency     = restaurant?.pay_period_frequency      || 'biweekly'
    const startDay      = restaurant?.pay_period_start_day      ?? 1
    const referenceDate = restaurant?.pay_period_reference_date || null

    const bounds = computePeriodBounds(frequency, startDay, referenceDate)

    // Supprimer la période active existante (sans historique à préserver)
    await supabase
      .from('pay_periods')
      .delete()
      .eq('restaurant_id', restaurantId)
      .eq('status', 'active')

    // Créer la nouvelle période avec les dates recalculées
    const { data: newPeriod, error } = await supabase
      .from('pay_periods')
      .insert({
        restaurant_id: restaurantId,
        start_date:    bounds.start_date,
        end_date:      bounds.end_date,
        status:        'active'
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: 'Erreur lors du recalcul' })
    }

    res.json({ success: true, period: formatPeriod(newPeriod) })
  } catch (error) {
    console.error('recalculatePeriod error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// ─────────────────────────────────────────────────────────────
// Helper : Formater une période pour l'API
// ─────────────────────────────────────────────────────────────
function formatPeriod(period) {
  return {
    id:           period.id,
    restaurantId: period.restaurant_id,
    startDate:    period.start_date,
    endDate:      period.end_date,
    status:       period.status,
    closedAt:     period.closed_at || null,
    closedBy:     period.closed_by || null,
    createdAt:    period.created_at
  }
}
