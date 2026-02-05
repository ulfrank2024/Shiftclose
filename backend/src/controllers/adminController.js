import { supabase } from '../config/supabase.js'

// Get dashboard stats (Super Admin only)
export const getStats = async (req, res) => {
  try {
    // Get total restaurants
    const { count: totalRestaurants } = await supabase
      .from('restaurants')
      .select('*', { count: 'exact', head: true })

    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Get reports this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: reportsThisMonth } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString())

    // Get subscription stats (if table exists)
    let activeSubscriptions = 0
    let trialUsers = 0
    let monthlyRevenue = 0

    try {
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('status, subscription_plans(price)')

      if (subscriptions) {
        activeSubscriptions = subscriptions.filter(s => s.status === 'active').length
        trialUsers = subscriptions.filter(s => s.status === 'trial').length
        monthlyRevenue = subscriptions
          .filter(s => s.status === 'active')
          .reduce((sum, s) => sum + (s.subscription_plans?.price || 0), 0)
      }
    } catch (e) {
      // Subscriptions table might not exist yet
      console.log('Subscriptions table not found, using defaults')
    }

    res.json({
      success: true,
      stats: {
        totalRestaurants: totalRestaurants || 0,
        totalUsers: totalUsers || 0,
        reportsThisMonth: reportsThisMonth || 0,
        activeSubscriptions,
        trialUsers,
        monthlyRevenue
      }
    })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Get all restaurants with details (Super Admin only)
export const getAllRestaurants = async (req, res) => {
  try {
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select(`
        *,
        created_by_user:users!restaurants_created_by_fkey(id, email, first_name, last_name),
        user_restaurants(user_id)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get restaurants error:', error)
      return res.status(500).json({ error: 'Erreur lors de la récupération' })
    }

    // Get subscription info for each restaurant
    const restaurantsWithDetails = await Promise.all(
      restaurants.map(async (r) => {
        // Try to get subscription
        let subscription = null
        try {
          const { data } = await supabase
            .from('subscriptions')
            .select('status, trial_ends_at, subscription_plans(name, price)')
            .eq('restaurant_id', r.id)
            .single()
          subscription = data
        } catch (e) {
          // No subscription found
        }

        // Get reports count for this month
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const { count: monthlyReports } = await supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('restaurant_id', r.id)
          .gte('created_at', startOfMonth.toISOString())

        return {
          id: r.id,
          name: r.name,
          address: r.address,
          owner: r.created_by_user
            ? `${r.created_by_user.first_name} ${r.created_by_user.last_name}`
            : 'N/A',
          email: r.created_by_user?.email || 'N/A',
          plan: subscription?.subscription_plans?.name || 'starter',
          status: subscription?.status || r.subscription_status || 'trial',
          employees: r.user_restaurants?.length || 0,
          monthlyReports: monthlyReports || 0,
          createdAt: r.created_at,
          lastActivity: r.updated_at
        }
      })
    )

    res.json({
      success: true,
      restaurants: restaurantsWithDetails
    })
  } catch (error) {
    console.error('Get all restaurants error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Get all users (Super Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id, email, first_name, last_name, role, status, created_at,
        user_restaurants(restaurant_id, role, restaurants(name))
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get users error:', error)
      return res.status(500).json({ error: 'Erreur lors de la récupération' })
    }

    const formattedUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      role: u.role,
      status: u.status,
      restaurants: u.user_restaurants?.map(ur => ({
        id: ur.restaurant_id,
        name: ur.restaurants?.name,
        role: ur.role
      })) || [],
      createdAt: u.created_at
    }))

    res.json({
      success: true,
      users: formattedUsers
    })
  } catch (error) {
    console.error('Get all users error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Suspend a restaurant (Super Admin only)
export const suspendRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params

    // Update subscription status
    const { error } = await supabase
      .from('restaurants')
      .update({ subscription_status: 'suspended' })
      .eq('id', restaurantId)

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la suspension' })
    }

    // Also update subscriptions table if exists
    try {
      await supabase
        .from('subscriptions')
        .update({ status: 'suspended' })
        .eq('restaurant_id', restaurantId)
    } catch (e) {
      // Ignore if table doesn't exist
    }

    res.json({
      success: true,
      message: 'Restaurant suspendu'
    })
  } catch (error) {
    console.error('Suspend restaurant error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Activate a restaurant (Super Admin only)
export const activateRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params

    const { error } = await supabase
      .from('restaurants')
      .update({ subscription_status: 'active' })
      .eq('id', restaurantId)

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de l\'activation' })
    }

    // Also update subscriptions table if exists
    try {
      await supabase
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('restaurant_id', restaurantId)
    } catch (e) {
      // Ignore if table doesn't exist
    }

    res.json({
      success: true,
      message: 'Restaurant activé'
    })
  } catch (error) {
    console.error('Activate restaurant error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Get subscription plans (Super Admin only)
export const getPlans = async (req, res) => {
  try {
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true })

    if (error) {
      // Table might not exist
      return res.json({
        success: true,
        plans: [
          { id: '1', name: 'starter', displayName: 'Starter', price: 49, maxEmployees: 5 },
          { id: '2', name: 'pro', displayName: 'Pro', price: 99, maxEmployees: 20 },
          { id: '3', name: 'enterprise', displayName: 'Enterprise', price: 199, maxEmployees: -1 }
        ]
      })
    }

    res.json({
      success: true,
      plans: plans.map(p => ({
        id: p.id,
        name: p.name,
        displayName: p.display_name,
        price: p.price,
        maxEmployees: p.max_employees,
        features: p.features
      }))
    })
  } catch (error) {
    console.error('Get plans error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}
