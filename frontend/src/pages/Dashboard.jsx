import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, TrendingUp, Bell, ArrowRight, PenSquare, Clock, Loader2, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { userAPI, draftAPI, notificationAPI, blogAPI } from '../services/api'
import PageTabs from '../components/PageTabs'
import ConfirmDialog from '../components/ConfirmDialog'
import { showToast } from '../utils/toast'

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">{label}</p>
        <Icon className="h-4 w-4 text-primary/40" />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-on-surface">{value}</p>
      {sub && <p className="mt-1 text-xs text-on-surface-variant">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [userBlogs, setUserBlogs] = useState([])
  const [drafts, setDrafts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null) // { type: 'blog'|'draft', id, title }

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.allSettled([
      userAPI.getUserBlogs(user._id, { limit: 6 }),
      draftAPI.getAll({ limit: 5 }),
      notificationAPI.getAll({ limit: 8 }),
    ]).then(([blogsRes, draftsRes, notifsRes]) => {
      if (blogsRes.status === 'fulfilled') setUserBlogs(blogsRes.value.data.data || [])
      if (draftsRes.status === 'fulfilled') setDrafts(draftsRes.value.data.data || [])
      if (notifsRes.status === 'fulfilled') {
        const nData = notifsRes.value.data.data
        setNotifications(nData?.notifications || [])
        setUnreadCount(nData?.unreadCount || 0)
      }
    }).finally(() => setLoading(false))
  }, [user])

  const markRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id)
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {}
  }

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {}
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      if (deleteTarget.type === 'blog') {
        await blogAPI.deleteBlog(deleteTarget.id)
        setUserBlogs(prev => prev.filter(b => b._id !== deleteTarget.id))
        showToast.success('Article deleted successfully')
      } else {
        await draftAPI.delete(deleteTarget.id)
        setDrafts(prev => prev.filter(d => d._id !== deleteTarget.id))
        showToast.success('Draft deleted successfully')
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to delete')
    }
    setDeleteTarget(null)
  }

  return (
    <div className="px-4 sm:px-6 py-2">
      <div className="mx-auto max-w-5xl">
        <PageTabs />
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-on-surface-variant" /></div>
        ) : (
        <>
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="font-headline text-3xl font-semibold tracking-tight text-on-surface">Welcome back, {user?.name?.split(' ')[0] || 'Editor'}.</h1>
            <p className="mt-1 text-sm text-on-surface-variant">Here is a summary of your recent literary endeavors.</p>
          </div>
          <Link
            to="/create"
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary transition hover:bg-primary-container hover:text-on-primary-container"
          >
            <PenSquare className="h-4 w-4" /> New Story
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard icon={Users} label="Followers" value={user?.followersCount || 0} />
          <StatCard icon={TrendingUp} label="Published" value={userBlogs.length} sub={`${drafts.length} drafts in progress`} />
          <StatCard icon={Bell} label="Notifications" value={unreadCount} sub="unread" />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Recent Drafts */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-on-surface">Recent Drafts</h2>
              <Link to="/drafts" className="flex items-center gap-1 text-xs text-primary transition hover:underline">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {drafts.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-outline-variant/30 p-6 text-center text-sm text-on-surface-variant">No drafts yet. Start writing!</p>
              ) : drafts.map(draft => (
                <div key={draft._id} className="flex items-center justify-between rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 transition hover:border-outline-variant/40">
                  <Link to={`/create?draft=${draft._id}`} className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-on-surface truncate">{draft.title || 'Untitled Draft'}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-on-surface-variant">
                      <Clock className="h-3 w-3" />
                      Saved {new Date(draft.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </Link>
                  <div className="ml-4 flex flex-shrink-0 items-center gap-2">
                    <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs text-on-surface-variant capitalize">{draft.category}</span>
                    <button
                      onClick={() => setDeleteTarget({ type: 'draft', id: draft._id, title: draft.title || 'Untitled draft' })}
                      className="rounded-md p-1 text-on-surface-variant hover:bg-error-container/30 hover:text-error transition"
                      title="Delete draft"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Published stories */}
            <div className="mb-4 mt-8 flex items-center justify-between">
              <h2 className="text-base font-semibold text-on-surface">Published Stories</h2>
              <Link to="/feed" className="flex items-center gap-1 text-xs text-primary transition hover:underline">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-outline-variant/20 rounded-2xl border border-outline-variant/20 bg-surface-container-low">
              {userBlogs.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-on-surface-variant">No published stories yet.</p>
              ) : userBlogs.map(blog => (
                <div key={blog._id} className="flex items-center justify-between px-4 py-3 group">
                  <Link to={`/blog/${blog.slug || blog._id}`} className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-on-surface truncate group-hover:text-primary transition">{blog.title}</p>
                    <p className="text-xs text-on-surface-variant">{blog.likesCount || 0} likes · {blog.commentsCount || 0} comments</p>
                  </Link>
                  <div className="ml-4 flex flex-shrink-0 items-center gap-2">
                    <span className="text-xs text-on-surface-variant">
                      {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <button
                      onClick={() => navigate(`/edit/${blog._id}`)}
                      className="rounded-md p-1 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ type: 'blog', id: blog._id, title: blog.title })}
                      className="rounded-md p-1 text-on-surface-variant hover:bg-error-container/30 hover:text-error transition"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications + Profile */}
          <div className="space-y-6">
            {/* Profile card */}
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-surface-container-high flex items-center justify-center text-sm font-semibold text-on-surface-variant overflow-hidden">
                  {user?.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : user?.name?.[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">{user?.name}</p>
                  <p className="text-xs text-on-surface-variant capitalize">{user?.role}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-4 border-t border-outline-variant/20 pt-4">
                <div className="text-center">
                  <p className="text-lg font-semibold text-on-surface">{user?.followersCount || 0}</p>
                  <p className="text-xs text-on-surface-variant">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-on-surface">{user?.followingCount || 0}</p>
                  <p className="text-xs text-on-surface-variant">Following</p>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-on-surface">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
                  )}
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-on-primary">{unreadCount}</span>
                </div>
              </div>
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-xs text-on-surface-variant">No notifications yet.</p>
                ) : notifications.map(n => (
                  <div
                    key={n._id}
                    onClick={() => !n.isRead && markRead(n._id)}
                    className={`cursor-pointer rounded-xl p-3 text-xs transition ${n.isRead ? 'text-on-surface-variant' : 'bg-primary-fixed/20 text-on-surface font-medium hover:bg-primary-fixed/30'}`}
                  >
                    {n.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={deleteTarget?.type === 'blog' ? 'Delete Article' : 'Delete Draft'}
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
