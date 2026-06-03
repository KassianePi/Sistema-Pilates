import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

let accessToken: string | null = null
let refreshToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

export function setRefreshToken(token: string | null) {
  refreshToken = token
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

      if (!refreshToken) {
        window.location.href = '/admin/login'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          { refreshToken },
          { withCredentials: true },
        )
        accessToken = data.data.accessToken
        refreshToken = data.data.refreshToken
        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch {
        accessToken = null
        refreshToken = null
        window.location.href = '/admin/login'
      }
    }

    return Promise.reject(error)
  },
)
