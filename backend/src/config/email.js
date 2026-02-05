import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"ShiftClose" <${process.env.SMTP_USER}>`,
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
        <style>
          body { font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; padding: 30px; }
          .logo { text-align: center; margin-bottom: 30px; }
          .logo span { background-color: #3b82f6; color: white; font-size: 32px; font-weight: bold; padding: 15px 20px; border-radius: 12px; }
          h1 { color: #f8fafc; text-align: center; }
          p { color: #94a3b8; line-height: 1.6; }
          .button { display: block; width: fit-content; margin: 30px auto; background-color: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
          .button:hover { background-color: #2563eb; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo"><span>S</span></div>
          <h1>Vous êtes invité(e) !</h1>
          <p>Bonjour,</p>
          <p><strong>${inviterName}</strong> vous invite à rejoindre l'équipe de <strong>${restaurantName}</strong> sur ShiftClose.</p>
          <p>ShiftClose est une application qui simplifie la gestion de vos Cash Out et pourboires en fin de service.</p>
          <a href="${inviteLink}" class="button">Accepter l'invitation</a>
          <p>Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email.</p>
          <div class="footer">
            <p>© 2024 ShiftClose - Tous droits réservés</p>
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
        <style>
          body { font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; padding: 30px; }
          .logo { text-align: center; margin-bottom: 30px; }
          .logo span { background-color: #3b82f6; color: white; font-size: 32px; font-weight: bold; padding: 15px 20px; border-radius: 12px; }
          h1 { color: #10b981; text-align: center; }
          p { color: #94a3b8; line-height: 1.6; }
          .highlight { background-color: #0f172a; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .amount { color: #10b981; font-size: 32px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo"><span>S</span></div>
          <h1>Rapport validé ✓</h1>
          <p>Bonjour ${employeeName},</p>
          <p>Votre rapport de Cash Out du <strong>${date}</strong> a été validé par votre manager.</p>
          <div class="highlight">
            <p style="margin: 0; color: #64748b;">Pourboires nets</p>
            <p class="amount">$${netTips}</p>
          </div>
          <p>Consultez l'application pour plus de détails.</p>
          <div class="footer">
            <p>© 2024 ShiftClose - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
}

export default transporter
