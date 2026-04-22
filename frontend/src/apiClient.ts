import axios from 'axios'

// On Vercel: frontend + backend are same domain, /api routes to serverless function
// In local dev: Vite proxy forwards /api → localhost:5000
const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('glowai_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('glowai_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
