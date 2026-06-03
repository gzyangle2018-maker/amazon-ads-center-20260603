import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'https://amazon-ads-center-api.gzyangle2018.workers.dev'

const api = axios.create({ baseURL: API_BASE, timeout: 30000 })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) { localStorage.removeItem('token') }
    return Promise.reject(err)
  }
)

export const loginApi = (username: string, password: string) =>
  api.post('/api/auth/login', { username, password })

export const registerApi = (data: any) =>
  api.post('/api/auth/register', data)

export const getDashboard = () => api.get('/api/admin/dashboard')
export const getUploads = (params?: any) => api.get('/api/admin/uploads', { params })
export const getActions = (params?: any) => api.get('/api/admin/actions', { params })
export const getMissing = () => api.get('/api/admin/missing')
export const getUsers = () => api.get('/api/admin/users')

export const getTasks = () => api.get('/api/tasks')
export const getTask = (id: number) => api.get(`/api/tasks/${id}`)
export const createAnalysis = (data: any) => api.post('/api/analyze', data)
export const uploadFile = (formData: FormData) => api.post('/api/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

export const getCategoryProfiles = () => api.get('/api/category-profiles')
export const saveCategoryProfile = (data: any) => api.post('/api/category-profiles', data)
export const getLLMSettings = () => api.get('/api/settings/llm')
export const saveLLMSettings = (data: any) => api.post('/api/settings/llm', data)
export const testLLM = (data: any) => api.post('/api/llm/test', data)

export default api
