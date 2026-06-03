import { useState, useEffect, useRef, useCallback } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import { X, Save, Loader2, Users, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react'
import { chatAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { getSocket } from '../services/socket'

export default function CollabWhiteboard({
  conversationId,
  whiteboardId,
  onClose,
}) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [initialData, setInitialData] = useState(null)
  const [whiteboardName, setWhiteboardName] = useState('')
  const [peerConnected, setPeerConnected] = useState(false)
  const [autoSave, setAutoSave] = useState(() => localStorage.getItem('wb_autosave') === 'true')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState('')
  const [showCloseWarning, setShowCloseWarning] = useState(false)
  const excalidrawRef = useRef(null)
  const debounceRef = useRef(null)
  const autoSaveRef = useRef(null)
  const isRemoteUpdate = useRef(false)

  // Load whiteboard data
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await chatAPI.getWhiteboard(conversationId, whiteboardId)
        const wb = data.data
        setWhiteboardName(wb.name || 'Untitled Whiteboard')
        setInitialData(wb.sceneData || { elements: [], appState: {} })
      } catch (err) {
        console.error('Failed to load whiteboard:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [conversationId, whiteboardId])

  // Join whiteboard room + listen for remote updates
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    socket.emit('whiteboard:join', whiteboardId)
    console.log('[Whiteboard] Joined room:', whiteboardId)

    const onUpdate = ({ elements, appState, userId: senderId }) => {
      if (senderId === user?._id) return
      setPeerConnected(true)
      const api = excalidrawRef.current
      if (!api) return

      isRemoteUpdate.current = true
      try {
        api.updateScene({
          elements: JSON.parse(JSON.stringify(elements)),
        })
      } catch (err) {
        console.error('[Whiteboard] Failed to apply remote update:', err)
      }
      setTimeout(() => {
        isRemoteUpdate.current = false
      }, 200)
    }

    socket.on('whiteboard:update', onUpdate)

    const onPeerJoined = () => {
      console.log('[Whiteboard] Peer joined!')
      setPeerConnected(true)
    }
    socket.on('whiteboard:peer-joined', onPeerJoined)

    return () => {
      socket.off('whiteboard:update', onUpdate)
      socket.off('whiteboard:peer-joined', onPeerJoined)
      socket.emit('whiteboard:leave', whiteboardId)
      console.log('[Whiteboard] Left room:', whiteboardId)
    }
  }, [whiteboardId, user?._id])

  // Persist autoSave preference
  useEffect(() => {
    localStorage.setItem('wb_autosave', autoSave.toString())
  }, [autoSave])

  // Autosave timer
  useEffect(() => {
    if (!autoSave) {
      clearInterval(autoSaveRef.current)
      return
    }
    autoSaveRef.current = setInterval(() => {
      if (!hasUnsavedChanges) return
      doSave(true)
    }, 15000)
    return () => clearInterval(autoSaveRef.current)
  }, [autoSave, hasUnsavedChanges, conversationId, whiteboardId])

  // Handle local changes — debounced broadcast
  const handleChange = useCallback(
    (elements, appState) => {
      if (isRemoteUpdate.current) return
      if (!elements || elements.length === 0) return

      setHasUnsavedChanges(true)

      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const socket = getSocket()
        if (!socket?.connected) return

        const serializable = JSON.parse(JSON.stringify(elements))
        socket.emit('whiteboard:update', {
          whiteboardId,
          elements: serializable,
          appState: {
            viewBackgroundColor: appState?.viewBackgroundColor || '#ffffff',
          },
        })
      }, 100)
    },
    [whiteboardId]
  )

  const doSave = async (isAuto = false) => {
    setSaving(true)
    try {
      const api = excalidrawRef.current
      if (!api) return
      const elements = api.getSceneElements()
      const appState = api.getAppState()
      await chatAPI.saveWhiteboard(conversationId, whiteboardId, {
        elements: JSON.parse(JSON.stringify(elements)),
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
        },
      })
      setHasUnsavedChanges(false)
      if (isAuto) {
        setAutoSaveStatus('Auto-saved just now')
        setTimeout(() => setAutoSaveStatus(''), 3000)
      }
    } catch (err) {
      console.error('Failed to save whiteboard:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleSave = () => doSave(false)

  const handleClose = () => {
    if (hasUnsavedChanges && !autoSave) {
      setShowCloseWarning(true)
    } else {
      onClose()
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-on-surface-variant" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/20 bg-surface-container-low px-4 py-2.5">
        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-on-surface-variant transition hover:bg-surface-container-high"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-sm font-semibold text-on-surface">{whiteboardName}</h2>
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
            peerConnected ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            <Users className="h-3 w-3" />
            {peerConnected ? 'Collaborating' : 'Waiting for peer…'}
          </span>
          {autoSaveStatus && (
            <span className="text-[10px] text-green-600 font-medium">{autoSaveStatus}</span>
          )}
          {hasUnsavedChanges && !autoSave && (
            <span className="text-[10px] text-amber-600 font-medium">Unsaved changes</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Autosave toggle */}
          <button
            onClick={() => setAutoSave(v => !v)}
            className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface transition"
            title={autoSave ? 'Disable auto-save' : 'Enable auto-save'}
          >
            {autoSave ? <ToggleRight className="h-5 w-5 text-primary" /> : <ToggleLeft className="h-5 w-5" />}
            Auto-save
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-sm font-medium text-on-primary transition hover:bg-primary-container hover:text-on-primary-container disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </button>
        </div>
      </div>

      {/* Excalidraw Canvas */}
      <div className="excalidraw-wrapper" style={{ flex: 1, height: 'calc(100vh - 49px)' }}>
        <Excalidraw
          excalidrawAPI={(api) => { excalidrawRef.current = api }}
          initialData={{
            elements: initialData?.elements || [],
            appState: {
              ...(initialData?.appState || {}),
              collaborators: new Map(),
            },
          }}
          onChange={handleChange}
          UIOptions={{
            canvasActions: {
              saveToActiveFile: false,
              loadScene: false,
              export: { saveFileToDisk: true },
            },
          }}
        />
      </div>

      {/* Unsaved changes warning */}
      {showCloseWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCloseWarning(false)} />
          <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl bg-surface border border-outline-variant/20 shadow-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-headline text-lg font-semibold text-on-surface">Unsaved changes</h3>
                <p className="mt-1.5 text-sm text-on-surface-variant">Your whiteboard changes haven't been saved. Do you want to save before leaving?</p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => { setShowCloseWarning(false); onClose() }}
                className="rounded-xl border border-outline-variant/30 px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container transition"
              >
                Discard
              </button>
              <button
                onClick={async () => { await doSave(false); setShowCloseWarning(false); onClose() }}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-container hover:text-on-primary-container transition"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
