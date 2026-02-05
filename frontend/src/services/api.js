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
  getMyRestaurants: () => fetchWithAuth('/restaurants/my'),

  getRestaurant: (id) => fetchWithAuth(`/restaurants/${id}`),

  createRestaurant: (data) =>
    fetchWithAuth('/restaurants', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateRestaurant: (id, data) =>
    fetchWithAuth(`/restaurants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  getTeamMembers: (restaurantId) =>
    fetchWithAuth(`/restaurants/${restaurantId}/team`)
}

// Reports API
export const reportAPI = {
  getStats: (restaurantId) =>
    fetchWithAuth(`/reports/${restaurantId}/stats`),

  getReports: (restaurantId, filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    return fetchWithAuth(`/reports/${restaurantId}${params ? `?${params}` : ''}`)
  },

  getReport: (reportId) =>
    fetchWithAuth(`/reports/detail/${reportId}`),

  createReport: (restaurantId, data) =>
    fetchWithAuth(`/reports/${restaurantId}`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  validateReport: (reportId, status, note = '') =>
    fetchWithAuth(`/reports/${reportId}/validate`, {
      method: 'PUT',
      body: JSON.stringify({ status, note })
    })
}

// Invitations API
export const invitationAPI = {
  sendInvitation: (restaurantId, email, role) =>
    fetchWithAuth(`/invitations/${restaurantId}`, {
      method: 'POST',
      body: JSON.stringify({ email, role })
    }),

  getInvitationInfo: (token) =>
    fetch(`${API_URL}/invitations/info/${token}`).then(r => r.json()),

  acceptInvitation: (token) =>
    fetchWithAuth(`/invitations/accept/${token}`, {
      method: 'POST'
    }),

  getPendingInvitations: (restaurantId) =>
    fetchWithAuth(`/invitations/${restaurantId}`),

  cancelInvitation: (invitationId) =>
    fetchWithAuth(`/invitations/${invitationId}`, {
      method: 'DELETE'
    })
}

export default {
  auth: authAPI,
  restaurant: restaurantAPI,
  report: reportAPI,
  invitation: invitationAPI
}
