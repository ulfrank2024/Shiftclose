import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function resetPassword() {
  const email = process.argv[2] || 'frranklinlontsi99@gmail.com'
  const newPassword = process.argv[3] || '123qwe'

  try {
    // Check if user exists
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .single()

    if (findError || !user) {
      console.error('❌ Utilisateur non trouvé:', email)
      process.exit(1)
    }

    console.log('Utilisateur trouvé:', user.email, '- Role:', user.role)

    // Hash new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', user.id)

    if (updateError) {
      console.error('❌ Erreur:', updateError.message)
      process.exit(1)
    }

    console.log('✅ Mot de passe réinitialisé avec succès!')
    console.log('   Email:', email)
    console.log('   Nouveau mot de passe:', newPassword)

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  }
}

resetPassword()
