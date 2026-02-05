import { supabase } from '../config/supabase.js'
import { sendEmail, emailTemplates } from '../config/email.js'

// Create new cash out report
export const createReport = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const {
      cashSales,
      cardSales,
      otherSales,
      cashTips,
      cardTips,
      tipOutPercent,
      cashInHand
    } = req.body

    // Calculate totals
    const totalSales = (cashSales || 0) + (cardSales || 0) + (otherSales || 0)
    const totalTips = (cashTips || 0) + (cardTips || 0)
    const tipOutAmount = totalTips * (tipOutPercent / 100)
    const netTips = totalTips - tipOutAmount
    const expectedCash = (cashSales || 0) + (cashTips || 0)
    const difference = (cashInHand || 0) - expectedCash

    const reportData = {
      restaurant_id: restaurantId,
      employee_id: req.user.id,
      employee_name: `${req.user.first_name} ${req.user.last_name}`,
      employee_email: req.user.email,
      // Sales
      cash_sales: cashSales || 0,
      card_sales: cardSales || 0,
      other_sales: otherSales || 0,
      total_sales: totalSales,
      // Tips
      cash_tips: cashTips || 0,
      card_tips: cardTips || 0,
      total_tips: totalTips,
      // Tip Out
      tip_out_percent: tipOutPercent || 0,
      tip_out_amount: tipOutAmount,
      net_tips: netTips,
      // Cash balance
      cash_in_hand: cashInHand || 0,
      expected_cash: expectedCash,
      difference: difference,
      // Status
      status: 'pending'
    }

    const { data: newReport, error } = await supabase
      .from('reports')
      .insert(reportData)
      .select()
      .single()

    if (error) {
      console.error('Create report error:', error)
      return res.status(500).json({ error: 'Erreur lors de la création du rapport' })
    }

    res.status(201).json({
      success: true,
      report: formatReport(newReport)
    })
  } catch (error) {
    console.error('Create report error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Get reports for a restaurant
export const getReports = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const { status, startDate, endDate, employeeId } = req.query

    let query = supabase
      .from('reports')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })

    // If user is a server, only show their own reports
    const userRole = req.user.restaurants?.find(r => r.id === restaurantId)?.role
    if (userRole === 'server') {
      query = query.eq('employee_id', req.user.id)
    } else if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status)
    }

    // Filter by date range
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data: reports, error } = await query

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la récupération' })
    }

    res.json({
      success: true,
      reports: reports.map(formatReport)
    })
  } catch (error) {
    console.error('Get reports error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Get single report
export const getReport = async (req, res) => {
  try {
    const { reportId } = req.params

    const { data: report, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (error || !report) {
      return res.status(404).json({ error: 'Rapport non trouvé' })
    }

    res.json({
      success: true,
      report: formatReport(report)
    })
  } catch (error) {
    console.error('Get report error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Validate report (Manager only)
export const validateReport = async (req, res) => {
  try {
    const { reportId } = req.params
    const { status, note } = req.body

    if (!['validated', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' })
    }

    // Get report data first
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (fetchError || !report) {
      return res.status(404).json({ error: 'Rapport non trouvé' })
    }

    // Update report
    const { error } = await supabase
      .from('reports')
      .update({
        status,
        validated_by: req.user.id,
        validated_by_name: `${req.user.first_name} ${req.user.last_name}`,
        validation_note: note || '',
        validated_at: new Date().toISOString()
      })
      .eq('id', reportId)

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la validation' })
    }

    // Send email notification to employee
    if (status === 'validated' && report.employee_email) {
      const date = new Date(report.created_at).toLocaleDateString('fr-CA')
      const template = emailTemplates.reportValidated(
        report.employee_name,
        date,
        report.net_tips.toFixed(2)
      )
      await sendEmail({
        to: report.employee_email,
        ...template
      })
    }

    res.json({
      success: true,
      message: status === 'validated' ? 'Rapport validé' : 'Rapport rejeté'
    })
  } catch (error) {
    console.error('Validate report error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Get dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get today's reports
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', today.toISOString())

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la récupération' })
    }

    let totalSales = 0
    let totalTips = 0
    let pendingReports = 0
    let validatedReports = 0

    reports?.forEach(report => {
      totalSales += parseFloat(report.total_sales) || 0
      totalTips += parseFloat(report.total_tips) || 0
      if (report.status === 'pending') pendingReports++
      if (report.status === 'validated') validatedReports++
    })

    res.json({
      success: true,
      stats: {
        totalSales,
        totalTips,
        pendingReports,
        validatedReports,
        totalReports: reports?.length || 0
      }
    })
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Helper function to format report for API response
function formatReport(report) {
  return {
    id: report.id,
    restaurantId: report.restaurant_id,
    employeeId: report.employee_id,
    employeeName: report.employee_name,
    employeeEmail: report.employee_email,
    // Sales
    cashSales: parseFloat(report.cash_sales),
    cardSales: parseFloat(report.card_sales),
    otherSales: parseFloat(report.other_sales),
    totalSales: parseFloat(report.total_sales),
    // Tips
    cashTips: parseFloat(report.cash_tips),
    cardTips: parseFloat(report.card_tips),
    totalTips: parseFloat(report.total_tips),
    // Tip Out
    tipOutPercent: parseFloat(report.tip_out_percent),
    tipOutAmount: parseFloat(report.tip_out_amount),
    netTips: parseFloat(report.net_tips),
    // Cash balance
    cashInHand: parseFloat(report.cash_in_hand),
    expectedCash: parseFloat(report.expected_cash),
    difference: parseFloat(report.difference),
    // Status
    status: report.status,
    validatedBy: report.validated_by,
    validatedByName: report.validated_by_name,
    validationNote: report.validation_note,
    validatedAt: report.validated_at,
    // Timestamps
    createdAt: report.created_at,
    updatedAt: report.updated_at
  }
}
