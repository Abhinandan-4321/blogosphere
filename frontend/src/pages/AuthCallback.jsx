import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const { handleOAuthCallback } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const accessToken = searchParams.get('accessToken')
    const refreshToken = searchParams.get('refreshToken')
    const error = searchParams.get('error')

    if (error) {
      navigate('/login', { state: { error: 'Google authentication failed' } })
      return
    }

    if (accessToken && refreshToken) {
      handleOAuthCallback(accessToken, refreshToken).then((result) => {
        // New users go to avatar picker; existing users go to feed
        const destination = result?.isNewUser ? '/choose-avatar' : '/feed'
        setTimeout(() => {
          navigate(destination, { replace: true })
        }, 100)
      })
    } else {
      navigate('/login', { replace: true })
    }
  }, [searchParams, handleOAuthCallback, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-outline-variant/30 border-t-primary" />
        <p className="text-sm text-on-surface-variant">Completing authentication...</p>
      </div>
    </div>
  )
}
