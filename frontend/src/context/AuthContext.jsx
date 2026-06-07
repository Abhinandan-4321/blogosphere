import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI, userAPI } from '../services/api'
import { connectSocket, disconnectSocket } from '../services/socket'
import { showToast } from '../utils/toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount, check for stored token and inactivity
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      // Check 24-hour inactivity
      const lastActive = parseInt(localStorage.getItem('lastActiveAt') || '0', 10)
      const ONE_DAY = 24 * 60 * 60 * 1000
      if (lastActive && Date.now() - lastActive > ONE_DAY) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('lastActiveAt')
        setUser(null)
        setLoading(false)
        return
      }
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  // Connect socket when user is available
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('accessToken')
      if (token) connectSocket(token)
    } else {
      disconnectSocket()
    }
  }, [user])

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await userAPI.getMe()
      setUser(data.data)
      return data.data
    } catch {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password })
    const result = data.data

    // Handle 2FA flow
    if (result.requires2FA) {
      return { requires2FA: true, userId: result.userId, method: result.method }
    }

    localStorage.setItem('accessToken', result.accessToken)
    localStorage.setItem('refreshToken', result.refreshToken)
    setUser(result.user)
    return { success: true }
  }, [])

  const register = useCallback(async (name, email, password, phone) => {
    const { data } = await authAPI.register({ name, email, password, phone })
    return data.data // { userId, otpSentVia, otpExpiresIn }
  }, [])

  const verifyOtp = useCallback(async (userId, otp, method) => {
    const { data } = await authAPI.verifyOtp({ userId, otp, method })
    const result = data.data
    if (result?.accessToken) {
      localStorage.setItem('accessToken', result.accessToken)
      localStorage.setItem('refreshToken', result.refreshToken)
      setUser(result.user)
      return { authenticated: true, isNewUser: !result.user?.hasPickedAvatar }
    }
    return { authenticated: false, message: data.message }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authAPI.logout()
    } catch {
      // Ignore errors on logout
    }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('lastActiveAt')
    disconnectSocket()
    setUser(null)
    showToast.success('Logged out successfully')
  }, [])

  // Handle Google OAuth callback tokens from URL
  const handleOAuthCallback = useCallback(async (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('lastActiveAt', Date.now().toString())
    const fetchedUser = await fetchUser()
    return { isNewUser: !fetchedUser?.hasPickedAvatar }
  }, [fetchUser])

  const value = {
    user,
    loading,
    login,
    register,
    verifyOtp,
    logout,
    handleOAuthCallback,
    fetchUser,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
