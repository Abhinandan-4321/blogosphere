import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Heart, MessageCircle, Clock, ArrowLeft, Loader2, Share2 } from 'lucide-react'
import { blogAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { getSocket } from '../services/socket'
import CommentModal from '../components/CommentModal'

export default function ArticleDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [blog, setBlog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [showComments, setShowComments] = useState(false)

  useEffect(() => {
    let currentBlogId = null

    const fetchBlog = async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await blogAPI.getBlogBySlug(slug)
        const blogData = data.data
        setBlog(blogData)
        setLiked(blogData.isLiked || false)
        setLikesCount(blogData.likesCount || 0)
        currentBlogId = blogData._id

        // Join blog room for real-time updates
        const socket = getSocket()
        if (socket && currentBlogId) {
          socket.emit('blog:join', currentBlogId)
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Blog not found')
      } finally {
        setLoading(false)
      }
    }
    fetchBlog()

    // Listen for like updates from other users
    const socket = getSocket()
    if (socket) {
      socket.on('blog:like-updated', ({ blogId, likesCount: newCount }) => {
        setBlog(prev => prev && prev._id === blogId ? { ...prev, likesCount: newCount } : prev)
        setLikesCount(newCount)
      })
    }

    // Cleanup
    return () => {
      const s = getSocket()
      if (s) {
        if (currentBlogId) s.emit('blog:leave', currentBlogId)
        s.off('blog:like-updated')
      }
    }
  }, [slug])

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    try {
      const { data } = await blogAPI.toggleLike(blog._id)
      setLiked(data.data.liked)
      setLikesCount(data.data.likesCount)
    } catch {
      // Silently fail
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-on-surface-variant" />
      </div>
    )
  }

  if (error || !blog) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="text-error mb-4">{error || 'Blog not found'}</p>
        <Link to="/feed" className="text-sm text-primary hover:text-primary-container">
          ← Back to feed
        </Link>
      </div>
    )
  }

  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-12">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Article header */}
        <header className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant capitalize">
              {blog.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-on-surface-variant">
              <Clock className="h-3 w-3" /> {blog.readTime} min read
            </span>
          </div>

          <h1 className="font-headline text-4xl md:text-5xl font-normal leading-tight mb-6">
            {blog.title}
          </h1>

          <div className="flex items-center justify-between border-b border-outline-variant pb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-surface-container flex items-center justify-center text-sm font-semibold text-on-surface-variant overflow-hidden">
                {blog.author?.avatar ? (
                  <img src={blog.author.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  blog.author?.name?.[0]
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-on-surface">{blog.author?.name}</p>
                <p className="text-xs text-on-surface-variant">
                  {new Date(blog.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition ${
                  liked
                    ? 'bg-error-container text-error'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                {likesCount}
              </button>
              <button
                onClick={() => setShowComments(true)}
                className="flex items-center gap-1.5 rounded-lg bg-surface-container px-3 py-2 text-sm text-on-surface-variant hover:bg-surface-container-high transition"
              >
                <MessageCircle className="h-4 w-4" />
                {blog.commentsCount || 0}
              </button>
              <button className="rounded-lg bg-surface-container p-2 text-on-surface-variant hover:bg-surface-container-high transition">
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Cover image */}
        {blog.coverImage && (
          <div className="mb-10 overflow-hidden rounded-2xl">
            <img
              src={blog.coverImage}
              alt={blog.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Article content */}
        <div className="prose prose-headings:font-headline prose-headings:tracking-tight max-w-none">
          <div
            className="font-body text-base leading-relaxed text-on-surface"
            style={{ lineHeight: '1.8' }}
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </div>

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-outline-variant">
            <div className="flex flex-wrap gap-2">
              {blog.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-surface-container px-3 py-1 text-xs text-on-surface-variant"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Author bio */}
        {blog.author?.bio && (
          <div className="mt-12 rounded-2xl bg-surface-container p-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 flex-shrink-0 rounded-full bg-surface-container-high flex items-center justify-center text-lg font-semibold text-on-surface-variant overflow-hidden">
                {blog.author?.avatar ? (
                  <img src={blog.author.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  blog.author?.name?.[0]
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-on-surface mb-1">
                  Written by {blog.author.name}
                </p>
                <p className="text-sm text-on-surface-variant leading-relaxed">{blog.author.bio}</p>
              </div>
            </div>
          </div>
        )}
      </article>

      {showComments && <CommentModal blog={blog} onClose={() => setShowComments(false)} />}
    </>
  )
}
