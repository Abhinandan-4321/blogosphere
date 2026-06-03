import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Clock, Search, SlidersHorizontal, Loader2, Bookmark } from 'lucide-react'
import { blogAPI, bookmarkAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import CommentModal from '../components/CommentModal'
import SaveModal from '../components/SaveModal'
import ImageCarousel from '../components/ImageCarousel'
import LikeTooltip from '../components/LikeTooltip'

const categories = ['all', 'technology', 'lifestyle', 'travel', 'food', 'design', 'general']

function BlogCard({ blog, onCommentClick }) {
  const { isAuthenticated } = useAuth()
  const [liked, setLiked] = useState(blog.isLiked || false)
  const [likesCount, setLikesCount] = useState(blog.likesCount || 0)
  const [bookmarked, setBookmarked] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    bookmarkAPI.getStatus(blog._id)
      .then(({ data }) => setBookmarked(data.data.bookmarked))
      .catch(() => {})
  }, [blog._id, isAuthenticated])

  const handleLike = async () => {
    if (!isAuthenticated) return
    try {
      const { data } = await blogAPI.toggleLike(blog._id)
      setLiked(data.data.liked)
      setLikesCount(data.data.likesCount)
    } catch {
      // Revert optimistic update on error
    }
  }

  const handleSaveClick = () => {
    if (!isAuthenticated) return
    if (bookmarked) {
      // Remove bookmark
      bookmarkAPI.toggleBookmark(blog._id)
        .then(() => setBookmarked(false))
        .catch(() => {})
    } else {
      // Show save modal
      setShowSaveModal(true)
    }
  }

  return (
    <article className="group rounded-2xl border border-outline-variant/15 bg-surface-container-low p-5 transition hover:border-outline-variant/30 hover:shadow-sm">
      <div className="flex gap-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Link to={`/profile/${blog.author?._id}`} className="h-7 w-7 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-medium text-on-surface-variant overflow-hidden">
              {blog.author?.avatar ? <img src={blog.author.avatar} alt="" className="h-full w-full object-cover" /> : blog.author?.name?.[0]}
            </Link>
            <Link to={`/profile/${blog.author?._id}`} className="text-sm font-medium text-on-surface hover:text-primary transition">{blog.author?.name}</Link>
            <span className="text-outline-variant">·</span>
            <span className="text-xs text-on-surface-variant">{new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
          <Link to={`/blog/${blog.slug || blog._id}`}>
            <h2 className="font-headline text-xl font-semibold leading-snug tracking-tight text-on-surface transition group-hover:text-primary">
              {blog.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant line-clamp-2">{blog.excerpt}</p>
          </Link>
          <div className="mt-3 flex items-center gap-4">
            <span className="inline-flex items-center rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs font-medium text-on-surface-variant">
              {blog.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-on-surface-variant">
              <Clock className="h-3 w-3" /> {blog.readTime} min read
            </span>
            <LikeTooltip blogId={blog._id}>
              <button onClick={handleLike} className={`flex items-center gap-1 text-xs transition ${
                liked ? 'text-red-500' : 'text-on-surface-variant hover:text-red-400'
              }`}>
                <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-red-500' : ''}`} /> {likesCount}
              </button>
            </LikeTooltip>
            <button onClick={() => onCommentClick(blog)} className="flex items-center gap-1 text-xs text-on-surface-variant transition hover:text-on-surface">
              <MessageCircle className="h-3.5 w-3.5" /> {blog.commentsCount || 0}
            </button>
            <button 
              onClick={handleSaveClick}
              className={`flex items-center gap-1 text-xs transition ${
                bookmarked ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? 'fill-on-surface' : ''}`} />
            </button>
          </div>
        </div>
        {(blog.images?.length > 0 || blog.coverImage) && (
          <ImageCarousel
            images={blog.images?.length > 0 ? blog.images : [blog.coverImage]}
            className="h-24 w-36 flex-shrink-0"
          />
        )}
      </div>
      {showSaveModal && (
        <SaveModal 
          blog={blog} 
          onClose={() => setShowSaveModal(false)}
          onSave={() => setBookmarked(true)}
        />
      )}
    </article>
  )
}

export default function Feed() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedBlog, setSelectedBlog] = useState(null)
  const [blogs, setBlogs] = useState([])
  const [trending, setTrending] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filter panel state
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('latest')
  const [filterTag, setFilterTag] = useState('')
  const [minReadTime, setMinReadTime] = useState('')
  const [maxReadTime, setMaxReadTime] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Fetch trending once
  useEffect(() => {
    blogAPI.getTrending({ limit: 5 })
      .then(({ data }) => setTrending(data.data || []))
      .catch(() => {})
  }, [])

  const fetchBlogs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 10 }
      if (activeCategory !== 'all') params.category = activeCategory
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim()
      if (sortBy === 'popular') params.sort = 'popular'
      if (sortBy === 'oldest') params.sort = 'oldest'
      if (filterTag.trim()) params.tag = filterTag.trim().toLowerCase()
      if (minReadTime) params.minReadTime = minReadTime
      if (maxReadTime) params.maxReadTime = maxReadTime
      if (dateFrom) params.dateFrom = dateFrom
      if (dateTo) params.dateTo = dateTo
      const { data } = await blogAPI.getBlogs(params)
      setBlogs(data.data || [])
      setTotalPages(data.pagination?.pages || 1)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load blogs')
    } finally {
      setLoading(false)
    }
  }, [page, activeCategory, debouncedSearch, sortBy, filterTag, minReadTime, maxReadTime, dateFrom, dateTo])

  useEffect(() => {
    fetchBlogs()
  }, [fetchBlogs])

  useEffect(() => {
    setPage(1)
  }, [activeCategory, debouncedSearch, sortBy, filterTag, minReadTime, maxReadTime, dateFrom, dateTo])

  const clearFilters = () => {
    setSortBy('latest')
    setFilterTag('')
    setMinReadTime('')
    setMaxReadTime('')
    setDateFrom('')
    setDateTo('')
  }

  const hasActiveFilters = sortBy !== 'latest' || filterTag || minReadTime || maxReadTime || dateFrom || dateTo

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
        <div className="flex gap-8">
          {/* Main feed */}
          <main className="flex-1 min-w-0">
            {/* Search + filter bar */}
            <div className="mb-4 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                  placeholder="Search chronicles… (partial match supported)"
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low py-2.5 pl-9 pr-4 text-sm text-on-surface placeholder-on-surface-variant/50 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
                {searchInput && (
                  <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                    ✕
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${
                  showFilters || hasActiveFilters
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" /> Filter
                {hasActiveFilters && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-on-primary" />}
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="popup-enter mb-6 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-on-surface">Filters</h3>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-xs text-primary hover:underline">Clear all</button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="min-w-0">
                    <label className="mb-1 block text-xs font-medium text-on-surface-variant">Sort by</label>
                    <select
                      value={sortBy} onChange={e => setSortBy(e.target.value)}
                      className="w-full rounded-xl border border-outline-variant/30 bg-surface px-3 py-2 text-xs text-on-surface outline-none focus:border-primary"
                    >
                      <option value="latest">Latest</option>
                      <option value="popular">Most Popular</option>
                      <option value="oldest">Oldest</option>
                    </select>
                  </div>
                  <div className="min-w-0">
                    <label className="mb-1 block text-xs font-medium text-on-surface-variant">Tag</label>
                    <input
                      type="text" value={filterTag} onChange={e => setFilterTag(e.target.value)}
                      placeholder="e.g. minimalism"
                      className="w-full rounded-xl border border-outline-variant/30 bg-surface px-3 py-2 text-xs text-on-surface outline-none placeholder-on-surface-variant/50 focus:border-primary"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="mb-1 block text-xs font-medium text-on-surface-variant">Read time (min)</label>
                    <div className="flex gap-2">
                      <input type="number" value={minReadTime} onChange={e => setMinReadTime(e.target.value)} placeholder="Min" min="1"
                        className="w-full min-w-0 rounded-xl border border-outline-variant/30 bg-surface px-2 py-2 text-xs text-on-surface outline-none placeholder-on-surface-variant/50 focus:border-primary" />
                      <input type="number" value={maxReadTime} onChange={e => setMaxReadTime(e.target.value)} placeholder="Max" min="1"
                        className="w-full min-w-0 rounded-xl border border-outline-variant/30 bg-surface px-2 py-2 text-xs text-on-surface outline-none placeholder-on-surface-variant/50 focus:border-primary" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <label className="mb-1 block text-xs font-medium text-on-surface-variant">Date range</label>
                    <div className="flex gap-2">
                      <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                        className="w-full min-w-0 rounded-xl border border-outline-variant/30 bg-surface px-2 py-2 text-xs text-on-surface outline-none focus:border-primary" />
                      <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                        className="w-full min-w-0 rounded-xl border border-outline-variant/30 bg-surface px-2 py-2 text-xs text-on-surface outline-none focus:border-primary" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Category tabs */}
            <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-medium capitalize transition ${
                    activeCategory === cat
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="mb-4 rounded-2xl bg-surface-container-low border border-outline-variant/15 p-4">
              <h1 className="font-headline text-xl font-semibold tracking-tight text-on-surface">Recent Chronicles</h1>
              <p className="mt-0.5 text-xs text-on-surface-variant">A curated collection of thought, design, and minimalist living.</p>
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-on-surface-variant" /></div>
            ) : error ? (
              <div className="py-16 text-center">
                <p className="text-error">{error}</p>
                <button onClick={fetchBlogs} className="mt-3 text-sm text-primary hover:underline">Retry</button>
              </div>
            ) : blogs.length === 0 ? (
              <div className="py-16 text-center text-on-surface-variant">No stories found.</div>
            ) : (
              <>
                <div className="space-y-3">
                  {blogs.map(blog => (
                    <BlogCard key={blog._id} blog={blog} onCommentClick={setSelectedBlog} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="mt-5 flex justify-center gap-2">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-xl border border-outline-variant/30 px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container disabled:opacity-40">Previous</button>
                    <span className="flex items-center text-xs text-on-surface-variant">Page {page} of {totalPages}</span>
                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-xl border border-outline-variant/30 px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container disabled:opacity-40">Next</button>
                  </div>
                )}
              </>
            )}
          </main>

          {/* Sidebar */}
          <aside className="hidden w-64 flex-shrink-0 lg:block">
            <div className="sticky top-24 space-y-4">
              {/* Trending - Top Liked This Week */}
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
                <h3 className="mb-4 text-sm font-semibold text-on-surface">Trending This Week</h3>
                {trending.length === 0 ? (
                  <p className="text-xs text-on-surface-variant">No trending posts yet.</p>
                ) : (
                  <div className="space-y-4">
                    {trending.map((blog, i) => (
                      <Link key={blog._id} to={`/blog/${blog.slug || blog._id}`} className="flex items-start gap-3 group">
                        <span className="flex-shrink-0 text-2xl font-bold text-outline-variant/30 leading-none">0{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-snug text-on-surface line-clamp-2 group-hover:text-primary transition">{blog.title}</p>
                          <p className="mt-1 text-xs text-on-surface-variant">{blog.author?.name} · {blog.recentLikes} likes this week</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
                <h3 className="mb-4 text-sm font-semibold text-on-surface">Trending Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {['minimalism', 'design', 'writing', 'technology', 'lifestyle', 'creativity'].map(tag => (
                    <button
                      key={tag}
                      onClick={() => { setFilterTag(tag); setShowFilters(true) }}
                      className="rounded-full bg-surface-container-high px-3 py-1 text-xs text-on-surface-variant transition hover:bg-surface-variant"
                    >#{tag}</button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {selectedBlog && (
        <CommentModal blog={selectedBlog} onClose={() => setSelectedBlog(null)} />
      )}
    </>
  )
}
