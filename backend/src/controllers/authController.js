import bcrypt from 'bcryptjs'
import { db } from '../config/firebase.js'
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
    const existingUser = await db.collection('users')
      .where('email', '==', email.toLowerCase())
      .get()

    if (!existingUser.empty) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create user document
    const userData = {
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      role: 'server', // Default role
      restaurants: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const docRef = await db.collection('users').add(userData)

    // Generate JWT token
    const token = generateToken(docRef.id)

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = userData

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      token,
      user: {
        id: docRef.id,
        ...userWithoutPassword
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
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email.toLowerCase())
      .get()

    if (usersSnapshot.empty) {
      return res.status(401).json({ error: 'Identifiants incorrects' })
    }

    const userDoc = usersSnapshot.docs[0]
    const userData = userDoc.data()

    // Compare password
    const isMatch = await bcrypt.compare(password, userData.password)

    if (!isMatch) {
      return res.status(401).json({ error: 'Identifiants incorrects' })
    }

    // Generate JWT token
    const token = generateToken(userDoc.id)

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = userData

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: userDoc.id,
        ...userWithoutPassword
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
      user: userWithoutPassword
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

    const updateData = {
      updatedAt: new Date()
    }

    if (firstName) updateData.firstName = firstName
    if (lastName) updateData.lastName = lastName
    if (phone) updateData.phone = phone

    await db.collection('users').doc(req.user.id).update(updateData)

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

    await db.collection('users').doc(req.user.id).update({
      password: hashedPassword,
      updatedAt: new Date()
    })

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
    const snapshot = await db.collection('users').get()
    const users = []

    snapshot.forEach(doc => {
      const { password, ...userData } = doc.data()
      users.push({ id: doc.id, ...userData })
    })

    res.json({ success: true, users })
  } catch (error) {
    console.error('Get all users error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}
