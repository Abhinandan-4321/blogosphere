import { useState, useEffect, useRef } from 'react'
import { X, Check, RefreshCw, Pencil } from 'lucide-react'

const ACTION_LABELS = {
  autocomplete: 'AI Continuation',
  grammar: 'Grammar Fix',
  tone: 'Tone Adjustment',
  expand: 'Content Expansion',
  simplify: 'Simplified Text',
}

export default function AISuggestionModal({ suggestion, action, onAccept, onReject, onRegenerate, loading }) {
  const [editedText, setEditedText] = useState(suggestion)
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    setEditedText(suggestion)
    setIsEditing(false)
  }, [suggestion])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [isEditing])

  const handleTextChange = (e) => {
    setEditedText(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = e.target.scrollHeight + 'px'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-lg rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-sm">🤖</span>
            </div>
            <h3 className="text-sm font-semibold text-on-surface">
              {ACTION_LABELS[action] || 'AI Suggestion'}
            </h3>
          </div>
          <button
            onClick={onReject}
            className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-high transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              <p className="text-sm text-on-surface-variant">Generating suggestion...</p>
            </div>
          ) : (
            <>
              {isEditing ? (
                <textarea
                  ref={textareaRef}
                  value={editedText}
                  onChange={handleTextChange}
                  className="w-full resize-none rounded-xl border border-primary/30 bg-surface-container-low p-3 text-sm leading-relaxed text-on-surface outline-none focus:border-primary transition"
                  rows={4}
                />
              ) : (
                <div className="max-h-64 overflow-y-auto rounded-xl bg-surface-container-low p-3">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-on-surface">
                    {editedText}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        {!loading && (
          <div className="flex items-center justify-between border-t border-outline-variant/20 px-5 py-3">
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-1.5 rounded-xl border border-outline-variant/30 px-3 py-1.5 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high transition"
              >
                <Pencil className="h-3 w-3" />
                {isEditing ? 'Preview' : 'Edit'}
              </button>
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1.5 rounded-xl border border-outline-variant/30 px-3 py-1.5 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high transition"
              >
                <RefreshCw className="h-3 w-3" />
                Regenerate
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onReject}
                className="rounded-xl border border-outline-variant/30 px-4 py-1.5 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high transition"
              >
                Reject
              </button>
              <button
                onClick={() => onAccept(editedText)}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-xs font-medium text-on-primary hover:opacity-90 transition"
              >
                <Check className="h-3 w-3" />
                Accept
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
