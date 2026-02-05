import bcrypt from 'bcryptjs'
import { supabase } from '../config/supabase.js'
import { generateToken } from '../middleware/auth.js'

// Register new user
export const register = async (req, res) => {
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

    // Create user
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
    console.error('Register error:', error)
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

    res.json({
      success: true,
      user: {
        ...userWithoutPassword,
        firstName: req.user.first_name,
        lastName: req.user.last_name
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
