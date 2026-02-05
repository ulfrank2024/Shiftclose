const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Get token from localStorage
const getToken = () => localStorage.getItem('token')

// Base fetch with auth header
const fetchWithAuth = async (endpoint, options = {}) => {
  const token = getToken()

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, config)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Une erreur est survenue')
  }

  return data
}

// Auth API
export const authAPI = {
  register: (userData) =>
    fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  registerEmployee: (userData) =>
    fetchWithAuth('/auth/register-employee', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  login: (credentials) =>
    fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  getProfile: () => fetchWithAuth('/auth/profile'),

  updateProfile: (data) =>
    fetchWithAuth('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  changePassword: (data) =>
    fetchWithAuth('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
}

// Restaurant API
export const restaurantAPI = {
  getMy: () => fetchWithAuth('/restaurants/my'),
  getMyRestaurants: () => fetchWithAuth('/restaurants/my'),

  get: (id) => fetchWithAuth(`/restaurants/${id}`),
  getRestaurant: (id) => fetchWithAuth(`/restaurants/${id}`),

  create: (data) =>
    fetchWithAuth('/restaurants', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  createRestaurant: (data) =>
    fetchWithAuth('/restaurants', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  update: (id, data) =>
    fetchWithAuth(`/restaurants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  updateRestaurant: (id, data) =>
    fetchWithAuth(`/restaurants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  getTeam: (restaurantId) =>
    fetchWithAuth(`/restaurants/${restaurantId}/team`),
  getTeamMembers: (restaurantId) =>
    fetchWithAuth(`/restaurants/${restaurantId}/team`),

  removeTeamMember: (restaurantId, userId) =>
    fetchWithAuth(`/restaurants/${restaurantId}/team/${userId}`, {
      method: 'DELETE'
    }),

  updateTeamMemberRole: (restaurantId, userId, role) =>
    fetchWithAuth(`/restaurants/${restaurantId}/team/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    }),

  getAll: () => fetchWithAuth('/restaurants/all')
}

// Reports API
export const reportAPI = {
  getStats: (restaurantId) =>
    fetchWithAuth(`/reports/${restaurantId}/stats`),

  getAll: (restaurantId, filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    return fetchWithAuth(`/reports/${restaurantId}${params ? `?${params}` : ''}`)
  },
  getReports: (restaurantId, filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    return fetchWithAuth(`/reports/${restaurantId}${params ? `?${params}` : ''}`)
  },

  get: (reportId) =>
    fetchWithAuth(`/reports/detail/${reportId}`),
  getReport: (reportId) =>
    fetchWithAuth(`/reports/detail/${reportId}`),

  create: (restaurantId, data) =>
    fetchWithAuth(`/reports/${restaurantId}`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  createReport: (restaurantId, data) =>
    fetchWithAuth(`/reports/${restaurantId}`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  validate: (reportId, status, note = '') =>
    fetchWithAuth(`/reports/${reportId}/validate`, {
      method: 'PUT',
      body: JSON.stringify({ status, note })
    }),
  validateReport: (reportId, status, note = '') =>
    fetchWithAuth(`/reports/${reportId}/validate`, {
      method: 'PUT',
      body: JSON.stringify({ status, note })
    })
}

// Invitations API
export const invitationAPI = {
  send: (restaurantId, data) =>
    fetchWithAuth(`/invitations/${restaurantId}`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  sendInvitation: (restaurantId, email, role) =>
    fetchWithAuth(`/invitations/${restaurantId}`, {
      method: 'POST',
      body: JSON.stringify({ email, role })
    }),

  getInfo: async (token) => {
    const response = await fetch(`${API_URL}/invitations/info/${token}`)
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Invitation invalide')
    }
    return data
  },
  getInvitationInfo: async (token) => {
    const response = await fetch(`${API_URL}/invitations/info/${token}`)
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Invitation invalide')
    }
    return data
  },

  accept: (token) =>
    fetchWithAuth(`/invitations/accept/${token}`, {
      method: 'POST'
    }),
  acceptInvitation: (token) =>
    fetchWithAuth(`/invitations/accept/${token}`, {
      method: 'POST'
    }),

  getPending: (restaurantId) =>
    fetchWithAuth(`/invitations/${restaurantId}`),
  getPendingInvitations: (restaurantId) =>
    fetchWithAuth(`/invitations/${restaurantId}`),

  cancel: (invitationId) =>
    fetchWithAuth(`/invitations/${invitationId}`, {
      method: 'DELETE'
    }),
  cancelInvitation: (invitationId) =>
    fetchWithAuth(`/invitations/${invitationId}`, {
      method: 'DELETE'
    })
}

// Admin API (Super Admin only)
export const adminAPI = {
  getStats: () => fetchWithAuth('/admin/stats'),

  getRestaurants: () => fetchWithAuth('/admin/restaurants'),

  suspendRestaurant: (restaurantId) =>
    fetchWithAuth(`/admin/restaurants/${restaurantId}/suspend`, {
      method: 'PUT'
    }),

  activateRestaurant: (restaurantId) =>
    fetchWithAuth(`/admin/restaurants/${restaurantId}/activate`, {
      method: 'PUT'
    }),

  getUsers: () => fetchWithAuth('/admin/users'),

  getPlans: () => fetchWithAuth('/admin/plans')
}

export default {
  auth: authAPI,
  restaurant: restaurantAPI,
  report: reportAPI,
  invitation: invitationAPI,
  admin: adminAPI
}
