import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkUser() {
  const email = process.argv[2] || 'frranklinlontsi99@gmail.com'

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error) {
    console.error('Error:', error.message)
    return
  }

  console.log('User found:')
  console.log('  ID:', user.id)
  console.log('  Email:', user.email)
  console.log('  Name:', user.first_name, user.last_name)
  console.log('  Role:', user.role)
  console.log('  Status:', user.status)
}

checkUser()
