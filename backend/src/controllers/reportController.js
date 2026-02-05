import { db } from '../config/firebase.js'
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
      restaurantId,
      employeeId: req.user.uid,
      employeeName: `${req.user.firstName} ${req.user.lastName}`,
      employeeEmail: req.user.email,
      // Sales
      cashSales: cashSales || 0,
      cardSales: cardSales || 0,
      otherSales: otherSales || 0,
      totalSales,
      // Tips
      cashTips: cashTips || 0,
      cardTips: cardTips || 0,
      totalTips,
      // Tip Out
      tipOutPercent,
      tipOutAmount,
      netTips,
      // Cash balance
      cashInHand: cashInHand || 0,
      expectedCash,
      difference,
      // Status
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const docRef = await db.collection('reports').add(reportData)

    res.status(201).json({
      success: true,
      report: { id: docRef.id, ...reportData }
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

    let query = db.collection('reports')
      .where('restaurantId', '==', restaurantId)
      .orderBy('createdAt', 'desc')

    // If user is a server, only show their own reports
    const userRole = req.user.restaurants?.find(r => r.id === restaurantId)?.role
    if (userRole === 'server') {
      query = query.where('employeeId', '==', req.user.uid)
    } else if (employeeId) {
      query = query.where('employeeId', '==', employeeId)
    }

    const snapshot = await query.get()
    let reports = []

    snapshot.forEach(doc => {
      const data = doc.data()
      // Filter by status if provided
      if (status && data.status !== status) return
      // Filter by date range if provided
      if (startDate) {
        const reportDate = data.createdAt.toDate()
        if (reportDate < new Date(startDate)) return
      }
      if (endDate) {
        const reportDate = data.createdAt.toDate()
        if (reportDate > new Date(endDate)) return
      }

      reports.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      })
    })

    res.json({ success: true, reports })
  } catch (error) {
    console.error('Get reports error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Get single report
export const getReport = async (req, res) => {
  try {
    const { reportId } = req.params
    const doc = await db.collection('reports').doc(reportId).get()

    if (!doc.exists) {
      return res.status(404).json({ error: 'Rapport non trouvé' })
    }

    const data = doc.data()

    res.json({
      success: true,
      report: {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      }
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

    const reportDoc = await db.collection('reports').doc(reportId).get()
    if (!reportDoc.exists) {
      return res.status(404).json({ error: 'Rapport non trouvé' })
    }

    const reportData = reportDoc.data()

    await db.collection('reports').doc(reportId).update({
      status,
      validatedBy: req.user.uid,
      validatedByName: `${req.user.firstName} ${req.user.lastName}`,
      validationNote: note || '',
      validatedAt: new Date(),
      updatedAt: new Date()
    })

    // Send email notification to employee
    if (status === 'validated' && reportData.employeeEmail) {
      const date = reportData.createdAt?.toDate().toLocaleDateString('fr-CA')
      const template = emailTemplates.reportValidated(
        reportData.employeeName,
        date,
        reportData.netTips.toFixed(2)
      )
      await sendEmail({
        to: reportData.employeeEmail,
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
    const snapshot = await db.collection('reports')
      .where('restaurantId', '==', restaurantId)
      .where('createdAt', '>=', today)
      .get()

    let totalSales = 0
    let totalTips = 0
    let pendingReports = 0
    let validatedReports = 0

    snapshot.forEach(doc => {
      const data = doc.data()
      totalSales += data.totalSales || 0
      totalTips += data.totalTips || 0
      if (data.status === 'pending') pendingReports++
      if (data.status === 'validated') validatedReports++
    })

    res.json({
      success: true,
      stats: {
        totalSales,
        totalTips,
        pendingReports,
        validatedReports,
        totalReports: snapshot.size
      }
    })
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}
