import { io } from 'socket.io-client'

let socket = null

export const connectSocket = (token) => {
  if (socket?.connected) return socket

  socket = io('http://localhost:5000', {
    auth: { token },
    transports: ['websocket', 'polling'],
  })

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason)
  })

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message)
  })

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const getSocket = () => socket

// Convenience helpers
export const joinBlogRoom = (blogId) => {
  socket?.emit('blog:join', blogId)
}

export const leaveBlogRoom = (blogId) => {
  socket?.emit('blog:leave', blogId)
}

export const saveDraft = (data) => {
  socket?.emit('draft:save', data)
}

// Chat helpers
export const joinChatRoom = (conversationId) => {
  socket?.emit('chat:join', conversationId)
}

export const leaveChatRoom = (conversationId) => {
  socket?.emit('chat:leave', conversationId)
}

export const emitTyping = (conversationId, isTyping) => {
  socket?.emit('chat:typing', { conversationId, isTyping })
}

// Whiteboard helpers
export const joinWhiteboardRoom = (whiteboardId) => {
  socket?.emit('whiteboard:join', whiteboardId)
}

export const leaveWhiteboardRoom = (whiteboardId) => {
  socket?.emit('whiteboard:leave', whiteboardId)
}

export const emitWhiteboardUpdate = (whiteboardId, elements, appState) => {
  socket?.emit('whiteboard:update', { whiteboardId, elements, appState })
}

export const emitWhiteboardCursor = (whiteboardId, cursor) => {
  socket?.emit('whiteboard:cursor', { whiteboardId, cursor })
}
