import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { supabase } from '../config/supabase.js'
import { generateToken } from '../middleware/auth.js'
import { sendEmail } from '../services/emailService.js'

// Register new manager with restaurant
export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, restaurantName, restaurantAddress } = req.body

    // Validate input
    if (!email || !password || !firstName || !lastName || !restaurantName) {
      return res.status(400).json({ error: 'Tous les champs obligatoires sont requis' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create user as manager
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        role: 'manager'
      })
      .select()
      .single()

    if (userError) {
      console.error('Create user error:', userError)
      return res.status(500).json({ error: 'Erreur lors de la création du compte' })
    }

    // Create restaurant
    const { data: newRestaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .insert({
        name: restaurantName,
        address: restaurantAddress || null,
        created_by: newUser.id
      })
      .select()
      .single()

    if (restaurantError) {
      console.error('Create restaurant error:', restaurantError)
      // Rollback: delete the user
      await supabase.from('users').delete().eq('id', newUser.id)
      return res.status(500).json({ error: 'Erreur lors de la création du restaurant' })
    }

    // Link user to restaurant as manager
    const { error: linkError } = await supabase
      .from('user_restaurants')
      .insert({
        user_id: newUser.id,
        restaurant_id: newRestaurant.id,
        role: 'manager'
      })

    if (linkError) {
      console.error('Link user to restaurant error:', linkError)
    }

    // Generate JWT token
    const token = generateToken(newUser.id)

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = newUser

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      token,
      user: {
        ...userWithoutPassword,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        restaurants: [{
          id: newRestaurant.id,
          name: newRestaurant.name,
          role: 'manager'
        }]
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Register employee (via invitation - no restaurant)
export const registerEmployee = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Tous les champs sont requis' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create user as server (employee)
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        role: 'server'
      })
      .select()
      .single()

    if (error) {
      console.error('Create user error:', error)
      return res.status(500).json({ error: 'Erreur lors de la création du compte' })
    }

    // Generate JWT token
    const token = generateToken(newUser.id)

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = newUser

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      token,
      user: {
        ...userWithoutPassword,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        restaurants: []
      }
    })
  } catch (error) {
    console.error('Register employee error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' })
    }

    // Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (error || !user) {
      return res.status(401).json({ error: 'Identifiants incorrects' })
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(401).json({ error: 'Identifiants incorrects' })
    }

    // Get user's restaurants
    const { data: userRestaurants } = await supabase
      .from('user_restaurants')
      .select(`
        restaurant_id,
        role,
        restaurants (
          id,
          name
        )
      `)
      .eq('user_id', user.id)

    // Format restaurants
    const restaurants = userRestaurants?.map(ur => ({
      id: ur.restaurant_id,
      name: ur.restaurants?.name,
      role: ur.role
    })) || []

    // Generate JWT token
    const token = generateToken(user.id)

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        ...userWithoutPassword,
        firstName: user.first_name,
        lastName: user.last_name,
        restaurants
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const { password, ...userWithoutPassword } = req.user

    // Get user's restaurants
    const { data: userRestaurants } = await supabase
      .from('user_restaurants')
      .select(`
        restaurant_id,
        role,
        restaurants (
          id,
          name
        )
      `)
      .eq('user_id', req.user.id)

    // Format restaurants
    const restaurants = userRestaurants?.map(ur => ({
      id: ur.restaurant_id,
      name: ur.restaurants?.name,
      role: ur.role
    })) || []

    res.json({
      success: true,
      user: {
        ...userWithoutPassword,
        firstName: req.user.first_name,
        lastName: req.user.last_name,
        role: req.user.role, // Explicitly include role
        restaurants
      }
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body

    const updateData = {}
    if (firstName) updateData.first_name = firstName
    if (lastName) updateData.last_name = lastName
    if (phone) updateData.phone = phone

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.user.id)

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la mise à jour' })
    }

    res.json({
      success: true,
      message: 'Profil mis à jour'
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mot de passe actuel et nouveau requis' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' })
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, req.user.password)

    if (!isMatch) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' })
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    const { error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', req.user.id)

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la modification' })
    }

    res.json({
      success: true,
      message: 'Mot de passe modifié'
    })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Get all users (Super Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, status, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la récupération' })
    }

    // Format response
    const formattedUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      role: u.role,
      status: u.status,
      createdAt: u.created_at
    }))

    res.json({ success: true, users: formattedUsers })
  } catch (error) {
    console.error('Get all users error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Forgot password - send reset email
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email requis' })
    }

    // Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, first_name')
      .eq('email', email.toLowerCase())
      .single()

    // Always return success to prevent email enumeration
    if (error || !user) {
      return res.json({
        success: true,
        message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation'
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour

    // Save reset token to database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry.toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Update reset token error:', updateError)
      return res.status(500).json({ error: 'Erreur serveur' })
    }

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`

    await sendEmail({
      to: user.email,
      subject: 'ShiftClose - Réinitialisation de mot de passe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">ShiftClose</h1>
          </div>
          <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #1e293b;">Bonjour ${user.first_name},</h2>
            <p style="color: #475569; line-height: 1.6;">
              Vous avez demandé la réinitialisation de votre mot de passe ShiftClose.
            </p>
            <p style="color: #475569; line-height: 1.6;">
              Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Réinitialiser mon mot de passe
              </a>
            </div>
            <p style="color: #64748b; font-size: 14px;">
              Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} ShiftClose. Tous droits réservés.
            </p>
          </div>
        </div>
      `
    })

    res.json({
      success: true,
      message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation'
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Reset password with token
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body

    if (!token || !password) {
      return res.status(400).json({ error: 'Token et mot de passe requis' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' })
    }

    // Find user with valid reset token
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, reset_token, reset_token_expiry')
      .eq('reset_token', token)
      .single()

    if (error || !user) {
      return res.status(400).json({ error: 'Lien de réinitialisation invalide ou expiré' })
    }

    // Check if token is expired
    if (new Date(user.reset_token_expiry) < new Date()) {
      return res.status(400).json({ error: 'Ce lien de réinitialisation a expiré' })
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Update password and clear reset token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expiry: null
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Reset password error:', updateError)
      return res.status(500).json({ error: 'Erreur lors de la réinitialisation' })
    }

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}
