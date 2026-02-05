import { db } from '../config/firebase.js'
import { sendEmail, emailTemplates } from '../config/email.js'
import crypto from 'crypto'

// Send invitation to join restaurant
export const sendInvitation = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const { email, role } = req.body

    if (!email || !role) {
      return res.status(400).json({ error: 'Email et rôle requis' })
    }

    if (!['server', 'manager'].includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide' })
    }

    // Get restaurant info
    const restaurantDoc = await db.collection('restaurants').doc(restaurantId).get()
    if (!restaurantDoc.exists) {
      return res.status(404).json({ error: 'Restaurant non trouvé' })
    }
    const restaurant = restaurantDoc.data()

    // Check if user already exists and is already a member
    const existingUserSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get()

    if (!existingUserSnapshot.empty) {
      const existingUser = existingUserSnapshot.docs[0].data()
      const alreadyMember = existingUser.restaurants?.some(r => r.id === restaurantId)
      if (alreadyMember) {
        return res.status(400).json({ error: 'Cet utilisateur est déjà membre du restaurant' })
      }
    }

    // Check if invitation already exists
    const existingInviteSnapshot = await db.collection('invitations')
      .where('email', '==', email)
      .where('restaurantId', '==', restaurantId)
      .where('status', '==', 'pending')
      .get()

    if (!existingInviteSnapshot.empty) {
      return res.status(400).json({ error: 'Une invitation est déjà en attente pour cet email' })
    }

    // Create invitation token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    const invitationData = {
      email,
      restaurantId,
      restaurantName: restaurant.name,
      role,
      token,
      status: 'pending',
      invitedBy: req.user.uid,
      invitedByName: `${req.user.firstName} ${req.user.lastName}`,
      expiresAt,
      createdAt: new Date()
    }

    await db.collection('invitations').add(invitationData)

    // Send invitation email
    const inviteLink = `${process.env.FRONTEND_URL}/invite/${token}`
    const template = emailTemplates.invitation(
      restaurant.name,
      `${req.user.firstName} ${req.user.lastName}`,
      inviteLink
    )

    await sendEmail({
      to: email,
      ...template
    })

    res.status(201).json({
      success: true,
      message: 'Invitation envoyée'
    })
  } catch (error) {
    console.error('Send invitation error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Accept invitation
export const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params

    // Find invitation
    const snapshot = await db.collection('invitations')
      .where('token', '==', token)
      .where('status', '==', 'pending')
      .get()

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Invitation non trouvée ou expirée' })
    }

    const inviteDoc = snapshot.docs[0]
    const invitation = inviteDoc.data()

    // Check expiry
    if (invitation.expiresAt.toDate() < new Date()) {
      await inviteDoc.ref.update({ status: 'expired' })
      return res.status(400).json({ error: 'Invitation expirée' })
    }

    // Check if user email matches
    if (req.user.email !== invitation.email) {
      return res.status(403).json({ error: 'Cette invitation n\'est pas pour cet utilisateur' })
    }

    // Add restaurant to user
    const userRestaurants = req.user.restaurants || []
    userRestaurants.push({
      id: invitation.restaurantId,
      name: invitation.restaurantName,
      role: invitation.role
    })

    await db.collection('users').doc(req.user.uid).update({
      restaurants: userRestaurants,
      updatedAt: new Date()
    })

    // Update invitation status
    await inviteDoc.ref.update({
      status: 'accepted',
      acceptedAt: new Date(),
      acceptedBy: req.user.uid
    })

    res.json({
      success: true,
      message: 'Invitation acceptée',
      restaurant: {
        id: invitation.restaurantId,
        name: invitation.restaurantName,
        role: invitation.role
      }
    })
  } catch (error) {
    console.error('Accept invitation error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Get invitation info (public - for preview)
export const getInvitationInfo = async (req, res) => {
  try {
    const { token } = req.params

    const snapshot = await db.collection('invitations')
      .where('token', '==', token)
      .where('status', '==', 'pending')
      .get()

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Invitation non trouvée ou expirée' })
    }

    const invitation = snapshot.docs[0].data()

    // Check expiry
    if (invitation.expiresAt.toDate() < new Date()) {
      return res.status(400).json({ error: 'Invitation expirée' })
    }

    res.json({
      success: true,
      invitation: {
        restaurantName: invitation.restaurantName,
        role: invitation.role,
        invitedByName: invitation.invitedByName,
        email: invitation.email
      }
    })
  } catch (error) {
    console.error('Get invitation info error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Get pending invitations for a restaurant
export const getPendingInvitations = async (req, res) => {
  try {
    const { restaurantId } = req.params

    const snapshot = await db.collection('invitations')
      .where('restaurantId', '==', restaurantId)
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get()

    const invitations = []
    snapshot.forEach(doc => {
      const data = doc.data()
      invitations.push({
        id: doc.id,
        email: data.email,
        role: data.role,
        invitedByName: data.invitedByName,
        createdAt: data.createdAt?.toDate(),
        expiresAt: data.expiresAt?.toDate()
      })
    })

    res.json({ success: true, invitations })
  } catch (error) {
    console.error('Get pending invitations error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Cancel invitation
export const cancelInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params

    await db.collection('invitations').doc(invitationId).update({
      status: 'cancelled',
      cancelledAt: new Date()
    })

    res.json({
      success: true,
      message: 'Invitation annulée'
    })
  } catch (error) {
    console.error('Cancel invitation error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}
