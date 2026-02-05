import { supabase } from '../config/supabase.js'

// Get all restaurants for current user
export const getMyRestaurants = async (req, res) => {
  try {
    const { data: userRestaurants, error } = await supabase
      .from('user_restaurants')
      .select(`
        restaurant_id,
        role,
        restaurants (
          id,
          name,
          address,
          timezone,
          currency,
          tip_out_rules,
          created_at
        )
      `)
      .eq('user_id', req.user.id)

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la récupération' })
    }

    const restaurants = userRestaurants?.map(ur => ({
      id: ur.restaurants.id,
      name: ur.restaurants.name,
      address: ur.restaurants.address,
      timezone: ur.restaurants.timezone,
      currency: ur.restaurants.currency,
      tipOutRules: ur.restaurants.tip_out_rules,
      userRole: ur.role,
      createdAt: ur.restaurants.created_at
    })) || []

    res.json({ success: true, restaurants })
  } catch (error) {
    console.error('Get restaurants error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Get single restaurant
export const getRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params

    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single()

    if (error || !restaurant) {
      return res.status(404).json({ error: 'Restaurant non trouvé' })
    }

    res.json({
      success: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address,
        timezone: restaurant.timezone,
        currency: restaurant.currency,
        tipOutRules: restaurant.tip_out_rules,
        createdAt: restaurant.created_at
      }
    })
  } catch (error) {
    console.error('Get restaurant error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Create new restaurant (Super Admin or first restaurant for Manager)
export const createRestaurant = async (req, res) => {
  try {
    const { name, address, timezone, currency } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Le nom du restaurant est requis' })
    }

    const restaurantData = {
      name,
      address: address || '',
      timezone: timezone || 'America/Montreal',
      currency: currency || 'CAD',
      tip_out_rules: [
        { position: 'Busboy', percentage: 1.5 },
        { position: 'Bartender', percentage: 1.0 },
        { position: 'Host', percentage: 0.5 }
      ],
      created_by: req.user.id
    }

    // Create restaurant
    const { data: newRestaurant, error } = await supabase
      .from('restaurants')
      .insert(restaurantData)
      .select()
      .single()

    if (error) {
      console.error('Create restaurant error:', error)
      return res.status(500).json({ error: 'Erreur lors de la création' })
    }

    // Add user to restaurant as manager
    const { error: linkError } = await supabase
      .from('user_restaurants')
      .insert({
        user_id: req.user.id,
        restaurant_id: newRestaurant.id,
        role: 'manager'
      })

    if (linkError) {
      console.error('Link user to restaurant error:', linkError)
    }

    res.status(201).json({
      success: true,
      restaurant: {
        id: newRestaurant.id,
        name: newRestaurant.name,
        address: newRestaurant.address,
        timezone: newRestaurant.timezone,
        currency: newRestaurant.currency,
        tipOutRules: newRestaurant.tip_out_rules,
        createdAt: newRestaurant.created_at
      }
    })
  } catch (error) {
    console.error('Create restaurant error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Update restaurant settings
export const updateRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const { name, address, timezone, currency, tipOutRules } = req.body

    const updateData = {}
    if (name) updateData.name = name
    if (address !== undefined) updateData.address = address
    if (timezone) updateData.timezone = timezone
    if (currency) updateData.currency = currency
    if (tipOutRules) updateData.tip_out_rules = tipOutRules

    const { error } = await supabase
      .from('restaurants')
      .update(updateData)
      .eq('id', restaurantId)

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la mise à jour' })
    }

    res.json({
      success: true,
      message: 'Restaurant mis à jour'
    })
  } catch (error) {
    console.error('Update restaurant error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Get restaurant team members
export const getTeamMembers = async (req, res) => {
  try {
    const { restaurantId } = req.params

    const { data: members, error } = await supabase
      .from('user_restaurants')
      .select(`
        role,
        joined_at,
        users (
          id,
          email,
          first_name,
          last_name,
          status
        )
      `)
      .eq('restaurant_id', restaurantId)

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la récupération' })
    }

    const formattedMembers = members?.map(m => ({
      id: m.users.id,
      email: m.users.email,
      firstName: m.users.first_name,
      lastName: m.users.last_name,
      role: m.role,
      status: m.users.status,
      joinedAt: m.joined_at
    })) || []

    res.json({ success: true, members: formattedMembers })
  } catch (error) {
    console.error('Get team members error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Get all restaurants (Super Admin only)
export const getAllRestaurants = async (req, res) => {
  try {
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la récupération' })
    }

    const formattedRestaurants = restaurants.map(r => ({
      id: r.id,
      name: r.name,
      address: r.address,
      timezone: r.timezone,
      currency: r.currency,
      tipOutRules: r.tip_out_rules,
      createdAt: r.created_at
    }))

    res.json({ success: true, restaurants: formattedRestaurants })
  } catch (error) {
    console.error('Get all restaurants error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Remove team member from restaurant
export const removeTeamMember = async (req, res) => {
  try {
    const { restaurantId, userId } = req.params

    const { error } = await supabase
      .from('user_restaurants')
      .delete()
      .eq('restaurant_id', restaurantId)
      .eq('user_id', userId)

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la suppression' })
    }

    res.json({
      success: true,
      message: 'Membre retiré de l\'équipe'
    })
  } catch (error) {
    console.error('Remove team member error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Update team member role
export const updateTeamMemberRole = async (req, res) => {
  try {
    const { restaurantId, userId } = req.params
    const { role } = req.body

    if (!['server', 'manager'].includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide' })
    }

    const { error } = await supabase
      .from('user_restaurants')
      .update({ role })
      .eq('restaurant_id', restaurantId)
      .eq('user_id', userId)

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la mise à jour' })
    }

    res.json({
      success: true,
      message: 'Rôle mis à jour'
    })
  } catch (error) {
    console.error('Update team member role error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}
