import { auth, db } from '../config/firebase.js'

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        uid: req.user.uid,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
        restaurants: req.user.restaurants || []
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

    await db.collection('users').doc(req.user.uid).update({
      firstName,
      lastName,
      phone,
      updatedAt: new Date()
    })

    res.json({
      success: true,
      message: 'Profil mis à jour'
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Create new user (called after Firebase Auth signup)
export const createUser = async (req, res) => {
  try {
    const { uid, email, firstName, lastName } = req.body

    const userData = {
      email,
      firstName,
      lastName,
      role: 'server',
      restaurants: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await db.collection('users').doc(uid).set(userData)

    res.status(201).json({
      success: true,
      user: { uid, ...userData }
    })
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Get all users (Super Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const snapshot = await db.collection('users').get()
    const users = []

    snapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() })
    })

    res.json({ success: true, users })
  } catch (error) {
    console.error('Get all users error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}
