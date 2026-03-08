import nodemailer from 'nodemailer'

// Create transporter
const createTransporter = () => {
  // Option 1 : SMTP personnalisé
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  }

  // Option 2 : Gmail via Nodemailer (NODEMAILER_EMAIL + NODEMAILER_PASSWORD)
  if (process.env.NODEMAILER_EMAIL && process.env.NODEMAILER_PASSWORD) {
    console.log('📬 Email service: Gmail (Nodemailer)')
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD
      }
    })
  }

  // Fallback dev : log dans la console
  console.log('⚠️  SMTP not configured - emails will be logged to console')
  return null
}

const transporter = createTransporter()

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    // If no transporter (dev mode), just log
    if (!transporter) {
      console.log('\n📧 ============ EMAIL ============')
      console.log(`To: ${to}`)
      console.log(`Subject: ${subject}`)
      console.log('----------------------------------')
      console.log(text || 'See HTML content')
      console.log('==================================\n')

      // Extract reset link from HTML for easy testing
      const linkMatch = html.match(/href="([^"]*reset-password[^"]*)"/);
      if (linkMatch) {
        console.log(`🔗 Reset Link: ${linkMatch[1]}\n`)
      }

      return { success: true, messageId: 'dev-mode' }
    }

    // Send actual email
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"ShiftClose" <${process.env.NODEMAILER_EMAIL || 'noreply@shiftclose.com'}>`,
      to,
      subject,
      html,
      text
    })

    console.log('Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email send error:', error)
    throw error
  }
}

export default { sendEmail }
