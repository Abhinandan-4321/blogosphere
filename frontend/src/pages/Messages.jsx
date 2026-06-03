import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Send, ImageIcon, ArrowLeft, Loader2, MessageCircle, Search, Check, CheckCheck, Pencil, PenTool, EyeOff, AlertCircle } from 'lucide-react'
import CollabWhiteboard from '../components/CollabWhiteboard'
import { chatAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { getSocket, joinChatRoom, leaveChatRoom, emitTyping } from '../services/socket'
import { showToast } from '../utils/toast'

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000)
  if (seconds < 60) return 'now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(date) {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function shouldShowDate(messages, index) {
  if (index === 0) return true
  const curr = new Date(messages[index].createdAt).toDateString()
  const prev = new Date(messages[index - 1].createdAt).toDateString()
  return curr !== prev
}

export default function Messages() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeConvId = searchParams.get('conv')
  const startWithUser = searchParams.get('user')

  const [conversations, setConversations] = useState([])
  const [mutuals, setMutuals] = useState([])
  const [messages, setMessages] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [msgLoading, setMsgLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [typingUser, setTypingUser] = useState(null)
  const [showNewChat, setShowNewChat] = useState(false)
  const [mutualSearch, setMutualSearch] = useState('')
  const [activeWhiteboard, setActiveWhiteboard] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const typingTimer = useRef(null)

  // Load conversations + mutuals
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [convRes, mutualRes] = await Promise.all([
          chatAPI.getConversations(),
          chatAPI.getMutualFollowers(),
        ])
        setConversations(convRes.data.data || [])
        setMutuals(mutualRes.data.data || [])
      } catch (err) {
        console.error('Failed to load conversations:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Start chat with a user from ?user= param
  useEffect(() => {
    if (!startWithUser || loading) return
    handleStartChat(startWithUser)
  }, [startWithUser, loading])

  // Load active conversation
  useEffect(() => {
    if (!activeConvId) {
      setActiveConv(null)
      setMessages([])
      return
    }
    const conv = conversations.find(c => c._id === activeConvId)
    if (conv) {
      setActiveConv(conv)
      loadMessages(activeConvId)
      chatAPI.markRead(activeConvId).catch(() => {})
      setConversations(prev => prev.map(c =>
        c._id === activeConvId ? { ...c, unreadCount: 0 } : c
      ))
    }
  }, [activeConvId, conversations.length])

  // Socket listeners
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const onMessage = ({ conversationId, message }) => {
      if (conversationId === activeConvId) {
        setMessages(prev => [...prev, message])
        chatAPI.markRead(conversationId).catch(() => {})
        scrollToBottom()
      }
      // Update conversation list
      setConversations(prev => {
        const updated = prev.map(c => {
          if (c._id === conversationId) {
            return {
              ...c,
              lastMessage: message,
              lastMessageAt: message.createdAt,
              unreadCount: conversationId === activeConvId ? 0 : (c.unreadCount || 0) + 1,
            }
          }
          return c
        })
        return updated.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
      })
    }

    const onTyping = ({ conversationId, userId: typerId, isTyping }) => {
      if (conversationId === activeConvId && typerId !== user?._id) {
        setTypingUser(isTyping ? typerId : null)
      }
    }

    const onRead = ({ conversationId }) => {
      if (conversationId === activeConvId) {
        setMessages(prev => prev.map(m =>
          m.sender?._id === user?._id && !m.readAt ? { ...m, readAt: new Date() } : m
        ))
      }
    }

    socket.on('chat:message', onMessage)
    socket.on('chat:typing', onTyping)
    socket.on('chat:read', onRead)

    return () => {
      socket.off('chat:message', onMessage)
      socket.off('chat:typing', onTyping)
      socket.off('chat:read', onRead)
    }
  }, [activeConvId, user?._id])

  // Join/leave chat rooms
  useEffect(() => {
    if (activeConvId) {
      joinChatRoom(activeConvId)
      return () => leaveChatRoom(activeConvId)
    }
  }, [activeConvId])

  const loadMessages = async (convId) => {
    setMsgLoading(true)
    try {
      const { data } = await chatAPI.getMessages(convId, { limit: 50 })
      setMessages(data.data || [])
      setTimeout(scrollToBottom, 100)
    } catch (err) {
      console.error('Failed to load messages:', err)
    } finally {
      setMsgLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!input.trim() || !activeConvId || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)

    // Optimistic add
    const tempMsg = {
      _id: `temp-${Date.now()}`,
      sender: { _id: user._id, name: user.name, avatar: user.avatar },
      content: text,
      messageType: 'text',
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempMsg])
    scrollToBottom()

    try {
      const { data } = await chatAPI.sendMessage(activeConvId, text)
      setMessages(prev => prev.map(m => m._id === tempMsg._id ? data.data : m))
      setConversations(prev => {
        const updated = prev.map(c =>
          c._id === activeConvId
            ? { ...c, lastMessage: data.data, lastMessageAt: data.data.createdAt }
            : c
        )
        return updated.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
      })
    } catch (err) {
      setMessages(prev => prev.filter(m => m._id !== tempMsg._id))
      setInput(text)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleImageSend = async (e) => {
    const files = e.target.files
    if (!files?.length || !activeConvId) return

    const formData = new FormData()
    for (let i = 0; i < Math.min(files.length, 5); i++) {
      formData.append('images', files[i])
    }

    try {
      const { data } = await chatAPI.sendImage(activeConvId, formData)
      setMessages(prev => [...prev, data.data])
      scrollToBottom()
      setConversations(prev => {
        const updated = prev.map(c =>
          c._id === activeConvId
            ? { ...c, lastMessage: data.data, lastMessageAt: data.data.createdAt }
            : c
        )
        return updated.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
      })
    } catch (err) {
      console.error('Image upload failed:', err)
    }
    e.target.value = ''
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)
    if (activeConvId) {
      emitTyping(activeConvId, true)
      clearTimeout(typingTimer.current)
      typingTimer.current = setTimeout(() => {
        emitTyping(activeConvId, false)
      }, 2000)
    }
  }

  const handleHideConversation = async (convId, e) => {
    e?.stopPropagation()
    try {
      await chatAPI.hideConversation(convId)
      setConversations(prev => prev.filter(c => c._id !== convId))
      if (activeConvId === convId) {
        setSearchParams({})
        setActiveConv(null)
        setMessages([])
      }
      showToast.success('Conversation hidden')
    } catch (err) {
      showToast.error('Failed to hide conversation')
    }
  }

  const handleStartChat = async (userId) => {
    try {
      const { data } = await chatAPI.getOrCreate(userId)
      const conv = data.data
      // Add to conversations if not already there
      setConversations(prev => {
        const exists = prev.find(c => c._id === conv._id)
        if (exists) return prev
        return [conv, ...prev]
      })
      setSearchParams({ conv: conv._id })
      setShowNewChat(false)
    } catch (err) {
      console.error('Failed to start chat:', err)
    }
  }

  const selectConversation = (convId) => {
    setSearchParams({ conv: convId })
  }

  const filteredMutuals = mutuals.filter(m => {
    // Filter out users who already have a conversation
    const hasConv = conversations.some(c => c.otherUser?._id === m._id)
    const matchesSearch = m.name.toLowerCase().includes(mutualSearch.toLowerCase())
    return !hasConv && matchesSearch
  })

  const getLastMessagePreview = (conv) => {
    if (!conv.lastMessage) return 'No messages yet'
    if (conv.lastMessage.messageType === 'image') return '📷 Image'
    if (conv.lastMessage.messageType === 'whiteboard') return '🎨 Whiteboard'
    return conv.lastMessage.content?.substring(0, 40) || ''
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-7rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-on-surface-variant" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] rounded-2xl border border-outline-variant/20 mx-6 overflow-hidden bg-surface-container-low">
      {/* Sidebar: Conversation List */}
      <aside className={`flex flex-col border-r border-outline-variant/20 bg-surface-container-low ${activeConvId ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-shrink-0`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 bg-gradient-to-r from-surface-container-low to-surface-container px-5 py-4">
          <h1 className="text-lg font-semibold tracking-tight text-on-surface">Messages</h1>
          <button
            onClick={() => setShowNewChat(!showNewChat)}
            className="rounded-lg p-2 text-on-surface-variant transition hover:bg-surface-container-high"
            title="New conversation"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>

        {/* New Chat Panel */}
        {showNewChat && (
          <div className="border-b border-outline-variant/20 bg-surface-container p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Start a conversation</p>
            <input
              type="text"
              value={mutualSearch}
              onChange={e => setMutualSearch(e.target.value)}
              placeholder="Search mutual followers…"
              className="mb-3 w-full rounded-xl border border-outline-variant/30 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
            />
            <div className="max-h-40 overflow-y-auto space-y-1">
              {filteredMutuals.length === 0 ? (
                <p className="text-xs text-on-surface-variant py-2 text-center">
                  {mutuals.length === 0 ? 'No mutual followers yet. Follow someone who follows you back!' : 'No matches.'}
                </p>
              ) : filteredMutuals.map(m => (
                <button
                  key={m._id}
                  onClick={() => handleStartChat(m._id)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-white"
                >
                  <div className="h-8 w-8 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-medium text-on-surface-variant overflow-hidden flex-shrink-0">
                    {m.avatar ? <img src={m.avatar} alt="" className="h-full w-full object-cover" /> : m.name?.[0]}
                  </div>
                  <span className="text-sm font-medium text-on-surface truncate">{m.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && !showNewChat ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-container-high/50">
                <MessageCircle className="h-10 w-10 text-outline-variant/40" />
              </div>
              <p className="font-headline text-base font-medium text-on-surface mb-1">No conversations yet</p>
              <p className="text-xs text-on-surface-variant mb-4 max-w-[200px]">Start chatting with your mutual followers</p>
              <button
                onClick={() => setShowNewChat(true)}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary transition hover:bg-primary-container hover:text-on-primary-container"
              >
                New conversation
              </button>
            </div>
          ) : (
            conversations.map(conv => (
              <div key={conv._id} className="relative group">
                <button
                  onClick={() => selectConversation(conv._id)}
                  className={`flex w-full items-center gap-3 px-5 py-4 text-left transition ${
                    activeConvId === conv._id ? 'bg-surface-container' : 'hover:bg-surface-container-high/50'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="h-11 w-11 rounded-full bg-surface-container-high flex items-center justify-center text-sm font-medium text-on-surface-variant overflow-hidden">
                      {conv.otherUser?.avatar
                        ? <img src={conv.otherUser.avatar} alt="" className="h-full w-full object-cover" />
                        : conv.otherUser?.name?.[0]}
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-on-primary">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold text-on-surface' : 'font-medium text-on-surface'}`}>
                          {conv.otherUser?.name}
                        </p>
                        {conv.otherUser?.deletedAt && (
                          <span className="flex-shrink-0 rounded-full bg-error-container px-2 py-0.5 text-[9px] font-medium text-error">
                            Deleted
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-on-surface-variant flex-shrink-0 ml-2">
                        {conv.lastMessageAt ? timeAgo(conv.lastMessageAt) : ''}
                      </span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'font-medium text-on-surface' : 'text-on-surface-variant'}`}>
                      {getLastMessagePreview(conv)}
                    </p>
                  </div>
                </button>
                <button
                  onClick={(e) => handleHideConversation(conv._id, e)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition bg-surface-container-high hover:bg-error-container/30 hover:text-error"
                  title="Hide conversation"
                >
                  <EyeOff className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className={`flex flex-1 flex-col ${activeConvId ? 'flex' : 'hidden md:flex'}`}>
        {!activeConv ? (
          <div className="chat-bg flex flex-1 flex-col items-center justify-center text-center px-6">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-surface-container-high/40">
              <MessageCircle className="h-12 w-12 text-outline-variant/30" />
            </div>
            <h2 className="font-headline text-xl font-semibold text-on-surface mb-2">Your messages</h2>
            <p className="text-sm text-on-surface-variant max-w-xs leading-relaxed">
              Select a conversation or start a new one with your mutual followers.
            </p>
            <div className="mt-6 flex gap-3">
              <div className="flex items-center gap-1.5 rounded-full bg-surface-container-high/50 px-3 py-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                <span className="text-[10px] text-on-surface-variant">End-to-end private</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-surface-container-high/50 px-3 py-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                <span className="text-[10px] text-on-surface-variant">Real-time sync</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 border-b border-outline-variant/20 bg-surface-container-low px-5 py-3">
              <button
                onClick={() => setSearchParams({})}
                className="rounded-lg p-1.5 text-on-surface-variant transition hover:bg-surface-container-high md:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Link to={`/profile/${activeConv.otherUser?._id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-9 w-9 rounded-full bg-surface-container-high flex items-center justify-center text-sm font-medium text-on-surface-variant overflow-hidden flex-shrink-0">
                  {activeConv.otherUser?.avatar
                    ? <img src={activeConv.otherUser.avatar} alt="" className="h-full w-full object-cover" />
                    : activeConv.otherUser?.name?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-on-surface truncate">{activeConv.otherUser?.name}</p>
                  {typingUser && <p className="text-xs text-green-600">typing…</p>}
                </div>
              </Link>
              <button
                onClick={async () => {
                  try {
                    const { data } = await chatAPI.createWhiteboard(activeConvId, 'Collaboration Board')
                    const wb = data.data
                    setActiveWhiteboard(wb.whiteboard._id)
                    setMessages(prev => [...prev, wb.message])
                    scrollToBottom()
                  } catch (err) {
                    console.error('Failed to create whiteboard:', err)
                  }
                }}
                className="flex items-center gap-1.5 rounded-xl border border-outline-variant/30 px-3 py-1.5 text-xs font-medium text-on-surface-variant transition hover:bg-surface-container-high"
                title="Start collaborative whiteboard"
              >
                <PenTool className="h-3.5 w-3.5" /> Whiteboard
              </button>
            </div>

            {/* Messages */}
            <div className="chat-bg flex-1 overflow-y-auto px-5 py-4 space-y-1">
              {msgLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-on-surface-variant" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container-high/40">
                    <Send className="h-7 w-7 text-outline-variant/30" />
                  </div>
                  <p className="font-headline text-base font-medium text-on-surface mb-1">Start the conversation</p>
                  <p className="text-xs text-on-surface-variant">Say hello and break the ice!</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMine = msg.sender?._id === user?._id
                  const showDate = shouldShowDate(messages, i)
                  const isLastMine = isMine && (i === messages.length - 1 || messages[i + 1]?.sender?._id !== user?._id)
                  return (
                    <div key={msg._id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-medium text-on-surface-variant">
                            {formatDate(msg.createdAt)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-0.5`}>
                        <div className={`max-w-[70%] ${isMine ? 'order-2' : 'order-1'}`}>
                          {/* Text message */}
                          {msg.messageType === 'text' && (
                            <div className={`bubble-shadow rounded-2xl px-4 py-2.5 ${
                              isMine
                                ? 'bg-primary text-on-primary rounded-br-md'
                                : 'bg-surface-container-lowest text-on-surface rounded-bl-md border border-outline-variant/10'
                            }`}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          )}
                          {/* Image message */}
                          {msg.messageType === 'image' && msg.images?.length > 0 && (
                            <div className={`rounded-2xl overflow-hidden ${
                              isMine ? 'rounded-br-md' : 'rounded-bl-md'
                            }`}>
                              <div className={`grid gap-1 ${msg.images.length > 1 ? 'grid-cols-2' : ''}`}>
                                {msg.images.map((img, idx) => (
                                  <a key={idx} href={img} target="_blank" rel="noopener noreferrer">
                                    <img src={img} alt="" className="max-w-full rounded-lg object-cover max-h-64" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Whiteboard message */}
                          {msg.messageType === 'whiteboard' && (
                            <div className={`rounded-2xl overflow-hidden border ${
                              isMine
                                ? 'border-primary-container bg-primary text-on-primary rounded-br-md'
                                : 'border-outline-variant/20 bg-surface-container-low text-on-surface rounded-bl-md'
                            }`} style={{ minWidth: '220px' }}>
                              <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isMine ? 'bg-primary-container/30' : 'bg-surface-container-high'}`}>
                                  <PenTool className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold">Collaboration Board</p>
                                  <p className={`text-[11px] ${isMine ? 'text-on-primary/70' : 'text-on-surface-variant'}`}>
                                    {isMine ? 'You started a whiteboard' : `${msg.sender?.name || 'User'} started a whiteboard`}
                                  </p>
                                </div>
                              </div>
                              <div className="px-4 pb-3 pt-2">
                                <button
                                  onClick={() => msg.whiteboardId && setActiveWhiteboard(msg.whiteboardId)}
                                  className={`w-full rounded-xl py-2 text-xs font-semibold transition ${
                                    isMine
                                      ? 'bg-on-primary text-primary hover:bg-on-primary/90'
                                      : 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container'
                                  }`}
                                >
                                  {isMine ? 'Open Whiteboard' : 'Join Whiteboard'}
                                </button>
                              </div>
                            </div>
                          )}
                          {/* Timestamp + read receipt */}
                          <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[10px] text-on-surface-variant">{formatTime(msg.createdAt)}</span>
                            {isMine && isLastMine && (
                              msg.readAt
                                ? <CheckCheck className="h-3 w-3 text-primary" />
                                : <Check className="h-3 w-3 text-on-surface-variant" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-outline-variant/20 bg-gradient-to-t from-surface-container-low to-surface-container-low/80 px-5 py-4">
              {activeConv?.otherUser?.deletedAt ? (
                <div className="flex items-center gap-3 rounded-2xl border border-error/30 bg-error-container/20 px-4 py-3">
                  <AlertCircle className="h-5 w-5 text-error flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-error">User account deleted</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">You can view past messages but cannot send new ones.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg p-2.5 text-on-surface-variant transition hover:bg-surface-container-high"
                    title="Send image"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSend}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message…"
                    rows={1}
                    className="flex-1 resize-none rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none placeholder-on-surface-variant/50 transition focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-sm"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className="rounded-xl bg-primary p-2.5 text-on-primary transition hover:bg-primary-container hover:text-on-primary-container disabled:opacity-40"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Whiteboard Overlay */}
      {activeWhiteboard && activeConvId && (
        <CollabWhiteboard
          conversationId={activeConvId}
          whiteboardId={activeWhiteboard}
          onClose={() => setActiveWhiteboard(null)}
        />
      )}
    </div>
  )
}
