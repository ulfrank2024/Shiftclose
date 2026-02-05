import { supabase } from '../config/supabase.js'
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
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single()

    if (restaurantError || !restaurant) {
      return res.status(404).json({ error: 'Restaurant non trouvé' })
    }

    // Check if user already exists and is already a member
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      const { data: existingMembership } = await supabase
        .from('user_restaurants')
        .select('id')
        .eq('user_id', existingUser.id)
        .eq('restaurant_id', restaurantId)
        .single()

      if (existingMembership) {
        return res.status(400).json({ error: 'Cet utilisateur est déjà membre du restaurant' })
      }
    }

    // Check if invitation already exists
    const { data: existingInvite } = await supabase
      .from('invitations')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('restaurant_id', restaurantId)
      .eq('status', 'pending')
      .single()

    if (existingInvite) {
      return res.status(400).json({ error: 'Une invitation est déjà en attente pour cet email' })
    }

    // Create invitation token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    const invitationData = {
      email: email.toLowerCase(),
      restaurant_id: restaurantId,
      restaurant_name: restaurant.name,
      role,
      token,
      status: 'pending',
      invited_by: req.user.id,
      invited_by_name: `${req.user.first_name} ${req.user.last_name}`,
      expires_at: expiresAt.toISOString()
    }

    const { error } = await supabase
      .from('invitations')
      .insert(invitationData)

    if (error) {
      console.error('Create invitation error:', error)
      return res.status(500).json({ error: 'Erreur lors de la création de l\'invitation' })
    }

    // Send invitation email
    const inviteLink = `${process.env.FRONTEND_URL}/invite/${token}`
    const template = emailTemplates.invitation(
      restaurant.name,
      `${req.user.first_name} ${req.user.last_name}`,
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
    const { data: invitation, error: fetchError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (fetchError || !invitation) {
      return res.status(404).json({ error: 'Invitation non trouvée ou expirée' })
    }

    // Check expiry
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id)
      return res.status(400).json({ error: 'Invitation expirée' })
    }

    // Check if user email matches
    if (req.user.email !== invitation.email) {
      return res.status(403).json({ error: 'Cette invitation n\'est pas pour cet utilisateur' })
    }

    // Add user to restaurant
    const { error: linkError } = await supabase
      .from('user_restaurants')
      .insert({
        user_id: req.user.id,
        restaurant_id: invitation.restaurant_id,
        role: invitation.role
      })

    if (linkError) {
      console.error('Link user error:', linkError)
      return res.status(500).json({ error: 'Erreur lors de l\'ajout au restaurant' })
    }

    // Update invitation status
    await supabase
      .from('invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by: req.user.id
      })
      .eq('id', invitation.id)

    res.json({
      success: true,
      message: 'Invitation acceptée',
      restaurant: {
        id: invitation.restaurant_id,
        name: invitation.restaurant_name,
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

    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('restaurant_name, role, invited_by_name, email, expires_at')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (error || !invitation) {
      return res.status(404).json({ error: 'Invitation non trouvée ou expirée' })
    }

    // Check expiry
    if (new Date(invitation.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Invitation expirée' })
    }

    res.json({
      success: true,
      invitation: {
        restaurantName: invitation.restaurant_name,
        role: invitation.role,
        invitedByName: invitation.invited_by_name,
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

    const { data: invitations, error } = await supabase
      .from('invitations')
      .select('id, email, role, invited_by_name, created_at, expires_at')
      .eq('restaurant_id', restaurantId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la récupération' })
    }

    const formattedInvitations = invitations?.map(inv => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      invitedByName: inv.invited_by_name,
      createdAt: inv.created_at,
      expiresAt: inv.expires_at
    })) || []

    res.json({ success: true, invitations: formattedInvitations })
  } catch (error) {
    console.error('Get pending invitations error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Cancel invitation
export const cancelInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params

    const { error } = await supabase
      .from('invitations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', invitationId)

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de l\'annulation' })
    }

    res.json({
      success: true,
      message: 'Invitation annulée'
    })
  } catch (error) {
    console.error('Cancel invitation error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}
