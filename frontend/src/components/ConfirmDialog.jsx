import { useEffect, useRef } from 'react'
import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel?.()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  if (!open) return null

  const confirmColors =
    variant === 'danger'
      ? 'bg-error text-white hover:bg-error/90'
      : 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-md mx-4 rounded-2xl bg-surface border border-outline-variant/20 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
              variant === 'danger' ? 'bg-error-container' : 'bg-primary-container'
            }`}>
              <AlertTriangle className={`h-5 w-5 ${
                variant === 'danger' ? 'text-error' : 'text-primary'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-headline text-lg font-semibold text-on-surface">{title}</h3>
              <p className="mt-1.5 text-sm text-on-surface-variant leading-relaxed">{message}</p>
            </div>
            <button
              onClick={onCancel}
              className="flex-shrink-0 rounded-lg p-1 text-on-surface-variant hover:bg-surface-container-high transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="rounded-xl border border-outline-variant/30 px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container transition"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${confirmColors}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
