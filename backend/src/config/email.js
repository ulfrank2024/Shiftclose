import { Resend } from 'resend'

const FROM = 'ShiftClose <noreply@cheftips.app>'

export const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('⚠️  RESEND_API_KEY non configuré — email loggué seulement')
      console.log(`To: ${to}\nSubject: ${subject}`)
      return { success: true, messageId: 'dev-mode' }
    }
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html })
    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }
    console.log('Email sent via Resend:', data.id)
    return { success: true, messageId: data.id }
  } catch (err) {
    console.error('Email error:', err)
    return { success: false, error: err.message }
  }
}

export const emailTemplates = {
  invitation: (restaurantName, inviterName, inviteLink) => ({
    subject: `Invitation à rejoindre ${restaurantName} sur ShiftClose`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 20px; margin: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 40px; }
          .logo { text-align: center; margin-bottom: 30px; }
          .logo-text { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; font-size: 28px; font-weight: bold; padding: 16px 24px; border-radius: 16px; display: inline-block; }
          h1 { color: #f8fafc; text-align: center; margin-bottom: 24px; font-size: 24px; }
          p { color: #94a3b8; line-height: 1.7; font-size: 16px; margin: 16px 0; }
          .highlight { color: #f8fafc; font-weight: 600; }
          .button { display: block; width: fit-content; margin: 32px auto; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; }
          .footer { text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #334155; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo"><span class="logo-text">ShiftClose</span></div>
          <h1>Vous êtes invité(e) !</h1>
          <p>Bonjour,</p>
          <p><span class="highlight">${inviterName}</span> vous invite à rejoindre l'équipe de <span class="highlight">${restaurantName}</span> sur ShiftClose.</p>
          <p>ShiftClose est une application qui simplifie la gestion de vos Cash Out et pourboires en fin de service.</p>
          <a href="${inviteLink}" class="button" style="display:block;width:fit-content;margin:32px auto;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#ffffff !important;padding:16px 40px;text-decoration:none;border-radius:12px;font-weight:600;font-size:16px;">Accepter l'invitation</a>
          <p style="font-size: 14px; text-align: center;">Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email.</p>
          <div class="footer">
            <p>© 2026 ShiftClose - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  reportValidated: (employeeName, date, netTips) => ({
    subject: `Votre rapport du ${date} a été validé`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 20px; margin: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 40px; }
          .logo { text-align: center; margin-bottom: 30px; }
          .logo-text { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; font-size: 28px; font-weight: bold; padding: 16px 24px; border-radius: 16px; display: inline-block; }
          h1 { color: #10b981; text-align: center; margin-bottom: 24px; font-size: 24px; }
          p { color: #94a3b8; line-height: 1.7; font-size: 16px; margin: 16px 0; }
          .highlight-box { background-color: #0f172a; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0; }
          .label { color: #64748b; font-size: 14px; margin-bottom: 8px; }
          .amount { color: #10b981; font-size: 36px; font-weight: bold; }
          .footer { text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #334155; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo"><span class="logo-text">ShiftClose</span></div>
          <h1>Rapport validé ✓</h1>
          <p>Bonjour ${employeeName},</p>
          <p>Votre rapport de Cash Out du <strong style="color: #f8fafc;">${date}</strong> a été validé par votre manager.</p>
          <div class="highlight-box">
            <p class="label">Pourboires nets</p>
            <p class="amount">$${netTips}</p>
          </div>
          <p style="text-align: center;">Consultez l'application pour plus de détails.</p>
          <div class="footer">
            <p>© 2026 ShiftClose - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  reportRejected: (employeeName, date, reason, reportId) => {
    const appUrl = process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'https://cheftips.app'
    const editUrl = reportId ? `${appUrl}/cash-out?editReportId=${reportId}` : `${appUrl}/reports`
    return {
      subject: `Votre rapport du ${date} a été rejeté`,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
    <style>body{font-family:'Segoe UI',Arial,sans-serif;background-color:#0f172a;color:#f8fafc;padding:20px;margin:0}
    .c{max-width:600px;margin:0 auto;background:#1e293b;border-radius:16px;padding:40px}
    .logo-text{background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;font-size:20px;font-weight:bold;padding:14px 24px;border-radius:16px;display:inline-block}
    h1{color:#ef4444;text-align:center;margin-bottom:24px;font-size:24px}
    p{color:#94a3b8;line-height:1.7;font-size:16px;margin:16px 0}
    .reason{background:#0f172a;border-left:3px solid #ef4444;padding:16px 20px;border-radius:0 10px 10px 0;margin:20px 0}
    .btn{display:block;width:fit-content;margin:28px auto;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;padding:14px 32px;text-decoration:none;border-radius:12px;font-weight:600;font-size:15px}
    .footer{text-align:center;margin-top:40px;padding-top:24px;border-top:1px solid #334155;color:#64748b;font-size:14px}
    </style></head><body><div class="c">
    <div style="text-align:center;margin-bottom:30px"><span class="logo-text">ShiftClose</span></div>
    <h1>Rapport rejeté ✗</h1>
    <p>Bonjour <strong style="color:#f8fafc">${employeeName}</strong>,</p>
    <p>Votre rapport de Cash Out du <strong style="color:#f8fafc">${date}</strong> a été rejeté par votre manager.</p>
    ${reason ? `<div class="reason"><p style="margin:0;color:#fca5a5;font-size:14px"><strong>Raison :</strong> ${reason}</p></div>` : ''}
    <p>Vous pouvez corriger les informations et renvoyer votre rapport directement depuis l'application.</p>
    <a href="${editUrl}" class="btn">✏️ Modifier &amp; Renvoyer</a>
    <p style="text-align:center;font-size:13px">Les pourboires distribués dans ce rapport ont également été annulés.</p>
    <div class="footer"><p>© 2026 ShiftClose - Tous droits réservés</p></div>
    </div></body></html>`
    }
  },

  tipCancelled: (recipientName, senderName, date, amount, reason) => ({
    subject: `Pourboire annulé — ${senderName} · ${date}`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
    <style>body{font-family:'Segoe UI',Arial,sans-serif;background-color:#0f172a;color:#f8fafc;padding:20px;margin:0}
    .c{max-width:600px;margin:0 auto;background:#1e293b;border-radius:16px;padding:40px}
    .logo-text{background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;font-size:20px;font-weight:bold;padding:14px 24px;border-radius:16px;display:inline-block}
    h1{color:#f59e0b;text-align:center;margin-bottom:24px;font-size:22px}
    p{color:#94a3b8;line-height:1.7;font-size:16px;margin:16px 0}
    .amount-box{background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:14px;padding:20px;text-align:center;margin:20px 0}
    .reason{background:#0f172a;border-left:3px solid #f59e0b;padding:16px 20px;border-radius:0 10px 10px 0;margin:20px 0}
    .footer{text-align:center;margin-top:40px;padding-top:24px;border-top:1px solid #334155;color:#64748b;font-size:14px}
    </style></head><body><div class="c">
    <div style="text-align:center;margin-bottom:30px"><span class="logo-text">ShiftClose</span></div>
    <h1>⚠️ Pourboire annulé</h1>
    <p>Bonjour <strong style="color:#f8fafc">${recipientName}</strong>,</p>
    <p>Le pourboire que vous avez reçu de <strong style="color:#f8fafc">${senderName}</strong> du <strong style="color:#f8fafc">${date}</strong> a été annulé suite au rejet de son rapport.</p>
    <div class="amount-box">
      <p style="color:#94a3b8;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:.06em">Montant annulé</p>
      <p style="color:#ef4444;font-size:36px;font-weight:900;margin:0;text-decoration:line-through">$${parseFloat(amount).toFixed(2)}</p>
    </div>
    ${reason ? `<div class="reason"><p style="margin:0;color:#fcd34d;font-size:14px"><strong>Raison :</strong> ${reason}</p></div>` : ''}
    <p>Ce montant a été retiré de votre total de pourboires reçus.</p>
    <div class="footer"><p>© 2026 ShiftClose - Tous droits réservés</p></div>
    </div></body></html>`
  }),

  restaurantSetup: (restaurantName, setupLink) => ({
    subject: `ShiftClose — Configurez votre restaurant "${restaurantName}"`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 20px; margin: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 40px; }
          .logo { text-align: center; margin-bottom: 30px; }
          .logo-text { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; font-size: 28px; font-weight: bold; padding: 16px 24px; border-radius: 16px; display: inline-block; }
          h1 { color: #f8fafc; text-align: center; margin-bottom: 8px; font-size: 24px; }
          .subtitle { text-align: center; color: #94a3b8; margin-bottom: 28px; font-size: 15px; }
          p { color: #94a3b8; line-height: 1.7; font-size: 16px; margin: 16px 0; }
          .highlight { color: #f8fafc; font-weight: 600; }
          .steps { background-color: #0f172a; padding: 24px; border-radius: 12px; margin: 24px 0; }
          .step { display: flex; align-items: flex-start; margin: 14px 0; }
          .step-num { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; flex-shrink: 0; margin-right: 14px; margin-top: 2px; }
          .step-text { color: #cbd5e1; font-size: 15px; line-height: 1.5; }
          .button { display: block; width: fit-content; margin: 32px auto; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; }
          .expiry { text-align: center; color: #64748b; font-size: 13px; margin-top: 16px; }
          .footer { text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #334155; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo"><span class="logo-text">ShiftClose</span></div>
          <h1>Bienvenue sur ShiftClose !</h1>
          <p class="subtitle">Votre restaurant <span class="highlight">"${restaurantName}"</span> vous attend</p>
          <p>L'équipe ShiftClose vous invite à configurer votre espace restaurant. En quelques minutes, vous serez prêt(e) à gérer vos Cash Out et pourboires.</p>
          <div class="steps">
            <div class="step">
              <div class="step-num">1</div>
              <div class="step-text">Créez votre compte Manager en renseignant vos informations personnelles</div>
            </div>
            <div class="step">
              <div class="step-num">2</div>
              <div class="step-text">Votre restaurant <strong style="color:#f8fafc">"${restaurantName}"</strong> sera automatiquement créé</div>
            </div>
            <div class="step">
              <div class="step-num">3</div>
              <div class="step-text">Invitez votre équipe et commencez à utiliser ShiftClose dès aujourd'hui</div>
            </div>
          </div>
          <a href="${setupLink}" class="button">Configurer mon restaurant →</a>
          <p class="expiry">⏱ Ce lien expire dans 7 jours.</p>
          <p style="font-size: 14px; text-align: center; color: #475569;">Si vous n'attendiez pas cet email, vous pouvez l'ignorer.</p>
          <div class="footer">
            <p>© 2026 ShiftClose - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  welcomeEmployee: (firstName, restaurantName, inviterName, appLink) => ({
    subject: `Bienvenue dans l'équipe ${restaurantName} sur ShiftClose !`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family:'Segoe UI',Arial,sans-serif;background-color:#0f172a;color:#f8fafc;padding:20px;margin:0;">
        <div style="max-width:600px;margin:0 auto;background-color:#1e293b;border-radius:16px;padding:40px;">
          <div style="text-align:center;margin-bottom:30px;">
            <span style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#ffffff;font-size:20px;font-weight:bold;padding:14px 24px;border-radius:16px;display:inline-block;">ShiftClose</span>
          </div>
          <h1 style="color:#10b981;text-align:center;margin-bottom:24px;font-size:24px;">🎉 Bienvenue dans l'équipe !</h1>
          <p style="color:#94a3b8;line-height:1.7;font-size:16px;margin:16px 0;">Bonjour <strong style="color:#f8fafc;">${firstName}</strong>,</p>
          <p style="color:#94a3b8;line-height:1.7;font-size:16px;margin:16px 0;">
            <strong style="color:#f8fafc;">${inviterName}</strong> vient de vous ajouter à l'équipe de
            <strong style="color:#f8fafc;">${restaurantName}</strong> sur ShiftClose. Vous êtes maintenant prêt(e) à gérer vos Cash Out et pourboires.
          </p>
          <div style="background-color:#0f172a;border-radius:12px;padding:24px;margin:24px 0;">
            <div style="display:flex;align-items:center;margin:10px 0;color:#f8fafc;font-size:15px;">
              <span style="color:#10b981;margin-right:12px;font-size:18px;">✓</span> Soumettez vos rapports de Cash Out en quelques clics
            </div>
            <div style="display:flex;align-items:center;margin:10px 0;color:#f8fafc;font-size:15px;">
              <span style="color:#10b981;margin-right:12px;font-size:18px;">✓</span> Suivez vos pourboires reçus en temps réel
            </div>
            <div style="display:flex;align-items:center;margin:10px 0;color:#f8fafc;font-size:15px;">
              <span style="color:#10b981;margin-right:12px;font-size:18px;">✓</span> Consultez l'historique de vos rapports validés
            </div>
          </div>
          <a href="${appLink}" style="display:block;width:fit-content;margin:32px auto;background:linear-gradient(135deg,#10b981,#059669);color:#ffffff !important;padding:16px 40px;text-decoration:none;border-radius:12px;font-weight:600;font-size:16px;">Accéder à ShiftClose</a>
          <div style="text-align:center;margin-top:40px;padding-top:24px;border-top:1px solid #334155;color:#64748b;font-size:14px;">
            <p>© 2026 ShiftClose - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Email au manager quand un serveur soumet un rapport
  reportSubmitted: (managerName, employeeName, restaurantName, date, time, totalSales, tipOutTotal, dueBack, distributions) => {
    const dbColor  = dueBack > 0 ? '#ef4444' : dueBack < 0 ? '#10b981' : '#94a3b8'
    const dbLabel  = dueBack > 0 ? 'À remettre au gérant' : dueBack < 0 ? 'Le gérant doit à l\'employé' : 'Caisse équilibrée'
    const distRows = distributions.map(d =>
      `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #334155;color:#e2e8f0;">${d.personName}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #334155;color:#94a3b8;">${d.position || d.role || ''} · ${(d.percentage || 0).toFixed(1)}%</td>
        <td style="padding:8px 12px;border-bottom:1px solid #334155;color:#34d399;font-weight:700;text-align:right;">$${(d.amount || 0).toFixed(2)}</td>
      </tr>`
    ).join('')
    return {
      subject: `📋 Nouveau rapport — ${employeeName} · ${restaurantName}`,
      html: `
        <!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
        <body style="font-family:'Segoe UI',Arial,sans-serif;background-color:#0f172a;color:#f8fafc;padding:20px;margin:0;">
          <div style="max-width:600px;margin:0 auto;background-color:#1e293b;border-radius:16px;padding:40px;">
            <div style="text-align:center;margin-bottom:28px;">
              <span style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;font-size:18px;font-weight:bold;padding:12px 20px;border-radius:14px;display:inline-block;">ShiftClose</span>
            </div>
            <h1 style="color:#f8fafc;text-align:center;margin-bottom:6px;font-size:22px;">Nouveau rapport soumis</h1>
            <p style="color:#64748b;text-align:center;margin-bottom:28px;font-size:14px;">${restaurantName}</p>

            <div style="background:#0f172a;border-radius:12px;padding:20px;margin-bottom:20px;">
              <p style="color:#94a3b8;margin:0 0 16px;font-size:14px;">Bonjour <strong style="color:#f8fafc;">${managerName}</strong>,</p>
              <p style="color:#94a3b8;margin:0;font-size:14px;">
                <strong style="color:#f8fafc;">${employeeName}</strong> vient de soumettre son rapport de Cash Out du
                <strong style="color:#f8fafc;">${date}</strong> à <strong style="color:#f8fafc;">${time}</strong>.
              </p>
            </div>

            <!-- Résumé financier -->
            <div style="background:#0f172a;border-radius:12px;padding:20px;margin-bottom:20px;">
              <p style="color:#475569;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;">Résumé financier</p>
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:8px 0;color:#94a3b8;font-size:14px;">Ventes totales</td>
                  <td style="padding:8px 0;color:#f8fafc;font-weight:700;font-size:15px;text-align:right;">$${(totalSales || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#94a3b8;font-size:14px;">Tip-Out total</td>
                  <td style="padding:8px 0;color:#fbbf24;font-weight:700;font-size:15px;text-align:right;">-$${(tipOutTotal || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0 0;border-top:1px solid #334155;color:#94a3b8;font-size:14px;">${dbLabel}</td>
                  <td style="padding:10px 0 0;border-top:1px solid #334155;color:${dbColor};font-weight:800;font-size:20px;text-align:right;">$${Math.abs(dueBack || 0).toFixed(2)}</td>
                </tr>
              </table>
            </div>

            ${distRows ? `
            <!-- Distributions -->
            <div style="background:#0f172a;border-radius:12px;overflow:hidden;margin-bottom:24px;">
              <p style="color:#475569;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin:0;padding:14px 16px;border-bottom:1px solid #334155;">Distributions Tip-Out</p>
              <table style="width:100%;border-collapse:collapse;">
                <thead>
                  <tr style="background:#1e293b;">
                    <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;">Bénéficiaire</th>
                    <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;">Rôle</th>
                    <th style="padding:8px 12px;text-align:right;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;">Montant</th>
                  </tr>
                </thead>
                <tbody>${distRows}</tbody>
              </table>
            </div>` : ''}

            <a href="${process.env.FRONTEND_URL}/reports" style="display:block;width:fit-content;margin:0 auto 24px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#ffffff !important;padding:14px 36px;text-decoration:none;border-radius:12px;font-weight:600;font-size:15px;">Valider le rapport →</a>
            <div style="text-align:center;padding-top:24px;border-top:1px solid #334155;color:#64748b;font-size:13px;">© 2026 ShiftClose</div>
          </div>
        </body></html>`
    }
  },

  // Email à l'employé quand il reçoit des pourboires
  tipsReceived: (recipientName, senderName, restaurantName, date, items, totalAmount) => {
    const rows = items.map(item =>
      `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #334155;color:#e2e8f0;">${item.role || 'Tip'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #334155;color:#94a3b8;">${(item.percentage || 0).toFixed(1)}%</td>
        <td style="padding:8px 12px;border-bottom:1px solid #334155;color:#34d399;font-weight:700;text-align:right;">+$${(item.amount || 0).toFixed(2)}</td>
      </tr>`
    ).join('')
    return {
      subject: `💰 Vous avez reçu des pourboires — ${restaurantName}`,
      html: `
        <!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
        <body style="font-family:'Segoe UI',Arial,sans-serif;background-color:#0f172a;color:#f8fafc;padding:20px;margin:0;">
          <div style="max-width:600px;margin:0 auto;background-color:#1e293b;border-radius:16px;padding:40px;">
            <div style="text-align:center;margin-bottom:28px;">
              <span style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-size:26px;font-weight:bold;padding:14px 22px;border-radius:14px;display:inline-block;">$</span>
            </div>
            <h1 style="color:#10b981;text-align:center;margin-bottom:6px;font-size:22px;">Pourboires reçus 🎉</h1>
            <p style="color:#64748b;text-align:center;margin-bottom:28px;font-size:14px;">${restaurantName} · ${date}</p>

            <div style="background:#0f172a;border-radius:12px;padding:20px;margin-bottom:20px;">
              <p style="color:#94a3b8;margin:0;font-size:14px;">
                Bonjour <strong style="color:#f8fafc;">${recipientName}</strong>,<br><br>
                <strong style="color:#f8fafc;">${senderName}</strong> vous a inclus·e dans son tip-out du <strong style="color:#f8fafc;">${date}</strong>.
              </p>
            </div>

            <!-- Montant total -->
            <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:14px;padding:24px;text-align:center;margin-bottom:20px;">
              <p style="color:#6ee7b7;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Total reçu</p>
              <p style="color:#10b981;font-size:44px;font-weight:900;margin:0;letter-spacing:-1px;">$${(totalAmount || 0).toFixed(2)}</p>
            </div>

            ${rows ? `
            <div style="background:#0f172a;border-radius:12px;overflow:hidden;margin-bottom:24px;">
              <p style="color:#475569;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin:0;padding:14px 16px;border-bottom:1px solid #334155;">Détail</p>
              <table style="width:100%;border-collapse:collapse;">
                <tbody>${rows}</tbody>
              </table>
            </div>` : ''}

            <a href="${process.env.FRONTEND_URL}/my-tips" style="display:block;width:fit-content;margin:0 auto 24px;background:linear-gradient(135deg,#10b981,#059669);color:#ffffff !important;padding:14px 36px;text-decoration:none;border-radius:12px;font-weight:600;font-size:15px;">Voir mes pourboires →</a>
            <div style="text-align:center;padding-top:24px;border-top:1px solid #334155;color:#64748b;font-size:13px;">© 2026 ShiftClose</div>
          </div>
        </body></html>`
    }
  },

  welcomeUser: (firstName) => ({
    subject: `Bienvenue sur ShiftClose !`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 20px; margin: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 40px; }
          .logo { text-align: center; margin-bottom: 30px; }
          .logo-text { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; font-size: 28px; font-weight: bold; padding: 16px 24px; border-radius: 16px; display: inline-block; }
          h1 { color: #f8fafc; text-align: center; margin-bottom: 24px; font-size: 24px; }
          p { color: #94a3b8; line-height: 1.7; font-size: 16px; margin: 16px 0; }
          .features { background-color: #0f172a; padding: 24px; border-radius: 12px; margin: 24px 0; }
          .feature { display: flex; align-items: center; margin: 12px 0; color: #f8fafc; }
          .check { color: #10b981; margin-right: 12px; font-size: 18px; }
          .button { display: block; width: fit-content; margin: 32px auto; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; }
          .footer { text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #334155; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo"><span class="logo-text">ShiftClose</span></div>
          <h1>Bienvenue ${firstName} !</h1>
          <p>Merci d'avoir rejoint ShiftClose. Votre compte est maintenant actif et prêt à l'emploi.</p>
          <div class="features">
            <div class="feature"><span class="check">✓</span> Calculez vos pourboires en quelques clics</div>
            <div class="feature"><span class="check">✓</span> Équilibrez votre caisse facilement</div>
            <div class="feature"><span class="check">✓</span> Suivez votre historique de rapports</div>
          </div>
          <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Accéder à l'application</a>
          <div class="footer">
            <p>© 2026 ShiftClose - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
}

export default { sendEmail }
