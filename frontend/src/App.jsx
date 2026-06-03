import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import AuthCallback from './pages/AuthCallback'
import Feed from './pages/Feed'
import ArticleDetail from './pages/ArticleDetail'
import Creator from './pages/Creator'
import Drafts from './pages/Drafts'
import Favorites from './pages/Favorites'
import LikedPosts from './pages/LikedPosts'
import Profile from './pages/Profile'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import Settings from './pages/Settings'
import Notifications from './pages/Notifications'
import Messages from './pages/Messages'
import AvatarPicker from './pages/AvatarPicker'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'

function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-outline-variant/30 border-t-primary" />
      </div>
    )
  }

  return (
  <>
    <Routes>
      {/* Public routes without Layout */}
      <Route path="/" element={<Landing />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Auth pages with Layout (navbar with back-to-home) */}
      <Route element={<Layout />}>
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
      </Route>

      {/* Public pages with Layout */}
      <Route element={<Layout />}>
        <Route path="/feed" element={<Feed />} />
        <Route path="/blog/:slug" element={<ArticleDetail />} />
        <Route path="/profile/:id" element={<Profile />} />
      </Route>

      {/* Protected routes — full screen (no Layout) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/choose-avatar" element={<AvatarPicker />} />
      </Route>

      {/* Protected routes — all with Layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/create" element={<Creator />} />
          <Route path="/drafts" element={<Drafts />} />
          <Route path="/edit/:id" element={<Creator />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/liked" element={<LikedPosts />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <Toaster position="top-right" />
  </>
  )
}

export default App
