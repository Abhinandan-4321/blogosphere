import { useState, useEffect } from 'react'
import { X, Send, Loader2, Reply, Trash2 } from 'lucide-react'
import { blogAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { getSocket, joinBlogRoom, leaveBlogRoom } from '../services/socket'

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function CommentItem({ comment, blogId, currentUserId, onReply, onDelete, depth = 0 }) {
  const isOwn = currentUserId === comment.author?._id

  return (
    <div className={depth > 0 ? 'ml-8 border-l-2 border-outline-variant/20 pl-4' : ''}>
      <div className="flex gap-3 group">
        <div className="mt-0.5 h-7 w-7 flex-shrink-0 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-medium text-on-surface-variant overflow-hidden">
          {comment.author?.avatar ? <img src={comment.author.avatar} alt="" className="h-full w-full object-cover" /> : comment.author?.name?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-on-surface">{comment.author?.name}</span>
            <span className="text-[10px] text-on-surface-variant">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="mt-0.5 text-sm leading-relaxed text-on-surface-variant">{comment.content}</p>
          <div className="mt-1.5 flex items-center gap-3">
            {depth === 0 && (
              <button
                onClick={() => onReply(comment._id, comment.author?.name)}
                className="flex items-center gap-1 text-[10px] text-on-surface-variant hover:text-on-surface transition"
              >
                <Reply className="h-3 w-3" /> Reply
              </button>
            )}
            {isOwn && (
              <button
                onClick={() => onDelete(comment._id)}
                className="flex items-center gap-1 text-[10px] text-on-surface-variant hover:text-error transition opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies?.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply._id}
              comment={reply}
              blogId={blogId}
              currentUserId={currentUserId}
              onReply={onReply}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CommentModal({ blog, onClose }) {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [replyToName, setReplyToName] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!blog?._id) return
    setLoading(true)
    blogAPI.getComments(blog._id, { limit: 50 })
      .then(({ data }) => setComments(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))

    joinBlogRoom(blog._id)

    const socket = getSocket()
    const handler = (comment) => {
      if (comment.parentComment) {
        setComments(prev => prev.map(c =>
          c._id === comment.parentComment
            ? { ...c, replies: [...(c.replies || []), comment] }
            : c
        ))
      } else {
        setComments(prev => [{ ...comment, replies: [] }, ...prev])
      }
    }
    socket?.on('comment:new', handler)

    return () => {
      leaveBlogRoom(blog._id)
      socket?.off('comment:new', handler)
    }
  }, [blog?._id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || !isAuthenticated) return
    setSubmitting(true)
    try {
      const body = { content: newComment.trim() }
      if (replyTo) body.parentComment = replyTo
      const { data } = await blogAPI.addComment(blog._id, body)

      if (replyTo) {
        setComments(prev => prev.map(c =>
          c._id === replyTo
            ? { ...c, replies: [...(c.replies || []), data.data] }
            : c
        ))
      } else {
        setComments(prev => [{ ...data.data, replies: [] }, ...prev])
      }
      setNewComment('')
      setReplyTo(null)
      setReplyToName('')
    } catch {} finally {
      setSubmitting(false)
    }
  }

  const handleReply = (commentId, authorName) => {
    setReplyTo(commentId)
    setReplyToName(authorName)
  }

  const handleDelete = async (commentId) => {
    try {
      await blogAPI.deleteComment(blog._id, commentId)
      setComments(prev => {
        // Try removing as top-level comment
        const filtered = prev.filter(c => c._id !== commentId)
        if (filtered.length < prev.length) return filtered
        // Try removing as a reply
        return prev.map(c => ({
          ...c,
          replies: (c.replies || []).filter(r => r._id !== commentId),
        }))
      })
    } catch {}
  }

  const cancelReply = () => {
    setReplyTo(null)
    setReplyToName('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="popup-enter w-full max-w-lg rounded-t-2xl bg-surface-container-low shadow-2xl sm:rounded-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-on-surface">Responses</h2>
            <p className="mt-0.5 text-xs text-on-surface-variant line-clamp-1">{blog.title}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Comments list */}
        <div className="max-h-96 overflow-y-auto px-6 py-4 space-y-5">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-on-surface-variant" /></div>
          ) : comments.length === 0 ? (
            <p className="py-8 text-center text-sm text-on-surface-variant">No responses yet. Be the first to share your thoughts.</p>
          ) : (
            comments.map(comment => (
              <CommentItem
                key={comment._id}
                comment={comment}
                blogId={blog._id}
                currentUserId={user?._id}
                onReply={handleReply}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* Reply indicator */}
        {replyTo && (
          <div className="mx-6 mb-1 flex items-center justify-between rounded-xl bg-surface-container px-3 py-2">
            <p className="text-xs text-on-surface-variant">Replying to <span className="font-medium text-on-surface">{replyToName}</span></p>
            <button onClick={cancelReply} className="text-xs text-on-surface-variant hover:text-on-surface">Cancel</button>
          </div>
        )}

        {/* Comment input */}
        <div className="border-t border-outline-variant/20 px-6 py-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder={replyTo ? `Reply to ${replyToName}…` : 'Share your thoughts…'}
              className="flex-1 rounded-xl border border-outline-variant/30 bg-surface px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/50 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting || !isAuthenticated}
              className="flex-shrink-0 rounded-xl bg-primary p-2.5 text-on-primary transition hover:bg-primary-container hover:text-on-primary-container disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
