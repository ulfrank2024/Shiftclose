import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

// Gmail transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD
  }
})

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error.message)
  } else {
    console.log('✅ Email server ready')
  }
})

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"ShiftClose" <${process.env.NODEMAILER_EMAIL}>`,
      to,
      subject,
      html
    })
    console.log('Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email error:', error)
    return { success: false, error: error.message }
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
          <div class="logo"><span class="logo-text">S</span></div>
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
          <div class="logo"><span class="logo-text">S</span></div>
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
            <span style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#ffffff;font-size:28px;font-weight:bold;padding:16px 24px;border-radius:16px;display:inline-block;">S</span>
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
          <div class="logo"><span class="logo-text">S</span></div>
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

export default transporter
