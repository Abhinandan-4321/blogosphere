import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Loader2 } from 'lucide-react'
import { userAPI } from '../services/api'
import PageTabs from '../components/PageTabs'

export default function LikedPosts() {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchLiked = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await userAPI.getLikedPosts({ limit: 50 })
      setBlogs(data.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load liked posts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLiked() }, [fetchLiked])

  return (
    <div className="px-3 sm:px-6 py-2">
      <div className="mx-auto max-w-5xl">
        <PageTabs />
        <h1 className="font-headline text-2xl sm:text-3xl font-semibold tracking-tight text-on-surface">Liked Posts</h1>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
          Stories you've appreciated with a like. Show some love to great writing.
        </p>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-on-surface-variant" /></div>
        ) : error ? (
          <div className="mt-16 text-center">
            <p className="text-error">{error}</p>
            <button onClick={fetchLiked} className="mt-3 text-sm text-primary hover:underline">Retry</button>
          </div>
        ) : blogs.length === 0 ? (
          <div className="mt-16 text-center">
            <Heart className="mx-auto mb-4 h-10 w-10 text-outline-variant/40" />
            <p className="text-on-surface-variant">No liked posts yet.</p>
            <Link to="/feed" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">Explore chronicles</Link>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {blogs.map(blog => (
              <article key={blog._id} className="flex gap-3 sm:gap-5 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-3 sm:p-5 transition hover:border-outline-variant/40">
                {blog.coverImage && (
                  <div className="h-16 w-20 sm:h-20 sm:w-28 flex-shrink-0 overflow-hidden rounded-xl bg-surface-container">
                    <img src={blog.coverImage} alt={blog.title} className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="flex flex-1 flex-col justify-between min-w-0">
                  <div>
                    <Link to={`/blog/${blog.slug || blog._id}`}>
                      <h2 className="text-base font-semibold leading-snug text-on-surface transition hover:text-primary">{blog.title}</h2>
                    </Link>
                    <p className="mt-1 text-xs leading-relaxed text-on-surface-variant line-clamp-2">{blog.excerpt}</p>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-xs text-on-surface-variant">By {blog.author?.name}</span>
                    <span className="text-outline-variant">·</span>
                    <span className="inline-flex items-center rounded-full bg-surface-container-high px-2 py-0.5 text-xs text-on-surface-variant capitalize">{blog.category}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
