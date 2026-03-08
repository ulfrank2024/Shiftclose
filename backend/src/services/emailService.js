import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'ChefTips <noreply@cheftips.app>'

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('\n📧 ============ EMAIL (dev) ============')
      console.log(`To: ${to}`)
      console.log(`Subject: ${subject}`)
      if (text) console.log(text)
      const linkMatch = html && html.match(/href="([^"]*reset-password[^"]*)"/);
      if (linkMatch) console.log(`🔗 Reset Link: ${linkMatch[1]}`)
      console.log('=======================================\n')
      return { success: true, messageId: 'dev-mode' }
    }

    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html })
    if (error) {
      console.error('Resend error:', error)
      throw new Error(error.message)
    }
    console.log('Email sent via Resend:', data.id)
    return { success: true, messageId: data.id }
  } catch (err) {
    console.error('Email send error:', err)
    throw err
  }
}

export default { sendEmail }
