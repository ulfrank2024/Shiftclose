import { db } from '../config/firebase.js'

// Get all restaurants for current user
export const getMyRestaurants = async (req, res) => {
  try {
    const restaurants = req.user.restaurants || []

    // Get full restaurant data for each
    const restaurantData = await Promise.all(
      restaurants.map(async (r) => {
        const doc = await db.collection('restaurants').doc(r.id).get()
        if (doc.exists) {
          return { id: doc.id, ...doc.data(), userRole: r.role }
        }
        return null
      })
    )

    res.json({
      success: true,
      restaurants: restaurantData.filter(r => r !== null)
    })
  } catch (error) {
    console.error('Get restaurants error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Get single restaurant
export const getRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const doc = await db.collection('restaurants').doc(restaurantId).get()

    if (!doc.exists) {
      return res.status(404).json({ error: 'Restaurant non trouvé' })
    }

    res.json({
      success: true,
      restaurant: { id: doc.id, ...doc.data() }
    })
  } catch (error) {
    console.error('Get restaurant error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Create new restaurant (Super Admin only)
export const createRestaurant = async (req, res) => {
  try {
    const { name, address, timezone, currency } = req.body

    const restaurantData = {
      name,
      address: address || '',
      timezone: timezone || 'America/Montreal',
      currency: currency || 'CAD',
      tipOutRules: [
        { position: 'Busboy', percentage: 1.5 },
        { position: 'Bartender', percentage: 1.0 },
        { position: 'Host', percentage: 0.5 }
      ],
      createdBy: req.user.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const docRef = await db.collection('restaurants').add(restaurantData)

    // Add restaurant to creator's list
    const userRestaurants = req.user.restaurants || []
    userRestaurants.push({ id: docRef.id, name, role: 'manager' })

    await db.collection('users').doc(req.user.uid).update({
      restaurants: userRestaurants
    })

    res.status(201).json({
      success: true,
      restaurant: { id: docRef.id, ...restaurantData }
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

    const updateData = { updatedAt: new Date() }
    if (name) updateData.name = name
    if (address) updateData.address = address
    if (timezone) updateData.timezone = timezone
    if (currency) updateData.currency = currency
    if (tipOutRules) updateData.tipOutRules = tipOutRules

    await db.collection('restaurants').doc(restaurantId).update(updateData)

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

    // Find all users who have this restaurant in their list
    const snapshot = await db.collection('users')
      .where('restaurants', 'array-contains-any', [
        { id: restaurantId, role: 'server' },
        { id: restaurantId, role: 'manager' }
      ])
      .get()

    // Alternative: query all users and filter
    const allUsersSnapshot = await db.collection('users').get()
    const members = []

    allUsersSnapshot.forEach(doc => {
      const userData = doc.data()
      const restaurantMembership = userData.restaurants?.find(r => r.id === restaurantId)
      if (restaurantMembership) {
        members.push({
          id: doc.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: restaurantMembership.role,
          status: userData.status || 'active'
        })
      }
    })

    res.json({ success: true, members })
  } catch (error) {
    console.error('Get team members error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Get all restaurants (Super Admin only)
export const getAllRestaurants = async (req, res) => {
  try {
    const snapshot = await db.collection('restaurants').get()
    const restaurants = []

    snapshot.forEach(doc => {
      restaurants.push({ id: doc.id, ...doc.data() })
    })

    res.json({ success: true, restaurants })
  } catch (error) {
    console.error('Get all restaurants error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}
