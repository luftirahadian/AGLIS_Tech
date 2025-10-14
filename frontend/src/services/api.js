import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased from 10s to 30s for slow queries
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token and disable cache for GET requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Disable cache for GET requests to prevent stale data
    if (config.method === 'get') {
      config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
      config.headers['Pragma'] = 'no-cache'
      config.headers['Expires'] = '0'
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    const message = error.response?.data?.message || 'An error occurred'
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      console.warn('⏱️ API Timeout:', error.config?.url)
      toast.error('Request timeout. Server might be slow, please try again.')
      return Promise.reject(error)
    }
    
    // Handle network errors
    if (error.code === 'ERR_NETWORK') {
      console.error('🌐 Network Error:', error.message)
      toast.error('Network error. Please check your connection.')
      return Promise.reject(error)
    }
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Don't redirect if on public pages
      const publicPaths = ['/register', '/track', '/login']
      const isPublicPage = publicPaths.some(path => window.location.pathname.startsWith(path))
      
      if (!isPublicPage) {
        // Unauthorized - redirect to login
        localStorage.removeItem('token')
        window.location.href = '/login'
        toast.error('Session expired. Please login again.')
      }
    } else if (error.response?.status === 403) {
      toast.error('Access denied. Insufficient permissions.')
    } else if (error.response?.status === 404) {
      toast.error('Resource not found.')
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.')
    } else {
      toast.error(message)
    }

    return Promise.reject(error)
  }
)

export default api
