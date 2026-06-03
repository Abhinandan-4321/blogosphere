import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, BookOpen, BarChart3, Shield, Trash2, CheckCircle, ChevronDown, Loader2, ArrowLeft } from 'lucide-react'
import { adminAPI } from '../services/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    adminAPI.getDashboard()
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setLoading(false))

    adminAPI.getUsers({ limit: 50 })
      .then(({ data }) => setUsers(data.data || []))
      .catch(() => {})
      .finally(() => setUsersLoading(false))
  }, [])

  const handleApprove = async (userId) => {
    try {
      await adminAPI.approveUser(userId)
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isApproved: true } : u))
    } catch {}
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminAPI.changeRole(userId, newRole)
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u))
    } catch {}
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Permanently delete this user and all their content?')) return
    try {
      await adminAPI.deleteUser(userId)
      setUsers(prev => prev.filter(u => u._id !== userId))
    } catch {}
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/dashboard" className="text-on-surface-variant hover:text-on-surface transition">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Shield className="h-5 w-5 text-on-surface-variant" />
            <h1 className="font-headline text-2xl font-semibold text-on-surface">Admin Dashboard</h1>
          </div>
          <p className="text-sm text-on-surface-variant">Manage users, content, and site settings.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-1 border-b border-outline-variant/20">
        {['overview', 'users'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition ${
              activeTab === tab ? 'border-b-2 border-primary text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-on-surface-variant" /></div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Total Users" value={stats.totalUsers || 0} />
              <StatCard icon={BookOpen} label="Total Blogs" value={stats.totalBlogs || 0} />
              <StatCard icon={BarChart3} label="Total Likes" value={stats.totalLikes || 0} />
              <StatCard icon={Users} label="Pending Approval" value={stats.pendingUsers || 0} />
            </div>
          ) : (
            <p className="text-center text-on-surface-variant">Failed to load stats.</p>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          {usersLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-on-surface-variant" /></div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-outline-variant/20 bg-surface-container-low">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-outline-variant/20 bg-surface-container">
                  <tr>
                    <th className="px-4 py-3 font-medium text-on-surface-variant">User</th>
                    <th className="px-4 py-3 font-medium text-on-surface-variant">Email</th>
                    <th className="px-4 py-3 font-medium text-on-surface-variant">Role</th>
                    <th className="px-4 py-3 font-medium text-on-surface-variant">Status</th>
                    <th className="px-4 py-3 font-medium text-on-surface-variant">Joined</th>
                    <th className="px-4 py-3 font-medium text-on-surface-variant">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-surface-container-high/50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-medium text-on-surface-variant overflow-hidden">
                            {u.avatar ? <img src={u.avatar} alt="" className="h-full w-full object-cover" /> : u.name?.[0]}
                          </div>
                          <span className="font-medium text-on-surface">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant text-xs">{u.email}</td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="rounded-lg border border-outline-variant/30 bg-surface px-2 py-1 text-xs text-on-surface outline-none focus:border-primary"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {u.isApproved ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">
                            <CheckCircle className="h-3 w-3" /> Approved
                          </span>
                        ) : (
                          <button
                            onClick={() => handleApprove(u._id)}
                            className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700 hover:bg-amber-100 transition"
                          >
                            Pending
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">
                        {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="rounded-md p-1.5 text-on-surface-variant/40 hover:bg-error-container/30 hover:text-error transition"
                          title="Delete user"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">{label}</p>
        <Icon className="h-4 w-4 text-outline-variant/40" />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-on-surface">{value}</p>
    </div>
  )
}
