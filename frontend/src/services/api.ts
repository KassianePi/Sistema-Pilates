import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

const STORAGE_REFRESH = 'pilates_refresh_token'
const STORAGE_USER_TYPE = 'pilates_user_type'

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

export function setRefreshToken(token: string | null) {
  if (token) {
    localStorage.setItem(STORAGE_REFRESH, token)
  } else {
    localStorage.removeItem(STORAGE_REFRESH)
  }
}

export function getStoredRefreshToken() {
  return localStorage.getItem(STORAGE_REFRESH)
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      const storedRefresh = getStoredRefreshToken()

      if (!storedRefresh) {
        const userType = localStorage.getItem(STORAGE_USER_TYPE)
        window.location.href = userType === 'aluno' ? '/aluno/login' : '/admin/login'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          { refreshToken: storedRefresh },
          { withCredentials: true },
        )
        accessToken = data.data.accessToken
        localStorage.setItem(STORAGE_REFRESH, data.data.refreshToken)
        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch {
        accessToken = null
        localStorage.removeItem(STORAGE_REFRESH)
        const userType = localStorage.getItem(STORAGE_USER_TYPE)
        window.location.href = userType === 'aluno' ? '/aluno/login' : '/admin/login'
      }
    }

    return Promise.reject(error)
  },
)
