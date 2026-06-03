import { useState, useRef, useEffect } from 'react'
import { Sparkles, Check, Languages, Expand, Lightbulb, ChevronDown, Wand2 } from 'lucide-react'
import { aiAPI } from '../services/api'
import { showToast } from '../utils/toast'
import AISuggestionModal from './AISuggestionModal'

const AI_ACTIONS = [
  { id: 'autocomplete', label: 'Continue Writing', icon: Sparkles, description: 'AI writes the next sentences' },
  { id: 'grammar', label: 'Fix Grammar', icon: Check, description: 'Fix spelling & grammar errors' },
  { id: 'tone', label: 'Change Tone', icon: Languages, description: 'Adjust writing tone' },
  { id: 'expand', label: 'Expand', icon: Expand, description: 'Expand into detailed paragraphs' },
  { id: 'simplify', label: 'Simplify', icon: Lightbulb, description: 'Make text easier to read' },
]

const TONES = [
  { id: 'professional', label: 'Professional' },
  { id: 'casual', label: 'Casual' },
  { id: 'academic', label: 'Academic' },
]

export default function AIWritingAssistant({ editor }) {
  const [showMenu, setShowMenu] = useState(false)
  const [showToneMenu, setShowToneMenu] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState(null)
  const [currentAction, setCurrentAction] = useState(null)
  const [lastRequest, setLastRequest] = useState(null)
  const menuRef = useRef(null)

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
        setShowToneMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getSelectedOrRecentText = () => {
    if (!editor) return { text: '', hasSelection: false }

    const { from, to } = editor.state.selection
    if (from !== to) {
      return { 
        text: editor.state.doc.textBetween(from, to, ' '),
        hasSelection: true 
      }
    }

    // No selection: get last 500 chars before cursor (for autocomplete)
    const fullText = editor.getText()
    const cursorPos = editor.state.selection.anchor
    const textBeforeCursor = fullText.substring(0, Math.min(cursorPos, fullText.length))
    return { 
      text: textBeforeCursor.slice(-500),
      hasSelection: false 
    }
  }

  const handleAction = async (action, tone = null) => {
    const { text, hasSelection } = getSelectedOrRecentText()
    
    if (!text.trim()) {
      showToast.info('Write some text first, then use AI assist')
      return
    }

    // For non-autocomplete actions, recommend selecting text
    if (action !== 'autocomplete' && !hasSelection && text.length > 100) {
      showToast.info('💡 Tip: Select specific text for better results', { duration: 3000 })
    }

    setShowMenu(false)
    setShowToneMenu(false)
    setLoading(true)
    setCurrentAction(action)
    setSuggestion(null)

    const requestPayload = { text, action, ...(tone && { tone }) }
    setLastRequest(requestPayload)

    try {
      const { data } = await aiAPI.writingAssist(requestPayload)
      setSuggestion(data.data.suggestion)
    } catch (err) {
      const msg = err.response?.data?.message || 'AI service unavailable'
      showToast.error(msg)
      setSuggestion(null)
      setCurrentAction(null)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = (text) => {
    if (!editor || !text) return

    const { from, to } = editor.state.selection

    if (currentAction === 'autocomplete') {
      // Insert at cursor position
      editor.chain().focus().insertContentAt(editor.state.selection.anchor, text).run()
    } else if (from !== to) {
      // Replace selected text
      editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, text).run()
    } else {
      // No selection — insert at cursor
      editor.chain().focus().insertContentAt(editor.state.selection.anchor, text).run()
    }

    showToast.success('AI suggestion applied!')
    closeSuggestion()
  }

  const handleRegenerate = async () => {
    if (!lastRequest) return
    setLoading(true)
    try {
      const { data } = await aiAPI.writingAssist(lastRequest)
      setSuggestion(data.data.suggestion)
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to regenerate')
    } finally {
      setLoading(false)
    }
  }

  const closeSuggestion = () => {
    setSuggestion(null)
    setCurrentAction(null)
    setLastRequest(null)
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => { setShowMenu(!showMenu); setShowToneMenu(false) }}
          title="AI Writing Assistant"
          className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition ${
            showMenu
              ? 'bg-primary/15 text-primary'
              : 'text-primary hover:bg-primary/10'
          }`}
        >
          <Wand2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">AI Assist</span>
          <ChevronDown className="h-3 w-3" />
        </button>

        {showMenu && (
          <div className="popup-enter absolute left-0 top-10 z-30 w-56 rounded-xl border border-outline-variant/20 bg-surface-container-lowest py-1.5 shadow-xl">
            {AI_ACTIONS.map((action) => {
              const Icon = action.icon
              if (action.id === 'tone') {
                return (
                  <div key={action.id} className="relative">
                    <button
                      onClick={() => setShowToneMenu(!showToneMenu)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-surface-container-high transition"
                    >
                      <Icon className="h-3.5 w-3.5 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium text-on-surface">{action.label}</p>
                        <p className="text-[10px] text-on-surface-variant">{action.description}</p>
                      </div>
                      <ChevronDown className="h-3 w-3 text-on-surface-variant" />
                    </button>
                    {showToneMenu && (
                      <div className="border-t border-outline-variant/10 bg-surface-container-low py-1">
                        {TONES.map((tone) => (
                          <button
                            key={tone.id}
                            onClick={() => handleAction('tone', tone.id)}
                            className="w-full px-8 py-1.5 text-left text-xs text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition"
                          >
                            {tone.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }
              return (
                <button
                  key={action.id}
                  onClick={() => handleAction(action.id)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-surface-container-high transition"
                >
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <div>
                    <p className="font-medium text-on-surface">{action.label}</p>
                    <p className="text-[10px] text-on-surface-variant">{action.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Suggestion Modal */}
      {(suggestion !== null || loading) && currentAction && (
        <AISuggestionModal
          suggestion={suggestion || ''}
          action={currentAction}
          loading={loading}
          onAccept={handleAccept}
          onReject={closeSuggestion}
          onRegenerate={handleRegenerate}
        />
      )}
    </>
  )
}
