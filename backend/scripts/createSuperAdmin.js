import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createSuperAdmin() {
  const email = process.argv[2]
  const password = process.argv[3]
  const firstName = process.argv[4] || 'Super'
  const lastName = process.argv[5] || 'Admin'

  if (!email || !password) {
    console.error('Usage: node scripts/createSuperAdmin.js <email> <password> [firstName] [lastName]')
    process.exit(1)
  }

  try {
    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      console.error('❌ Un utilisateur avec cet email existe déjà.')
      process.exit(1)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create super admin
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        role: 'superadmin',
        status: 'active'
      })
      .select()
      .single()

    if (error) throw error

    console.log('✅ Super Admin créé avec succès!')
    console.log(`   Email: ${email}`)
    console.log(`   Nom: ${firstName} ${lastName}`)
    console.log(`   ID: ${user.id}`)

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  }
}

createSuperAdmin()
