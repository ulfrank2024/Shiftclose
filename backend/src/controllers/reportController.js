import { supabase } from '../config/supabase.js'
import { sendEmail, emailTemplates } from '../config/email.js'
import { getOrCreateCurrentPeriod } from './payPeriodController.js'

// ─────────────────────────────────────────────────────────────
// Create new cash out report (with full tip-out distribution)
// ─────────────────────────────────────────────────────────────
export const createReport = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const {
      // New simplified fields (from machine printout)
      totalSales: rawTotalSales,
      comptant,
      // Sales (legacy breakdown)
      cashSales, cardSales, otherSales,
      // Tips (legacy)
      cashTips, cardTips,
      // Cash amount
      cashAmount,
      // Tip-out breakdown: [{ position, percentage, totalAmount, isPool, persons:[...] }]
      tipOutBreakdown = [],
      tipOutTotal: rawTipOutTotal,
      dueBack: rawDueBack,
      // Proof photo
      proofImageBase64,
      // Manager submitting on behalf of an employee
      forUserId,
      // Voluntary donations + meal deductions (legacy arrays)
      voluntaryDonations = [],
      mealDeductions = [],
      // Legacy
      tipOutPercent, cashInHand
    } = req.body

    // ── Determine the employee this report is for ────────────
    let employeeId   = req.user.id
    let employeeName = `${req.user.first_name} ${req.user.last_name}`
    let employeeEmail = req.user.email
    let submittedByManagerId = null

    if (forUserId && forUserId !== req.user.id) {
      // Verify the requester is a manager of this restaurant
      const { data: managerCheck } = await supabase
        .from('user_restaurants')
        .select('role')
        .eq('user_id', req.user.id)
        .eq('restaurant_id', restaurantId)
        .single()

      if (!managerCheck || managerCheck.role !== 'manager') {
        return res.status(403).json({ error: 'Seul un manager peut soumettre pour un employé' })
      }

      // Fetch the target employee info
      const { data: targetUser } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .eq('id', forUserId)
        .single()

      if (targetUser) {
        employeeId    = targetUser.id
        employeeName  = `${targetUser.first_name} ${targetUser.last_name}`
        employeeEmail = targetUser.email
        submittedByManagerId = req.user.id
      }
    }

    // ── Totals (new simplified system) ──────────────────────
    const totalSales  = parseFloat(rawTotalSales) || (cashSales || 0) + (cardSales || 0) + (otherSales || 0)
    const totalTips   = (cashTips || 0) + (cardTips || 0)
    const physicalCash = parseFloat(comptant) !== undefined && rawTotalSales !== undefined
      ? parseFloat(comptant) || 0
      : (cashAmount !== undefined ? cashAmount : ((cashSales || 0) + (cashTips || 0)))

    // Tip-out total from breakdown or legacy
    const tipOutTotal = rawTipOutTotal !== undefined
      ? parseFloat(rawTipOutTotal) || 0
      : tipOutBreakdown.length > 0
        ? tipOutBreakdown.reduce((sum, b) => sum + (b.totalAmount || b.amount || 0), 0)
        : totalTips * ((tipOutPercent || 0) / 100)

    const donationTotal = voluntaryDonations.reduce((sum, d) => sum + (d.amount || 0), 0)
    const netTips = totalTips - tipOutTotal - donationTotal

    const dueBack = rawDueBack !== undefined
      ? parseFloat(rawDueBack) || 0
      : tipOutTotal + physicalCash

    // Legacy
    const expectedCash     = (cashSales || 0) + (cashTips || 0)
    const legacyCashInHand = cashInHand || physicalCash
    const difference       = legacyCashInHand - expectedCash

    // ── Récupérer la période de paie courante ───────────────
    const currentPeriod = await getOrCreateCurrentPeriod(restaurantId)
    if (!currentPeriod) {
      return res.status(403).json({
        error: 'Aucune période de paie active. Contactez votre manager.',
        code: 'NO_ACTIVE_PERIOD'
      })
    }
    const payPeriodId = currentPeriod.id

    // ── Insert report ────────────────────────────────────────
    const reportData = {
      restaurant_id:      restaurantId,
      employee_id:        employeeId,
      employee_name:      employeeName,
      employee_email:     employeeEmail,
      // Sales
      cash_sales:         cashSales  || 0,
      card_sales:         cardSales  || 0,
      other_sales:        otherSales || 0,
      total_sales:        totalSales,
      // Tips
      cash_tips:          cashTips || 0,
      card_tips:          cardTips || 0,
      total_tips:         totalTips,
      // Tip-out
      tip_out_percent:    tipOutPercent || 0,
      tip_out_amount:     tipOutTotal,
      net_tips:           netTips,
      // New system fields
      tip_out_breakdown:  JSON.stringify(tipOutBreakdown),
      voluntary_donations: JSON.stringify(voluntaryDonations),
      meal_deductions:    JSON.stringify(mealDeductions),
      cash_amount:        physicalCash,
      due_back:           dueBack,
      // Proof photo
      proof_image_base64: proofImageBase64 || null,
      // Manager submission
      submitted_by_manager_id:  submittedByManagerId,
      submitted_for_employee_id: forUserId && forUserId !== req.user.id ? forUserId : null,
      // Legacy cash balance
      cash_in_hand:       legacyCashInHand,
      expected_cash:      expectedCash,
      difference:         difference,
      // Status: auto-validate if submitted by manager
      status:             submittedByManagerId ? 'validated' : 'pending',
      // Période de paie
      pay_period_id:      payPeriodId
    }

    const { data: newReport, error: reportError } = await supabase
      .from('reports')
      .insert(reportData)
      .select()
      .single()

    if (reportError) {
      console.error('Create report error:', reportError)
      return res.status(500).json({ error: 'Erreur lors de la création du rapport' })
    }

    // ── Insert tip_distributions (for beneficiary view) ─────
    const distributions = []
    const reportDate = new Date().toISOString().split('T')[0]
    const fromName   = `${req.user.first_name} ${req.user.last_name}`

    // Standard tip-out breakdown — structure : { position, percentage, totalAmount, isPool, persons:[{personId, personName, tipAmount, meal, donation, net}] }
    for (const item of tipOutBreakdown) {
      const position = item.position || item.role || 'unknown'
      const pct      = parseFloat(item.percentage) || 0
      const total    = parseFloat(item.totalAmount ?? item.amount) || 0

      if (item.isPool || item.isAutomatic || position.toLowerCase().includes('pool') || position.toLowerCase().includes('cuisine')) {
        // Pool cuisine ou règle automatique : une seule ligne sans bénéficiaire individuel
        if (total > 0) {
          distributions.push({
            report_id:          newReport.id,
            restaurant_id:      restaurantId,
            from_employee_id:   req.user.id,
            from_employee_name: fromName,
            to_employee_id:     null,
            to_employee_name:   'Pool Cuisine',
            role:               position,
            percentage:         pct,
            base_amount:        totalSales,
            amount:             total,
            is_donation:        false,
            is_meal_deduction:  false,
            report_date:        reportDate,
            pay_period_id:      payPeriodId
          })
        }
      } else if (item.persons?.length > 0) {
        // Distribution individuelle : une ligne par personne
        for (const p of item.persons) {
          const net = parseFloat(p.net ?? p.tipAmount) || 0
          if (net === 0 && !p.personId) continue
          distributions.push({
            report_id:          newReport.id,
            restaurant_id:      restaurantId,
            from_employee_id:   req.user.id,
            from_employee_name: fromName,
            to_employee_id:     p.personId || null,
            to_employee_name:   p.personName || 'Inconnu',
            role:               position,
            percentage:         pct,
            base_amount:        totalSales,
            amount:             net,
            is_donation:        false,
            is_meal_deduction:  false,
            report_date:        reportDate,
            pay_period_id:      payPeriodId
          })
        }
      } else if (!item.persons && total > 0) {
        // Fallback: structure legacy avec personId/personName directement sur l'item
        distributions.push({
          report_id:          newReport.id,
          restaurant_id:      restaurantId,
          from_employee_id:   req.user.id,
          from_employee_name: fromName,
          to_employee_id:     item.personId || null,
          to_employee_name:   item.personName || position,
          role:               position,
          percentage:         pct,
          base_amount:        totalSales,
          amount:             total,
          is_donation:        false,
          is_meal_deduction:  false,
          report_date:        reportDate,
          pay_period_id:      payPeriodId
        })
      }
    }

    // Voluntary donations
    for (const donation of voluntaryDonations) {
      if (donation.amount > 0) {
        distributions.push({
          report_id:          newReport.id,
          restaurant_id:      restaurantId,
          from_employee_id:   req.user.id,
          from_employee_name: `${req.user.first_name} ${req.user.last_name}`,
          to_employee_id:     donation.personId || null,
          to_employee_name:   donation.personName,
          role:               'donation',
          percentage:         0,
          base_amount:        0,
          amount:             donation.amount,
          is_donation:        true,
          is_meal_deduction:  false,
          report_date:        reportDate,
          pay_period_id:      payPeriodId
        })
      }
    }

    // Meal deductions (stored as negative for the beneficiary)
    for (const meal of mealDeductions) {
      if (meal.amount > 0) {
        distributions.push({
          report_id:          newReport.id,
          restaurant_id:      restaurantId,
          from_employee_id:   req.user.id,
          from_employee_name: `${req.user.first_name} ${req.user.last_name}`,
          to_employee_id:     meal.personId || null,
          to_employee_name:   meal.personName,
          role:               'meal_deduction',
          percentage:         0,
          base_amount:        0,
          amount:             -Math.abs(meal.amount),   // negative = deduction
          is_donation:        false,
          is_meal_deduction:  true,
          report_date:        reportDate,
          pay_period_id:      payPeriodId
        })
      }
    }

    if (distributions.length > 0) {
      const { error: distError } = await supabase
        .from('tip_distributions')
        .insert(distributions)

      if (distError) {
        console.warn('Tip distributions insert warning:', distError)
        // Non-fatal: report is already created
      }
    }

    // ── Notifications email (non-bloquantes) ─────────────────
    const reportDateTime = new Date(newReport.created_at)
    const dateStr        = reportDateTime.toLocaleDateString('fr-CA')
    const timeStr        = reportDateTime.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })

    // 1. Email aux managers du restaurant (rapport soumis par l'employé)
    if (!submittedByManagerId) {
      ;(async () => {
        try {
          const [{ data: managers }, { data: restRow }] = await Promise.all([
            supabase
              .from('user_restaurants')
              .select('user_id, users!inner(first_name, last_name, email)')
              .eq('restaurant_id', restaurantId)
              .eq('role', 'manager'),
            supabase.from('restaurants').select('name').eq('id', restaurantId).single()
          ])
          if (!managers?.length) return
          const restaurantName = restRow?.name || 'Restaurant'

          // Préparer les distributions pour l'email
          const emailDist = []
          for (const item of tipOutBreakdown) {
            if (item.isPool || item.position?.toLowerCase().includes('pool')) {
              emailDist.push({ personName: 'Pool Cuisine', position: item.position, percentage: item.percentage, amount: item.totalAmount || 0 })
            } else {
              for (const p of (item.persons || [])) {
                emailDist.push({ personName: p.personName, position: item.position, percentage: item.percentage, amount: p.net ?? p.tipAmount ?? 0 })
              }
            }
          }

          for (const mgr of managers) {
            const u = mgr.users
            await sendEmail({
              to: u.email,
              ...emailTemplates.reportSubmitted(
                `${u.first_name} ${u.last_name}`,
                employeeName,
                restaurantName,
                dateStr, timeStr,
                totalSales, tipOutTotal, dueBack,
                emailDist
              )
            })
          }
        } catch (e) { console.warn('Manager notification error:', e.message) }
      })()
    }

    // 2. Email aux bénéficiaires des tips
    if (distributions.length > 0) {
      // Regrouper par bénéficiaire
      const byRecipient = {}
      for (const d of distributions) {
        if (!d.to_employee_id || d.amount <= 0) continue
        if (!byRecipient[d.to_employee_id]) {
          byRecipient[d.to_employee_id] = { items: [], total: 0 }
        }
        byRecipient[d.to_employee_id].items.push({ role: d.role, percentage: d.percentage, amount: d.amount })
        byRecipient[d.to_employee_id].total += d.amount
      }

      // Fetch recipient details & send emails
      const recipientIds = Object.keys(byRecipient)
      if (recipientIds.length > 0) {
        supabase
          .from('users')
          .select('id, first_name, last_name, email')
          .in('id', recipientIds)
          .then(async ({ data: recipientUsers }) => {
            const { data: restRow } = await supabase.from('restaurants').select('name').eq('id', restaurantId).single()
            const restaurantName = restRow?.name || 'Restaurant'

            for (const ru of (recipientUsers || [])) {
              const rec = byRecipient[ru.id]
              sendEmail({
                to: ru.email,
                ...emailTemplates.tipsReceived(
                  `${ru.first_name} ${ru.last_name}`,
                  fromName,
                  restaurantName,
                  dateStr,
                  rec.items,
                  rec.total
                )
              }).catch(() => {})
            }
          }).catch(() => {})
      }
    }

    res.status(201).json({
      success: true,
      report:  formatReport(newReport)
    })
  } catch (error) {
    console.error('Create report error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// ─────────────────────────────────────────────────────────────
// Get reports for a restaurant
// ─────────────────────────────────────────────────────────────
export const getReports = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const { status, startDate, endDate, employeeId, month, periodId } = req.query

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

    if (status)    query = query.eq('status', status)
    if (periodId)  query = query.eq('pay_period_id', periodId)
    if (startDate) query = query.gte('created_at', startDate)
    if (endDate)   query = query.lte('created_at', endDate)

    // Filter by month — expects 'YYYY-MM' format
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [year, mon] = month.split('-')
      const start = `${year}-${mon}-01T00:00:00.000Z`
      const endDate2 = new Date(parseInt(year), parseInt(mon), 1) // first day of next month
      const end = endDate2.toISOString()
      query = query.gte('created_at', start).lt('created_at', end)
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

// ─────────────────────────────────────────────────────────────
// Get single report
// ─────────────────────────────────────────────────────────────
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

    // Also fetch distributions for this report (with pay_period_id)
    const { data: distributions } = await supabase
      .from('tip_distributions')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true })

    res.json({
      success:       true,
      report:        formatReport(report),
      distributions: distributions || []
    })
  } catch (error) {
    console.error('Get report error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// ─────────────────────────────────────────────────────────────
// Get my received tips (for commis, bartenders, hosts, managers)
// ─────────────────────────────────────────────────────────────
export const getMyReceivedTips = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const { startDate, endDate, date, periodId } = req.query

    let query = supabase
      .from('tip_distributions')
      .select('*, pay_periods(start_date, end_date, status)')
      .eq('restaurant_id', restaurantId)
      .eq('to_employee_id', req.user.id)
      .eq('is_meal_deduction', false)
      .order('report_date', { ascending: false })

    if (date)      query = query.eq('report_date', date)
    if (periodId)  query = query.eq('pay_period_id', periodId)
    if (startDate) query = query.gte('report_date', startDate)
    if (endDate)   query = query.lte('report_date', endDate)

    const { data: distributions, error } = await query

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la récupération' })
    }

    // Group by pay_period_id (puis par date à l'intérieur)
    const byPeriod = {}
    const byDate   = {}

    for (const dist of distributions || []) {
      const amount     = parseFloat(dist.amount) || 0
      const cancelled  = dist.status === 'cancelled'
      const item = {
        id:               dist.id,
        fromEmployeeId:   dist.from_employee_id,
        fromEmployeeName: dist.from_employee_name,
        role:             dist.role,
        percentage:       parseFloat(dist.percentage) || 0,
        amount,
        isDonation:       dist.is_donation,
        reportDate:       dist.report_date,
        payPeriodId:      dist.pay_period_id,
        createdAt:        dist.created_at,
        // Annulation
        cancelled,
        cancelledReason:  dist.cancelled_reason || null,
        cancelledAt:      dist.cancelled_at || null
      }

      // Groupement par période
      const pId = dist.pay_period_id || 'no-period'
      if (!byPeriod[pId]) {
        byPeriod[pId] = {
          periodId:  dist.pay_period_id,
          startDate: dist.pay_periods?.start_date || null,
          endDate:   dist.pay_periods?.end_date   || null,
          status:    dist.pay_periods?.status     || null,
          total:     0,
          items:     []
        }
      }
      if (!cancelled) byPeriod[pId].total += amount
      byPeriod[pId].items.push(item)

      // Groupement par date (compatibilité ancienne)
      const d = dist.report_date
      if (!byDate[d]) byDate[d] = { date: d, total: 0, items: [] }
      if (!cancelled) byDate[d].total += amount
      byDate[d].items.push(item)
    }

    // Total uniquement sur les tips actifs
    const totalReceived = Object.values(byDate).reduce((sum, d) => sum + d.total, 0)

    res.json({
      success: true,
      // Groupé par période (nouveau)
      byPeriod: Object.values(byPeriod).sort((a, b) => {
        if (!a.startDate) return 1
        if (!b.startDate) return -1
        return new Date(b.startDate) - new Date(a.startDate)
      }),
      // Groupé par date (rétrocompatibilité)
      history: Object.values(byDate).sort((a, b) => new Date(b.date) - new Date(a.date)),
      totalReceived
    })
  } catch (error) {
    console.error('Get received tips error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// ─────────────────────────────────────────────────────────────
// Validate report (Manager only)
// ─────────────────────────────────────────────────────────────
export const validateReport = async (req, res) => {
  try {
    const { reportId } = req.params
    const { status, note } = req.body

    if (!['validated', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' })
    }

    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (fetchError || !report) {
      return res.status(404).json({ error: 'Rapport non trouvé' })
    }

    const { error } = await supabase
      .from('reports')
      .update({
        status,
        validated_by:      req.user.id,
        validated_by_name: `${req.user.first_name} ${req.user.last_name}`,
        validation_note:   note || '',
        validated_at:      new Date().toISOString()
      })
      .eq('id', reportId)

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la validation' })
    }

    const date = new Date(report.created_at).toLocaleDateString('fr-CA')

    if (status === 'validated' && report.employee_email) {
      const template = emailTemplates.reportValidated(
        report.employee_name,
        date,
        report.net_tips?.toFixed(2) || '0.00'
      )
      await sendEmail({ to: report.employee_email, ...template }).catch(e => console.error('email validated:', e))
    }

    if (status === 'rejected') {
      // 1. Récupérer les distributions actives liées à ce rapport
      const { data: tipDists } = await supabase
        .from('tip_distributions')
        .select('id, to_employee_id, to_employee_name, amount')
        .eq('report_id', reportId)
        .eq('status', 'active')

      // 2. Marquer les distributions comme annulées
      if (tipDists?.length) {
        await supabase
          .from('tip_distributions')
          .update({
            status: 'cancelled',
            cancelled_reason: note || 'Rapport rejeté par le manager',
            cancelled_at: new Date().toISOString()
          })
          .eq('report_id', reportId)

        // 3. Notifier chaque bénéficiaire par email
        for (const dist of tipDists) {
          if (!dist.to_employee_id || dist.amount <= 0) continue
          const { data: recipient } = await supabase
            .from('users')
            .select('email, first_name')
            .eq('id', dist.to_employee_id)
            .single()
          if (recipient?.email) {
            const tpl = emailTemplates.tipCancelled(
              recipient.first_name,
              report.employee_name,
              date,
              dist.amount,
              note || 'Rapport rejeté par le manager'
            )
            await sendEmail({ to: recipient.email, ...tpl }).catch(e => console.error('email tipCancelled:', e))
          }
        }
      }

      // 4. Email de rejet à l'employé
      if (report.employee_email) {
        const tpl = emailTemplates.reportRejected(report.employee_name, date, note || '')
        await sendEmail({ to: report.employee_email, ...tpl }).catch(e => console.error('email rejected:', e))
      }
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

// ─────────────────────────────────────────────────────────────
// Delete report (Manager only)
// ─────────────────────────────────────────────────────────────
export const deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params

    const { data: report } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (!report) return res.status(404).json({ error: 'Rapport non trouvé' })

    const date = new Date(report.created_at).toLocaleDateString('fr-CA')

    // 1. Annuler les distributions actives + notifier les bénéficiaires
    const { data: tipDists } = await supabase
      .from('tip_distributions')
      .select('id, to_employee_id, amount')
      .eq('report_id', reportId)
      .eq('status', 'active')

    if (tipDists?.length) {
      await supabase
        .from('tip_distributions')
        .update({
          status: 'cancelled',
          cancelled_reason: 'Rapport supprimé par le manager',
          cancelled_at: new Date().toISOString()
        })
        .eq('report_id', reportId)

      for (const dist of tipDists) {
        if (!dist.to_employee_id || dist.amount <= 0) continue
        const { data: recipient } = await supabase
          .from('users')
          .select('email, first_name')
          .eq('id', dist.to_employee_id)
          .single()
        if (recipient?.email) {
          const tpl = emailTemplates.tipCancelled(
            recipient.first_name,
            report.employee_name,
            date,
            dist.amount,
            'Rapport supprimé par le manager'
          )
          await sendEmail({ to: recipient.email, ...tpl }).catch(e => console.error('email tipCancelled:', e))
        }
      }
    }

    // 2. Email à l'employé
    if (report.employee_email) {
      const tpl = emailTemplates.reportRejected(
        report.employee_name, date,
        'Votre rapport a été supprimé par le manager.'
      )
      await sendEmail({ to: report.employee_email, ...tpl }).catch(e => console.error('email delete:', e))
    }

    // 3. Supprimer le rapport (cascade supprime les distributions)
    await supabase.from('reports').delete().eq('id', reportId)

    res.json({ success: true, message: 'Rapport supprimé' })
  } catch (error) {
    console.error('Delete report error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// ─────────────────────────────────────────────────────────────
// Resubmit a rejected report (Employee only)
// PUT /reports/:reportId/resubmit
// ─────────────────────────────────────────────────────────────
export const resubmitReport = async (req, res) => {
  try {
    const { reportId } = req.params
    const {
      totalSales: rawTotalSales,
      comptant, cashAmount,
      tipOutBreakdown = [],
      tipOutTotal: rawTipOutTotal,
      dueBack: rawDueBack,
      proofImageBase64
    } = req.body

    // Fetch existing report
    const { data: report, error: fetchErr } = await supabase
      .from('reports').select('*').eq('id', reportId).single()

    if (fetchErr || !report) {
      return res.status(404).json({ error: 'Rapport non trouvé' })
    }
    if (report.status !== 'rejected') {
      return res.status(400).json({ error: 'Seuls les rapports rejetés peuvent être renvoyés' })
    }
    if (report.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres rapports' })
    }

    // Vérifier période active
    const currentPeriod = await getOrCreateCurrentPeriod(report.restaurant_id)
    if (!currentPeriod) {
      return res.status(403).json({
        error: 'Aucune période de paie active. Contactez votre manager.',
        code: 'NO_ACTIVE_PERIOD'
      })
    }

    const totalSales   = parseFloat(rawTotalSales) || 0
    const physicalCash = parseFloat(comptant) || parseFloat(cashAmount) || 0
    const tipOutTotal  = rawTipOutTotal !== undefined
      ? parseFloat(rawTipOutTotal) || 0
      : tipOutBreakdown.reduce((s, b) => s + (parseFloat(b.totalAmount || b.amount) || 0), 0)
    const dueBack = rawDueBack !== undefined
      ? parseFloat(rawDueBack) || 0
      : tipOutTotal + physicalCash

    // Mettre à jour le rapport — remettre en 'pending'
    await supabase.from('reports').update({
      total_sales:       totalSales,
      cash_amount:       physicalCash,
      tip_out_amount:    tipOutTotal,
      due_back:          dueBack,
      tip_out_breakdown: JSON.stringify(tipOutBreakdown),
      proof_image_base64: proofImageBase64 !== undefined ? proofImageBase64 : report.proof_image_base64,
      status:            'pending',
      validated_by:      null,
      validated_by_name: null,
      validation_note:   null,
      validated_at:      null,
      pay_period_id:     currentPeriod.id
    }).eq('id', reportId)

    // Supprimer les anciennes distributions (annulées)
    await supabase.from('tip_distributions').delete().eq('report_id', reportId)

    // Insérer les nouvelles distributions
    const reportDate = new Date().toISOString().split('T')[0]
    const fromName   = `${req.user.first_name} ${req.user.last_name}`
    const distributions = []

    for (const item of tipOutBreakdown) {
      const position = item.position || item.role || 'unknown'
      const pct      = parseFloat(item.percentage) || 0
      const total    = parseFloat(item.totalAmount ?? item.amount) || 0

      if (item.isPool || item.isAutomatic || position.toLowerCase().includes('pool') || position.toLowerCase().includes('cuisine')) {
        if (total > 0) {
          distributions.push({
            report_id: reportId, restaurant_id: report.restaurant_id,
            from_employee_id: req.user.id, from_employee_name: fromName,
            to_employee_id: null, to_employee_name: 'Pool Cuisine',
            role: position, percentage: pct, base_amount: totalSales,
            amount: total, is_donation: false, is_meal_deduction: false,
            report_date: reportDate, pay_period_id: currentPeriod.id
          })
        }
      } else if (item.persons?.length > 0) {
        for (const p of item.persons) {
          const net = parseFloat(p.net ?? p.tipAmount) || 0
          if (net === 0 && !p.personId) continue
          distributions.push({
            report_id: reportId, restaurant_id: report.restaurant_id,
            from_employee_id: req.user.id, from_employee_name: fromName,
            to_employee_id: p.personId || null, to_employee_name: p.personName || 'Inconnu',
            role: position, percentage: pct, base_amount: totalSales,
            amount: net, is_donation: false, is_meal_deduction: false,
            report_date: reportDate, pay_period_id: currentPeriod.id
          })
        }
      }
    }

    if (distributions.length > 0) {
      await supabase.from('tip_distributions').insert(distributions)
    }

    // Notifier les managers
    ;(async () => {
      try {
        const [{ data: managers }, { data: restRow }] = await Promise.all([
          supabase.from('user_restaurants')
            .select('user_id, users!inner(first_name, last_name, email)')
            .eq('restaurant_id', report.restaurant_id).eq('role', 'manager'),
          supabase.from('restaurants').select('name').eq('id', report.restaurant_id).single()
        ])
        if (!managers?.length) return
        const restaurantName = restRow?.name || 'Restaurant'
        const dateStr = new Date().toLocaleDateString('fr-CA')
        const timeStr = new Date().toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })

        for (const mgr of managers) {
          const u = mgr.users
          await sendEmail({
            to: u.email,
            ...emailTemplates.reportSubmitted(
              `${u.first_name} ${u.last_name}`,
              report.employee_name,
              restaurantName, dateStr, timeStr,
              totalSales, tipOutTotal, dueBack, []
            )
          })
        }
      } catch (e) { console.warn('Resubmit manager notification error:', e.message) }
    })()

    res.json({ success: true, message: 'Rapport renvoyé avec succès' })
  } catch (error) {
    console.error('Resubmit report error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// ─────────────────────────────────────────────────────────────
// Dashboard stats
// Manager → stats globales du restaurant
// Serveur  → ses propres rapports + tips reçus aujourd'hui
// ─────────────────────────────────────────────────────────────
export const getDashboardStats = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const userId = req.user.id

    // Fenêtre 24h pour les stats personnelles (tip-out donné, tips reçus)
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Vérifier le rôle de l'utilisateur dans ce restaurant
    const { data: membership } = await supabase
      .from('user_restaurants')
      .select('role')
      .eq('user_id', userId)
      .eq('restaurant_id', restaurantId)
      .single()

    const isManager = membership?.role === 'manager'

    // ── Stats restaurant : TOUS les rapports (cumulatif) ─────
    const { data: allReports, error } = await supabase
      .from('reports')
      .select('*')
      .eq('restaurant_id', restaurantId)

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la récupération' })
    }

    let totalSales = 0, totalTipOut = 0, pendingReports = 0, validatedReports = 0
    let myTotalSales = 0, myTotalTipOut = 0, myPendingReports = 0, myValidatedReports = 0, myTotalReports = 0
    allReports?.forEach(report => {
      totalSales  += parseFloat(report.total_sales)    || 0
      totalTipOut += parseFloat(report.tip_out_amount) || parseFloat(report.total_tips) || 0
      if (report.status === 'pending')   pendingReports++
      if (report.status === 'validated') validatedReports++
      // Cumul personnel (tous les rapports de cet employé)
      if (report.employee_id === userId) {
        myTotalSales  += parseFloat(report.total_sales)    || 0
        myTotalTipOut += parseFloat(report.tip_out_amount) || 0
        myTotalReports++
        if (report.status === 'pending')   myPendingReports++
        if (report.status === 'validated') myValidatedReports++
      }
    })

    // ── Stats personnelles 24h : mes rapports des 24 dernières heures ─
    const myReports = allReports?.filter(
      r => r.employee_id === userId &&
           new Date(r.created_at) >= last24h
    ) || []
    let myTipOutGiven = 0
    myReports.forEach(report => {
      myTipOutGiven += parseFloat(report.tip_out_amount) || parseFloat(report.total_tips) || 0
    })

    // ── Tips reçus (24h glissantes) ───────────────────────────
    const { data: receivedRows } = await supabase
      .from('tip_distributions')
      .select('amount')
      .eq('restaurant_id', restaurantId)
      .eq('to_employee_id', userId)
      .gte('created_at', last24h.toISOString())

    const tipsReceivedToday = (receivedRows || []).reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)

    // ── Stats de la période de paie courante ─────────────────
    let currentPeriodStats = null
    try {
      const period = await getOrCreateCurrentPeriod(restaurantId)
      if (period) {
        // Filtrer par pay_period_id OU par plage de dates (rétrocompat rapports anciens)
        const periodStart = `${period.start_date}T00:00:00.000Z`
        const periodEnd   = `${period.end_date}T23:59:59.999Z`

        const { data: periodReports } = await supabase
          .from('reports')
          .select('total_sales, tip_out_amount, employee_id, pay_period_id, created_at')
          .eq('restaurant_id', restaurantId)
          .or(`pay_period_id.eq.${period.id},and(pay_period_id.is.null,created_at.gte.${periodStart},created_at.lte.${periodEnd})`)

        let periodTotalSales = 0, periodTotalTipOut = 0, periodMyTipOut = 0, periodMyReports = 0, periodMySales = 0
        for (const r of periodReports || []) {
          periodTotalSales  += parseFloat(r.total_sales)    || 0
          periodTotalTipOut += parseFloat(r.tip_out_amount) || 0
          if (r.employee_id === userId) {
            periodMySales   += parseFloat(r.total_sales)    || 0
            periodMyTipOut  += parseFloat(r.tip_out_amount) || 0
            periodMyReports += 1
          }
        }

        // Tips reçus dans la période (par pay_period_id ou par date)
        const { data: periodReceived } = await supabase
          .from('tip_distributions')
          .select('amount, pay_period_id, created_at')
          .eq('restaurant_id', restaurantId)
          .eq('to_employee_id', userId)
          .eq('is_meal_deduction', false)
          .or(`pay_period_id.eq.${period.id},and(pay_period_id.is.null,created_at.gte.${periodStart},created_at.lte.${periodEnd})`)

        const periodMyReceived = (periodReceived || []).reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)

        currentPeriodStats = {
          periodId:        period.id,
          startDate:       period.start_date,
          endDate:         period.end_date,
          status:          period.status,
          totalSales:      periodTotalSales,
          totalTipOut:     periodTotalTipOut,
          mySales:         periodMySales,
          myTipOut:        periodMyTipOut,
          myReportCount:   periodMyReports,
          myTipsReceived:  periodMyReceived
        }
      }
    } catch (e) {
      console.warn('Could not fetch current period stats:', e.message)
    }

    res.json({
      success: true,
      isManager,
      stats: {
        // Restaurant (tous) — visible manager
        totalSales,
        totalTipOut,
        pendingReports,
        validatedReports,
        totalReports: allReports?.length || 0,
        // Cumul personnel (tous les rapports de cet employé)
        myTotalSales,
        myTotalTipOut,
        myPendingReports,
        myValidatedReports,
        myTotalReports,
        // Personnels 24h
        myTipOutGiven,
        tipsReceivedToday,
        // Période courante
        currentPeriod: currentPeriodStats,
        // Rétrocompatibilité
        tipOutGiven: isManager ? totalTipOut : myTotalTipOut,
        totalTips: isManager ? totalTipOut : myTotalTipOut
      }
    })
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// ─────────────────────────────────────────────────────────────
// PUT /reports/:reportId/move-period
// Déplacer un rapport vers une autre période (manager seulement)
// ─────────────────────────────────────────────────────────────
export const moveReportPeriod = async (req, res) => {
  try {
    const { reportId } = req.params
    const { periodId } = req.body

    if (!periodId) {
      return res.status(400).json({ error: 'periodId requis' })
    }

    // Vérifier que le rapport existe
    const { data: report, error: reportErr } = await supabase
      .from('reports')
      .select('restaurant_id')
      .eq('id', reportId)
      .single()

    if (reportErr || !report) {
      return res.status(404).json({ error: 'Rapport introuvable' })
    }

    // Vérifier que le manager a accès à ce restaurant
    const { data: membership } = await supabase
      .from('user_restaurants')
      .select('role')
      .eq('user_id', req.user.id)
      .eq('restaurant_id', report.restaurant_id)
      .single()

    if (!membership || membership.role !== 'manager') {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    // Vérifier que la période cible appartient au même restaurant
    const { data: targetPeriod, error: periodErr } = await supabase
      .from('pay_periods')
      .select('id')
      .eq('id', periodId)
      .eq('restaurant_id', report.restaurant_id)
      .single()

    if (periodErr || !targetPeriod) {
      return res.status(404).json({ error: 'Période introuvable' })
    }

    // Mettre à jour le rapport et ses distributions
    await Promise.all([
      supabase.from('reports').update({ pay_period_id: periodId }).eq('id', reportId),
      supabase.from('tip_distributions').update({ pay_period_id: periodId }).eq('report_id', reportId)
    ])

    res.json({ success: true })
  } catch (error) {
    console.error('moveReportPeriod error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// ─────────────────────────────────────────────────────────────
// Helper: format report for API response
// ─────────────────────────────────────────────────────────────
function formatReport(report) {
  // Parse JSONB fields safely
  const parseJson = (field) => {
    if (!field) return []
    if (typeof field === 'object') return field
    try { return JSON.parse(field) } catch { return [] }
  }

  return {
    id:              report.id,
    restaurantId:    report.restaurant_id,
    employeeId:      report.employee_id,
    employeeName:    report.employee_name,
    employeeEmail:   report.employee_email,
    // Sales
    cashSales:       parseFloat(report.cash_sales)   || 0,
    cardSales:       parseFloat(report.card_sales)   || 0,
    otherSales:      parseFloat(report.other_sales)  || 0,
    totalSales:      parseFloat(report.total_sales)  || 0,
    // Tips
    cashTips:        parseFloat(report.cash_tips)    || 0,
    cardTips:        parseFloat(report.card_tips)    || 0,
    totalTips:       parseFloat(report.total_tips)   || 0,
    // Tip-out
    tipOutPercent:   parseFloat(report.tip_out_percent)  || 0,
    tipOutAmount:    parseFloat(report.tip_out_amount)   || 0,
    netTips:         parseFloat(report.net_tips)         || 0,
    // New system
    tipOutBreakdown:    parseJson(report.tip_out_breakdown),
    voluntaryDonations: parseJson(report.voluntary_donations),
    mealDeductions:     parseJson(report.meal_deductions),
    cashAmount:      parseFloat(report.cash_amount) || 0,
    dueBack:         parseFloat(report.due_back)    || 0,
    // Legacy
    cashInHand:      parseFloat(report.cash_in_hand)     || 0,
    expectedCash:    parseFloat(report.expected_cash)    || 0,
    difference:      parseFloat(report.difference)       || 0,
    // Proof photo
    proofImageBase64:  report.proof_image_base64 || null,
    // Manager submission
    submittedByManagerId:    report.submitted_by_manager_id || null,
    submittedForEmployeeId:  report.submitted_for_employee_id || null,
    // Status
    status:            report.status,
    validatedBy:       report.validated_by,
    validatedByName:   report.validated_by_name,
    validationNote:    report.validation_note,
    validatedAt:       report.validated_at,
    // Période de paie
    payPeriodId:       report.pay_period_id || null,
    // Timestamps
    createdAt:         report.created_at,
    updatedAt:         report.updated_at
  }
}
