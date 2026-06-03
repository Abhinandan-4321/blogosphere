import axios from 'axios'

const API_BASE = '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 30000,
})

// Attach access token to every request & track activity
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    localStorage.setItem('lastActiveAt', Date.now().toString())
  }
  return config
})

// Handle 401 — attempt token refresh once
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')

        const { data } = await axios.post(`${API_BASE}/auth/refresh-token`, {
          refreshToken,
        })
        const newAccess = data.data.accessToken
        const newRefresh = data.data.refreshToken
        localStorage.setItem('accessToken', newAccess)
        localStorage.setItem('refreshToken', newRefresh)
        api.defaults.headers.Authorization = `Bearer ${newAccess}`
        processQueue(null, newAccess)
        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

// ────────── Auth ──────────
export const authAPI = {
  register: (body) => api.post('/auth/register', body),
  login: (body) => api.post('/auth/login', body),
  sendOtp: (body) => api.post('/auth/send-otp', body),
  verifyOtp: (body) => api.post('/auth/verify-otp', body),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (body) => api.post('/auth/forgot-password', body),
  resetPassword: (body) => api.post('/auth/reset-password', body),
}

// ────────── Users ──────────
export const userAPI = {
  getMe: () => api.get('/users/me'),
  updateProfile: (body) => api.put('/users/me', body),
  updateAvatar: (data) =>
    api.put('/users/me/avatar', data, data instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }
      : {}
    ),
  changePassword: (body) => api.put('/users/me/password', body),
  getLikedPosts: (params) => api.get('/users/me/liked-posts', { params }),
  getUserProfile: (id) => api.get(`/users/${id}`),
  getUserBlogs: (id, params) => api.get(`/users/${id}/blogs`, { params }),
  toggleFollow: (id) => api.post(`/users/${id}/follow`),
  removeFollower: (id) => api.delete(`/users/${id}/follower`),
  getFollowers: (id, params) => api.get(`/users/${id}/followers`, { params }),
  getFollowing: (id, params) => api.get(`/users/${id}/following`, { params }),
}

// ────────── Blogs ──────────
export const blogAPI = {
  getBlogs: (params) => api.get('/blogs', { params }),
  getFeed: (params) => api.get('/blogs/feed', { params }),
  getTrending: (params) => api.get('/blogs/trending', { params }),
  getBlogBySlug: (slug) => api.get(`/blogs/${slug}`),
  createBlog: (formData) =>
    api.post('/blogs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    }),
  updateBlog: (id, formData) =>
    api.put(`/blogs/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    }),
  toggleVisibility: (id, visibility) =>
    api.patch(`/blogs/${id}/visibility`, { visibility }),
  deleteBlog: (id) => api.delete(`/blogs/${id}`),
  toggleLike: (blogId) => api.post(`/blogs/${blogId}/like`),
  getLikeStatus: (blogId) => api.get(`/blogs/${blogId}/like`),
  getLikers: (blogId, params) => api.get(`/blogs/${blogId}/likers`, { params }),
  getComments: (blogId, params) =>
    api.get(`/blogs/${blogId}/comments`, { params }),
  addComment: (blogId, body) => api.post(`/blogs/${blogId}/comments`, body),
  deleteComment: (blogId, commentId) =>
    api.delete(`/blogs/${blogId}/comments/${commentId}`),
}

// ────────── Notifications ──────────
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete('/notifications'),
}

// ────────── Drafts ──────────
export const draftAPI = {
  getAll: (params) => api.get('/drafts', { params }),
  getOne: (id) => api.get(`/drafts/${id}`),
  delete: (id) => api.delete(`/drafts/${id}`),
}

// ────────── Bookmarks ──────────
export const bookmarkAPI = {
  toggleBookmark: (blogId, folder) => api.post(`/bookmarks/${blogId}`, { folder }),
  getAll: (params) => api.get('/bookmarks', { params }),
  getFolders: () => api.get('/bookmarks/folders'),
  updateFolder: (blogId, folder) => api.patch(`/bookmarks/${blogId}/folder`, { folder }),
  getStatus: (blogId) => api.get(`/bookmarks/${blogId}/status`),
}

// ────────── Chat / Conversations ──────────
export const chatAPI = {
  getMutualFollowers: () => api.get('/conversations/mutual'),
  getConversations: () => api.get('/conversations'),
  getOrCreate: (userId) => api.post('/conversations', { userId }),
  getMessages: (convId, params) => api.get(`/conversations/${convId}/messages`, { params }),
  sendMessage: (convId, content) => api.post(`/conversations/${convId}/messages`, { content }),
  sendImage: (convId, formData) =>
    api.post(`/conversations/${convId}/messages/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  markRead: (convId) => api.patch(`/conversations/${convId}/read`),
  hideConversation: (convId) => api.patch(`/conversations/${convId}/hide`),
  unhideConversation: (convId) => api.patch(`/conversations/${convId}/unhide`),
  listWhiteboards: (convId) => api.get(`/conversations/${convId}/whiteboards`),
  createWhiteboard: (convId, name) => api.post(`/conversations/${convId}/whiteboard`, { name }),
  getWhiteboard: (convId, wbId) => api.get(`/conversations/${convId}/whiteboard/${wbId}`),
  saveWhiteboard: (convId, wbId, sceneData) => api.put(`/conversations/${convId}/whiteboard/${wbId}`, { sceneData }),
}

// ────────── Upload ──────────
export const uploadAPI = {
  uploadImage: (file) => {
    const formData = new FormData()
    formData.append('coverImage', file)
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

// ────────── Payments ──────────
export const paymentAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verifyPayment: (data) => api.post('/payments/verify', data),
  getReceivedPayments: (params) => api.get('/payments/received', { params }),
  getSentPayments: (params) => api.get('/payments/sent', { params }),
  getPublicSupporters: (userId, params) => api.get(`/payments/supporters/${userId}`, { params }),
  getStats: () => api.get('/payments/stats'),
}

// ────────── Admin ──────────
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  approveUser: (id) => api.patch(`/admin/users/${id}/approve`),
  changeRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  deleteBlog: (id) => api.delete(`/admin/blogs/${id}`),
}

export default api
