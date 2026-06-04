import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Bell, PenSquare, User, LogOut, Heart, Bookmark, Settings, MessageCircle, UserPlus, MessageSquare, ChevronLeft, ChevronRight, Shield, Menu, X, LayoutDashboard, BookOpen } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { notificationAPI, chatAPI } from '../services/api'
import { getSocket } from '../services/socket'
import UserAvatar from './UserAvatar'

function getNotifLink(notif) {
  switch (notif.type) {
    case 'like': case 'comment': case 'new_post':
      if (notif.relatedBlog?.slug) return `/blog/${notif.relatedBlog.slug}`
      if (notif.relatedBlog?._id) return `/blog/${notif.relatedBlog._id}`
      if (notif.relatedBlog) return `/blog/${notif.relatedBlog}`
      return null
    case 'follow':
      if (notif.relatedUser?._id) return `/profile/${notif.relatedUser._id}`
      if (notif.relatedUser) return `/profile/${notif.relatedUser}`
      return null
    case 'chat_message': return '/messages'
    case 'coffee_received':
      if (notif.relatedUser?._id) return `/profile/${notif.relatedUser._id}`
      return null
    default: return null
  }
}

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function getNotifIcon(type) {
  switch (type) {
    case 'like': return <Heart className="h-3.5 w-3.5 text-red-500" />
    case 'comment': return <MessageCircle className="h-3.5 w-3.5 text-blue-500" />
    case 'follow': return <UserPlus className="h-3.5 w-3.5 text-green-500" />
    case 'chat_message': return <MessageCircle className="h-3.5 w-3.5 text-purple-500" />
    default: return <Bell className="h-3.5 w-3.5 text-on-surface-variant" />
  }
}

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [chatUnread, setChatUnread] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [navVisible, setNavVisible] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const notifRef = useRef(null)
  const userMenuRef = useRef(null)
  const mobileMenuRef = useRef(null)
  const hideTimerRef = useRef(null)
  const isScrolledRef = useRef(false)

  // Navbar auto-hide on scroll
  useEffect(() => {
    const startHideTimer = () => {
      clearTimeout(hideTimerRef.current)
      if (isScrolledRef.current) {
        hideTimerRef.current = setTimeout(() => setNavVisible(false), 2500)
      }
    }

    const handleScroll = () => {
      const scrolled = window.scrollY > 60
      isScrolledRef.current = scrolled
      if (!scrolled) {
        clearTimeout(hideTimerRef.current)
        setNavVisible(true)
      } else {
        setNavVisible(true)
        startHideTimer()
      }
    }

    const handleMouseMove = (e) => {
      if (e.clientY < 70) {
        setNavVisible(true)
        clearTimeout(hideTimerRef.current)
      } else if (isScrolledRef.current) {
        startHideTimer()
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouseMove)
      clearTimeout(hideTimerRef.current)
    }
  }, [])

  // Close menus when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false)
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) setMobileMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setShowUserMenu(false)
    setShowNotifications(false)
  }, [location.pathname])

  useEffect(() => {
    if (!isAuthenticated) return
    notificationAPI.getAll({ limit: 10 }).then(({ data }) => {
      setNotifications(data.data?.notifications || data.data || [])
      setUnreadCount(data.data?.unreadCount || 0)
    }).catch(() => {})
    chatAPI.getConversations().then(({ data }) => {
      const total = (data.data || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0)
      setChatUnread(total)
    }).catch(() => {})
  }, [isAuthenticated])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const handler = (notif) => {
      setUnreadCount(prev => prev + 1)
      setNotifications(prev => [notif, ...prev].slice(0, 20))
    }
    socket.on('notification:new', handler)
    const chatHandler = () => setChatUnread(prev => prev + 1)
    socket.on('chat:message', chatHandler)
    return () => {
      socket.off('notification:new', handler)
      socket.off('chat:message', chatHandler)
    }
  }, [isAuthenticated])

  const handleLogout = async () => {
    setShowUserMenu(false)
    await logout()
    navigate('/login')
  }

  const handleOpenNotifications = async () => {
    setShowNotifications(!showNotifications)
    setShowUserMenu(false)
    if (!showNotifications && unreadCount > 0) {
      try {
        await notificationAPI.markAllAsRead()
        setUnreadCount(0)
      } catch {}
    }
  }

  const isHome = location.pathname === '/'

  return (
    <header className={`fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 transition-all duration-500 ease-in-out ${navVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6 pointer-events-none'}`}>
      <div className={`flex h-14 items-center justify-between rounded-2xl border px-4 shadow-lg backdrop-blur-xl transition-colors ${
        isHome
          ? 'border-outline-variant/40 bg-surface/80'
          : 'border-outline-variant/30 bg-surface-container-low/90'
      }`}>
        {/* Left: Nav buttons + Logo */}
        <div className="flex items-center gap-1.5">
          <div className="hidden sm:flex items-center rounded-full bg-surface-container-high/60 border border-outline-variant/20">
            <button
              onClick={() => navigate(-1)}
              className="rounded-l-full p-1.5 text-on-surface-variant transition hover:bg-surface-container-high"
              title="Go back"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="w-px h-4 bg-outline-variant/25" />
            <button
              onClick={() => navigate(1)}
              className="rounded-r-full p-1.5 text-on-surface-variant transition hover:bg-surface-container-high"
              title="Go forward"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <Link to={isAuthenticated ? '/feed' : '/'} className="ml-1 font-display text-lg font-semibold italic tracking-tight text-on-surface">
            Blogosphere
          </Link>
        </div>

        {/* Center: Nav links */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/feed" className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
            location.pathname === '/feed' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
          }`}>Feed</Link>
          {isAuthenticated && (
            <>
              <Link to="/dashboard" className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                location.pathname === '/dashboard' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}>Dashboard</Link>
              <Link to="/messages" onClick={() => setChatUnread(0)} className={`relative rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                location.pathname === '/messages' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}>
                Messages
                {chatUnread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-on-primary">
                    {chatUnread > 9 ? '9+' : chatUnread}
                  </span>
                )}
              </Link>
            </>
          )}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* Mobile hamburger */}
              <div className="relative md:hidden" ref={mobileMenuRef}>
                <button
                  onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setShowNotifications(false); setShowUserMenu(false) }}
                  className="rounded-xl p-2 text-on-surface-variant transition hover:bg-surface-container-high"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
                {mobileMenuOpen && (
                  <div className="popup-enter absolute right-0 top-12 z-50 w-64 rounded-2xl border border-outline-variant/30 bg-surface-container-low shadow-xl overflow-hidden">
                    <div className="border-b border-outline-variant/20 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar src={user?.avatar} name={user?.name} size="lg" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-on-surface truncate">{user?.name}</p>
                          <p className="text-xs text-on-surface-variant truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="py-1">
                      <Link to="/feed" className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container transition">
                        <BookOpen className="h-4 w-4" /> Feed
                      </Link>
                      <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container transition">
                        <LayoutDashboard className="h-4 w-4" /> Dashboard
                      </Link>
                      <Link to="/messages" className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container transition">
                        <MessageCircle className="h-4 w-4" /> Messages
                        {chatUnread > 0 && <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-on-primary">{chatUnread > 9 ? '9+' : chatUnread}</span>}
                      </Link>
                      <Link to="/notifications" className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container transition">
                        <Bell className="h-4 w-4" /> Notifications
                        {unreadCount > 0 && <span className="ml-auto rounded-full bg-error px-2 py-0.5 text-[9px] font-bold text-on-error">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                      </Link>
                      <Link to="/create" className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container transition">
                        <PenSquare className="h-4 w-4" /> Write
                      </Link>
                      <div className="border-t border-outline-variant/20 my-1" />
                      <Link to={`/profile/${user?._id}`} className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container transition">
                        <User className="h-4 w-4" /> Profile
                      </Link>
                      <Link to="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container transition">
                        <Settings className="h-4 w-4" /> Settings
                      </Link>
                      <Link to="/liked" className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container transition">
                        <Heart className="h-4 w-4" /> Liked Posts
                      </Link>
                      <Link to="/favorites" className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container transition">
                        <Bookmark className="h-4 w-4" /> Saved
                      </Link>
                      {user?.role === 'admin' && (
                        <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container transition">
                          <Shield className="h-4 w-4" /> Admin Panel
                        </Link>
                      )}
                      <div className="border-t border-outline-variant/20 my-1" />
                      <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error-container/30 transition">
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notifications (desktop only) */}
              <div className="relative hidden md:block" ref={notifRef}>
                <button onClick={handleOpenNotifications} className="relative rounded-xl p-2 text-on-surface-variant transition hover:bg-surface-container-high">
                  <Bell className="h-[18px] w-[18px]" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[9px] font-bold text-on-error">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="popup-enter absolute right-0 top-12 z-50 w-80 rounded-2xl border border-outline-variant/30 bg-surface-container-low shadow-xl overflow-hidden">
                    <div className="flex items-center justify-between border-b border-outline-variant/20 px-4 py-3">
                      <h3 className="text-sm font-semibold text-on-surface">Notifications</h3>
                      {notifications.length > 0 && (
                        <Link to="/notifications" onClick={() => setShowNotifications(false)} className="text-xs text-primary hover:underline">View all</Link>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <Bell className="mx-auto mb-2 h-8 w-8 text-outline-variant/40" />
                          <p className="text-xs text-on-surface-variant">No notifications yet.</p>
                        </div>
                      ) : (
                        notifications.map((notif, i) => (
                          <div key={notif._id || i} onClick={() => { const link = getNotifLink(notif); if (link) { setShowNotifications(false); navigate(link) } }} className={`flex items-start gap-3 px-4 py-3 transition hover:bg-surface-container cursor-pointer ${!notif.read ? 'bg-primary-fixed/20' : ''}`}>
                            <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-high">
                              {getNotifIcon(notif.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-on-surface leading-relaxed">{notif.message}</p>
                              <p className="mt-1 text-[10px] text-on-surface-variant">{timeAgo(notif.createdAt)}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Link to="/create" className="hidden md:flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-sm font-medium text-on-primary transition hover:bg-primary-container hover:text-on-primary-container">
                <PenSquare className="h-3.5 w-3.5" /> Write
              </Link>

              {/* User Menu (desktop only) */}
              <div className="relative hidden md:block" ref={userMenuRef}>
                <button onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false) }} className="hover:opacity-80 transition">
                  <UserAvatar src={user?.avatar} name={user?.name} size="md" />
                </button>
                {showUserMenu && (
                  <div className="popup-enter absolute right-0 top-11 z-50 w-56 rounded-2xl border border-outline-variant/30 bg-surface-container-low py-1 shadow-xl overflow-hidden">
                    <div className="border-b border-outline-variant/20 px-4 py-3">
                      <p className="text-sm font-medium text-on-surface truncate">{user?.name}</p>
                      <p className="text-xs text-on-surface-variant truncate">{user?.email}</p>
                    </div>
                    <Link to={`/profile/${user?._id}`} onClick={() => setShowUserMenu(false)} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container transition">
                      <User className="h-4 w-4" /> Profile
                    </Link>
                    <Link to="/settings" onClick={() => setShowUserMenu(false)} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container transition">
                      <Settings className="h-4 w-4" /> Settings
                    </Link>
                    <Link to="/liked" onClick={() => setShowUserMenu(false)} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container transition">
                      <Heart className="h-4 w-4" /> Liked Posts
                    </Link>
                    <Link to="/favorites" onClick={() => setShowUserMenu(false)} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container transition">
                      <Bookmark className="h-4 w-4" /> Saved
                    </Link>
                    {user?.role === 'admin' && (
                      <Link to="/admin" onClick={() => setShowUserMenu(false)} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container transition">
                        <Shield className="h-4 w-4" /> Admin Panel
                      </Link>
                    )}
                    <div className="border-t border-outline-variant/20 mt-1">
                      <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error-container/30 transition">
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-xl px-3 py-1.5 text-sm font-medium text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface">Sign In</Link>
              <Link to="/register" className="rounded-xl bg-primary px-4 py-1.5 text-sm font-medium text-on-primary transition hover:bg-primary-container hover:text-on-primary-container">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
