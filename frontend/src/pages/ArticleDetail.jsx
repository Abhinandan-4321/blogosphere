import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Heart, MessageCircle, Clock, ArrowLeft, Loader2, Share2, Languages, X, Flag, AlertTriangle } from 'lucide-react'
import { blogAPI, adminAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { getSocket } from '../services/socket'
import CommentModal from '../components/CommentModal'
import AIBlogChat from '../components/AIBlogChat'

export default function ArticleDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [blog, setBlog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [showComments, setShowComments] = useState(false)
  const [translatedContent, setTranslatedContent] = useState(null)
  const [translatedTitle, setTranslatedTitle] = useState(null)
  const [translating, setTranslating] = useState(false)
  const [activeLang, setActiveLang] = useState(null)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [flagReason, setFlagReason] = useState('')
  const [flagging, setFlagging] = useState(false)

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

  const LANGUAGES = [
    { code: 'hi', name: 'Hindi' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh-CN', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'bn', name: 'Bengali' },
    { code: 'ta', name: 'Tamil' },
  ]

  const translateText = async (text, targetLang) => {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
    )
    const data = await res.json()
    return data[0].map(s => s[0]).join('')
  }

  const handleTranslate = async (langCode) => {
    if (activeLang === langCode) {
      setTranslatedContent(null)
      setTranslatedTitle(null)
      setActiveLang(null)
      setShowLangMenu(false)
      return
    }
    setTranslating(true)
    setShowLangMenu(false)
    try {
      // Create a temporary container to parse HTML
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = blog.content
      
      // Extract all text nodes and translate them
      const textNodes = []
      const walker = document.createTreeWalker(
        tempDiv,
        NodeFilter.SHOW_TEXT,
        null,
        false
      )
      let node
      while (node = walker.nextNode()) {
        if (node.textContent.trim()) {
          textNodes.push(node)
        }
      }
      
      // Translate all text nodes
      const translations = {}
      for (const textNode of textNodes) {
        const text = textNode.textContent.trim()
        if (text && !translations[text]) {
          translations[text] = await translateText(text, langCode)
        }
      }
      
      // Replace text in HTML while preserving structure
      let translatedHtml = blog.content
      for (const [original, translated] of Object.entries(translations)) {
        // Escape special regex characters
        const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        translatedHtml = translatedHtml.replace(new RegExp(escaped, 'g'), translated)
      }
      
      setTranslatedContent(translatedHtml)
      setTranslatedTitle(await translateText(blog.title, langCode))
      setActiveLang(langCode)
    } catch {
      setTranslatedContent(null)
      setTranslatedTitle(null)
    } finally {
      setTranslating(false)
    }
  }

  const handleFlagPost = async () => {
    if (!flagReason.trim()) return
    setFlagging(true)
    try {
      await adminAPI.flagPost(blog._id, flagReason.trim())
      setShowFlagModal(false)
      setFlagReason('')
      // Refresh blog to show flagged state
      const { data } = await blogAPI.getBlogBySlug(slug)
      setBlog(data.data)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to flag post')
    } finally {
      setFlagging(false)
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
            {translatedTitle || blog.title}
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
              {user?.role === 'admin' && !blog.flagged && (
                <button 
                  onClick={() => setShowFlagModal(true)}
                  className="rounded-lg bg-error/10 p-2 text-error hover:bg-error/20 transition"
                  title="Flag post for moderation"
                >
                  <Flag className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Flagged warning banner */}
        {blog.flagged && (
          <div className="mb-6 rounded-xl border-2 border-error bg-error/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-error mb-1">This post has been flagged for moderation</p>
                <p className="text-xs text-on-surface-variant mb-2"><strong>Reason:</strong> {blog.flagReason}</p>
                <p className="text-xs text-on-surface-variant">
                  <strong>Deadline:</strong> {new Date(blog.deletionDeadline).toLocaleString('en-US', { 
                    month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' 
                  })}
                </p>
                {user?._id === blog.author?._id && (
                  <p className="text-xs text-error font-medium mt-2">⚠️ Please delete this post within the deadline or it will be automatically removed.</p>
                )}
              </div>
            </div>
          </div>
        )}

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

        {/* Translation bar */}
        <div className="mb-6 flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition ${
                activeLang
                  ? 'border-primary bg-primary-container/20 text-primary'
                  : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <Languages className="h-4 w-4" />
              {activeLang ? `Translated · ${LANGUAGES.find(l => l.code === activeLang)?.name}` : 'Translate'}
              {translating && <Loader2 className="h-3 w-3 animate-spin" />}
            </button>
            {showLangMenu && (
              <div className="popup-enter absolute left-0 top-10 z-20 w-48 max-h-64 overflow-y-auto rounded-xl border border-outline-variant/30 bg-surface-container-low py-1 shadow-xl">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => handleTranslate(lang.code)}
                    className={`flex w-full items-center gap-2 px-4 py-2 text-xs transition hover:bg-surface-container ${
                      activeLang === lang.code ? 'text-primary font-medium' : 'text-on-surface-variant'
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {activeLang && (
            <button
              onClick={() => { setTranslatedContent(null); setTranslatedTitle(null); setActiveLang(null) }}
              className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface transition"
            >
              <X className="h-3 w-3" /> Show original
            </button>
          )}
        </div>

        {/* Article content */}
        <div className="prose prose-headings:font-headline prose-headings:tracking-tight max-w-none">
          <div
            className="font-body text-base leading-relaxed text-on-surface"
            style={{ lineHeight: '1.8' }}
            dangerouslySetInnerHTML={{ __html: translatedContent || blog.content }}
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
      <AIBlogChat blog={blog} />

      {/* Flag Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowFlagModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-surface-container-low p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-error/10 p-2">
                <Flag className="h-5 w-5 text-error" />
              </div>
              <h3 className="text-lg font-semibold text-on-surface">Flag Post for Moderation</h3>
            </div>
            <p className="mb-4 text-sm text-on-surface-variant">
              The author will be notified and given 2 days to delete the post before automatic removal.
            </p>
            <div className="mb-4">
              <label className="mb-2 block text-xs font-medium text-on-surface-variant">Reason for flagging *</label>
              <textarea
                value={flagReason}
                onChange={e => setFlagReason(e.target.value)}
                placeholder="Explain why this post violates community guidelines..."
                className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface outline-none placeholder-on-surface-variant/50 focus:border-error focus:ring-2 focus:ring-error/10 resize-none"
                rows={4}
                maxLength={500}
              />
              <p className="mt-1 text-xs text-on-surface-variant">{flagReason.length}/500</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowFlagModal(false); setFlagReason('') }}
                className="flex-1 rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container transition"
              >
                Cancel
              </button>
              <button
                onClick={handleFlagPost}
                disabled={!flagReason.trim() || flagging}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-error px-4 py-2.5 text-sm font-medium text-on-error hover:bg-error/90 transition disabled:opacity-40"
              >
                {flagging ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
                {flagging ? 'Flagging...' : 'Flag Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
