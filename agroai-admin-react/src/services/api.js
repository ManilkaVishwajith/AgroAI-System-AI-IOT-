import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

const api = axios.create({ baseURL: API_BASE })

// Attach JWT token on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('agrix_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 (expired / invalid token) globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('agrix_token')
      localStorage.removeItem('agrix_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

/* Auth */
export const loginAdmin = (email, password) =>
  api.post('/users/login', { email, password }).then(r => r.data)

/* Users */
export const getUsers = () => api.get('/users').then(r => r.data)
export const createUser = (body) => api.post('/users', body).then(r => r.data)
export const updateUser = (email, body) => api.put(`/users/${email}`, body).then(r => r.data)

/* Device Requests */
export const getDeviceRequests = () => api.get('/device-requests').then(r => r.data)
export const approveRequest = (id) => api.patch(`/device-requests/${id}/approve`).then(r => r.data)
export const rejectRequest = (id) => api.patch(`/device-requests/${id}/reject`).then(r => r.data)

/* Predictions */
export const getPredictions = () => api.get('/prediction/all').then(r => r.data)

/* Chats */
export const getChats = () => api.get('/chat/all').then(r => r.data)

export default api
