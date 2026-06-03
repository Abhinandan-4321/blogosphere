import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Send, RotateCcw, ChevronDown } from 'lucide-react'
import { aiAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const QUICK_ACTIONS = [
  { id: 'summarize', emoji: '📝', label: 'Summarize this blog', message: 'Summarize this blog article in a few sentences.' },
  { id: 'keypoints', emoji: '📌', label: 'Key takeaways', message: 'What are the key takeaways from this article?' },
  { id: 'simplify', emoji: '🔤', label: 'Simplify for me', message: 'Explain the main idea in simple, easy-to-understand language.' },
  { id: 'quiz', emoji: '❓', label: 'Quiz me on this', message: 'Ask me 3 comprehension questions based on this article.' },
  { id: 'related', emoji: '🔗', label: 'Related topics to explore', message: 'What related topics should I explore after reading this?' },
]

// Simple markdown-like renderer for AI responses
function AIMessageContent({ content }) {
  const lines = content.split('\n')
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="font-semibold text-on-surface">{line.slice(2, -2)}</p>
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={i} className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
              <span>{line.slice(2).replace(/\*\*(.*?)\*\*/g, (_, m) => m)}</span>
            </div>
          )
        }
        if (line.match(/^\d+\./)) {
          const [num, ...rest] = line.split('. ')
          return (
            <div key={i} className="flex gap-2">
              <span className="flex-shrink-0 font-semibold text-primary">{num}.</span>
              <span>{rest.join('. ').replace(/\*\*(.*?)\*\*/g, (_, m) => m)}</span>
            </div>
          )
        }
        if (line.trim() === '') return <div key={i} className="h-1" />
        return <p key={i}>{line.replace(/\*\*(.*?)\*\*/g, (_, m) => m)}</p>
      })}
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-surface-container px-4 py-3">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-on-surface-variant [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-on-surface-variant [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-on-surface-variant [animation-delay:300ms]" />
      </div>
    </div>
  )
}

export default function AIBlogChat({ blog }) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const panelRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen, messages])

  const sendMessage = async (text) => {
    const messageText = text || input.trim()
    if (!messageText || loading) return

    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    setInput('')
    setShowQuickActions(false)

    const userMsg = { id: Date.now(), role: 'user', content: messageText }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setLoading(true)

    try {
      const { data } = await aiAPI.blogChat({
        blogTitle: blog.title,
        blogContent: blog.content,
        userMessage: messageText,
        chatHistory: messages,
      })

      const aiMsg = { id: Date.now() + 1, role: 'ai', content: data.data.reply }
      setMessages([...updatedMessages, aiMsg])
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Something went wrong. Please try again.'
      const errorMsg = { id: Date.now() + 1, role: 'ai', content: errMsg, isError: true }
      setMessages([...updatedMessages, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setShowQuickActions(true)
  }

  const openPanel = () => {
    setIsOpen(true)
  }

  return (
    <>
      {/* ─── Trigger Button ─── */}
      {!isOpen && (
        <button
          onClick={openPanel}
          className="fixed right-5 top-1/2 z-40 -translate-y-1/2 flex flex-col items-center gap-1.5 rounded-2xl bg-primary px-3 py-4 text-on-primary shadow-xl transition hover:scale-105 hover:shadow-2xl active:scale-95 md:right-6"
          title="Ask AI about this article"
        >
          <Sparkles className="h-5 w-5" />
          <span
            className="text-[10px] font-semibold tracking-wide"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            Ask AI
          </span>
        </button>
      )}

      {/* ─── Panel Overlay (mobile) ─── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ─── Chat Panel ─── */}
      <div
        ref={panelRef}
        className={`fixed z-50 flex flex-col bg-surface-container-lowest shadow-2xl transition-all duration-300 ease-in-out
          /* Mobile: bottom sheet */
          bottom-0 left-0 right-0 rounded-t-3xl border-t border-outline-variant/20
          md:bottom-auto md:left-auto md:right-0 md:top-[4.5rem] md:h-[calc(100vh-4.5rem)] md:w-[380px] md:rounded-none md:rounded-l-3xl md:border-l md:border-t md:border-outline-variant/20
          ${isOpen
            ? 'translate-y-0 opacity-100 md:translate-x-0'
            : 'translate-y-full opacity-0 md:translate-x-full md:translate-y-0 pointer-events-none'
          }`}
        style={{ maxHeight: isOpen ? '78vh' : undefined }}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="h-1 w-10 rounded-full bg-outline-variant/40" />
        </div>

        {/* ─── Header ─── */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-outline-variant/15 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-on-surface">AI Assistant</h3>
              <p className="text-[10px] text-on-surface-variant">Ask anything about this article</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                title="Clear chat"
                className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-high transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-high transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ─── Messages Area ─── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 overscroll-contain">
          {/* Welcome message */}
          {messages.length === 0 && (
            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-surface-container px-4 py-3 text-sm text-on-surface-variant max-w-[85%]">
                Hi! I've read this article. Ask me anything about it, or pick a quick action below. 👇
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {msg.role === 'ai' && (
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'rounded-br-sm bg-primary text-on-primary'
                    : msg.isError
                    ? 'rounded-bl-sm bg-error-container text-on-error-container'
                    : 'rounded-bl-sm bg-surface-container text-on-surface'
                }`}
              >
                {msg.role === 'ai' && !msg.isError ? (
                  <AIMessageContent content={msg.content} />
                ) : (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* ─── Quick Action Chips ─── */}
        {showQuickActions && messages.length === 0 && (
          <div className="flex-shrink-0 border-t border-outline-variant/10 px-4 py-3">
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Quick actions
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => sendMessage(action.message)}
                  disabled={loading}
                  className="flex items-center gap-2.5 rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2.5 text-left text-xs text-on-surface transition hover:bg-surface-container-high hover:border-primary/30 disabled:opacity-50"
                >
                  <span className="text-base">{action.emoji}</span>
                  <span className="font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Input Bar ─── */}
        <div className="flex-shrink-0 border-t border-outline-variant/15 px-4 py-3 pb-safe">
          {!isAuthenticated ? (
            <button
              onClick={() => navigate('/login')}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-on-primary transition hover:opacity-90"
            >
              Sign in to ask AI
            </button>
          ) : (
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about this article…"
                rows={1}
                maxLength={500}
                disabled={loading}
                className="flex-1 resize-none rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2.5 text-sm text-on-surface outline-none placeholder-on-surface-variant/50 transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
                style={{ lineHeight: '1.5' }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary transition hover:opacity-90 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}
          <p className="mt-1.5 text-[10px] text-on-surface-variant/50 text-center">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </>
  )
}
