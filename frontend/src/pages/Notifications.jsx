import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Heart, MessageCircle, UserPlus, Check, X, Trash2, AlertTriangle } from 'lucide-react'
import { notificationAPI } from '../services/api'
import { getSocket } from '../services/socket'

function getNotifLink(notif) {
  switch (notif.type) {
    case 'like':
    case 'comment':
    case 'new_post':
    case 'post_flagged':
      if (notif.relatedBlog?.slug) return `/blog/${notif.relatedBlog.slug}`
      if (notif.relatedBlog?._id) return `/blog/${notif.relatedBlog._id}`
      if (notif.relatedBlog) return `/blog/${notif.relatedBlog}`
      return null
    case 'follow':
      if (notif.relatedUser?._id) return `/profile/${notif.relatedUser._id}`
      if (notif.relatedUser) return `/profile/${notif.relatedUser}`
      return null
    case 'chat_message':
      return '/messages'
    case 'coffee_received':
      if (notif.relatedUser?._id) return `/profile/${notif.relatedUser._id}`
      return null
    default:
      return null
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
    case 'like': return <Heart className="h-5 w-5 text-red-500" />
    case 'comment': return <MessageCircle className="h-5 w-5 text-blue-500" />
    case 'post_flagged': return <AlertTriangle className="h-5 w-5 text-error" />
    case 'follow': return <UserPlus className="h-5 w-5 text-green-500" />
    case 'chat_message': return <MessageCircle className="h-5 w-5 text-purple-500" />
    default: return <Bell className="h-5 w-5 text-on-surface-variant" />
  }
}

export default function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const handler = (notif) => {
      setUnreadCount(prev => prev + 1)
      setNotifications(prev => [notif, ...prev])
    }
    socket.on('notification:new', handler)
    return () => socket.off('notification:new', handler)
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const { data } = await notificationAPI.getAll({ limit: 50 })
      setNotifications(data.data?.notifications || data.data || [])
      setUnreadCount(data.data?.unreadCount || 0)
    } catch (err) {
      console.error('Failed to load notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id)
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {}
  }

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {}
  }

  const deleteNotif = async (e, id) => {
    e.stopPropagation()
    try {
      await notificationAPI.delete(id)
      const removed = notifications.find(n => n._id === id)
      setNotifications(prev => prev.filter(n => n._id !== id))
      if (removed && !removed.isRead) setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {}
  }

  const clearAll = async () => {
    const flaggedCount = notifications.filter(n => n.type === 'post_flagged').length
    const message = flaggedCount > 0 
      ? `Clear all notifications except ${flaggedCount} flagged post notification(s)? This cannot be undone.`
      : 'Clear all notifications? This cannot be undone.'
    
    if (!window.confirm(message)) return
    
    try {
      await notificationAPI.clearAll()
      // Keep flagged notifications, remove others
      const flaggedNotifs = notifications.filter(n => n.type === 'post_flagged')
      setNotifications(flaggedNotifs)
      setUnreadCount(0)
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-outline-variant/30 border-t-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-3 sm:px-6 py-6 sm:py-8">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-headline text-xl sm:text-2xl font-bold tracking-tight text-on-surface">Notifications</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 rounded-xl border border-outline-variant/30 px-4 py-2 text-sm font-medium text-on-surface-variant transition hover:bg-surface-container-high"
            >
              <Check className="h-4 w-4" /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-2 rounded-xl border border-error/30 px-4 py-2 text-sm font-medium text-error transition hover:bg-error-container/30"
            >
              <Trash2 className="h-4 w-4" /> Clear all
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-outline-variant/20 rounded-2xl border border-outline-variant/20 bg-surface-container-low">
        {notifications.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Bell className="mx-auto mb-3 h-12 w-12 text-outline-variant/30" />
            <p className="text-sm text-on-surface-variant">No notifications yet.</p>
            <p className="mt-1 text-xs text-on-surface-variant">
              You'll be notified when someone likes, comments, or follows you.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => {
                if (!notif.isRead) markAsRead(notif._id)
                const link = getNotifLink(notif)
                if (link) navigate(link)
              }}
              className={`flex items-start gap-4 px-4 sm:px-6 py-4 transition cursor-pointer ${
                notif.isRead ? 'hover:bg-surface-container-high/50' : 'bg-primary-fixed/10 hover:bg-primary-fixed/20'
              }`}
            >
              <div className={`mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                notif.isRead ? 'bg-surface-container-high' : 'bg-surface border-2 border-primary'
              }`}>
                {getNotifIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-relaxed ${notif.isRead ? 'text-on-surface-variant' : 'text-on-surface font-medium'}`}>
                  {notif.message}
                </p>
                <p className="mt-1 text-xs text-on-surface-variant">{timeAgo(notif.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!notif.isRead && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
                {notif.type !== 'post_flagged' && (
                  <button
                    onClick={(e) => deleteNotif(e, notif._id)}
                    className="rounded-md p-1 text-on-surface-variant/40 transition hover:bg-error-container/30 hover:text-error"
                    title="Delete notification"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {notif.type === 'post_flagged' && (
                  <div className="rounded-md bg-error/10 px-2 py-1 text-xs font-medium text-error">
                    Required Action
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
