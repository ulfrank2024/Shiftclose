import { supabase } from '../config/supabase.js'

// ── Employé : soumettre une demande de suppression ───────────
export const requestDeletion = async (req, res) => {
  try {
    const { restaurantId } = req.body
    const userId = req.user.id

    if (!restaurantId) {
      return res.status(400).json({ error: 'restaurantId requis' })
    }

    // Vérifier que l'utilisateur est bien membre du restaurant
    const { data: membership } = await supabase
      .from('user_restaurants')
      .select('role')
      .eq('user_id', userId)
      .eq('restaurant_id', restaurantId)
      .single()

    if (!membership) {
      return res.status(403).json({ error: 'Accès non autorisé' })
    }

    // Annuler toute demande en attente précédente
    await supabase
      .from('deletion_requests')
      .delete()
      .eq('user_id', userId)
      .eq('restaurant_id', restaurantId)
      .eq('status', 'pending')

    // Créer la nouvelle demande
    const { data: request, error } = await supabase
      .from('deletion_requests')
      .insert({
        user_id: userId,
        restaurant_id: restaurantId,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la création' })
    }

    res.json({
      success: true,
      message: 'Demande envoyée à votre manager',
      request
    })
  } catch (error) {
    console.error('Request deletion error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// ── Employé : voir l'état de sa demande ──────────────────────
export const getMyDeletionRequest = async (req, res) => {
  try {
    const { restaurantId } = req.query
    const userId = req.user.id

    const query = supabase
      .from('deletion_requests')
      .select('*')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false })
      .limit(1)

    if (restaurantId) query.eq('restaurant_id', restaurantId)

    const { data, error } = await query

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la récupération' })
    }

    res.json({ success: true, request: data?.[0] || null })
  } catch (error) {
    console.error('Get deletion request error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// ── Employé : annuler sa demande ──────────────────────────────
export const cancelDeletionRequest = async (req, res) => {
  try {
    const { requestId } = req.params
    const userId = req.user.id

    const { error } = await supabase
      .from('deletion_requests')
      .delete()
      .eq('id', requestId)
      .eq('user_id', userId)
      .eq('status', 'pending')

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de l\'annulation' })
    }

    res.json({ success: true, message: 'Demande annulée' })
  } catch (error) {
    console.error('Cancel deletion request error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// ── Manager : lister les demandes en attente ──────────────────
export const getPendingDeletionRequests = async (req, res) => {
  try {
    const { restaurantId } = req.params

    const { data: requests, error } = await supabase
      .from('deletion_requests')
      .select(`
        id,
        status,
        note,
        requested_at,
        reviewed_at,
        users!deletion_requests_user_id_fkey (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('restaurant_id', restaurantId)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la récupération' })
    }

    const formatted = requests.map(r => ({
      id: r.id,
      status: r.status,
      note: r.note,
      requestedAt: r.requested_at,
      reviewedAt: r.reviewed_at,
      userId: r.users.id,
      firstName: r.users.first_name,
      lastName: r.users.last_name,
      email: r.users.email
    }))

    res.json({ success: true, requests: formatted })
  } catch (error) {
    console.error('Get pending deletion requests error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// ── Manager : approuver une demande (supprime le compte) ──────
export const approveDeletion = async (req, res) => {
  try {
    const { restaurantId, requestId } = req.params
    const managerId = req.user.id

    // Récupérer la demande
    const { data: request, error: fetchError } = await supabase
      .from('deletion_requests')
      .select('*')
      .eq('id', requestId)
      .eq('restaurant_id', restaurantId)
      .eq('status', 'pending')
      .single()

    if (fetchError || !request) {
      return res.status(404).json({ error: 'Demande introuvable' })
    }

    // Marquer comme approuvée
    await supabase
      .from('deletion_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: managerId
      })
      .eq('id', requestId)

    // Retirer le membre du restaurant
    await supabase
      .from('user_restaurants')
      .delete()
      .eq('user_id', request.user_id)
      .eq('restaurant_id', restaurantId)

    // Vérifier si l'utilisateur est encore dans d'autres restaurants
    const { data: otherRestaurants } = await supabase
      .from('user_restaurants')
      .select('restaurant_id')
      .eq('user_id', request.user_id)

    // Si plus aucun restaurant : supprimer le compte entier
    if (!otherRestaurants || otherRestaurants.length === 0) {
      await supabase
        .from('users')
        .delete()
        .eq('id', request.user_id)
    }

    res.json({
      success: true,
      message: 'Compte supprimé avec succès'
    })
  } catch (error) {
    console.error('Approve deletion error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// ── Manager : rejeter une demande ─────────────────────────────
export const rejectDeletion = async (req, res) => {
  try {
    const { restaurantId, requestId } = req.params
    const { note } = req.body
    const managerId = req.user.id

    const { error } = await supabase
      .from('deletion_requests')
      .update({
        status: 'rejected',
        note: note || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: managerId
      })
      .eq('id', requestId)
      .eq('restaurant_id', restaurantId)
      .eq('status', 'pending')

    if (error) {
      return res.status(500).json({ error: 'Erreur lors du rejet' })
    }

    res.json({ success: true, message: 'Demande refusée' })
  } catch (error) {
    console.error('Reject deletion error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}
