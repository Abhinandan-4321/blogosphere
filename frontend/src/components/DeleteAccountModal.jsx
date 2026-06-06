import { useState, useEffect } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import { deletionRequestAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function DeleteAccountModal({ isOpen, onClose, onSuccess }) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasRequest, setHasRequest] = useState(false)
  const [deletionRequest, setDeletionRequest] = useState(null)

  useEffect(() => {
    if (isOpen) {
      checkDeletionRequest()
    }
  }, [isOpen])

  const checkDeletionRequest = async () => {
    try {
      const { data } = await deletionRequestAPI.getDeletionRequest()
      if (data.data.deletionRequest) {
        setHasRequest(true)
        setDeletionRequest(data.data.deletionRequest)
      }
    } catch (err) {
      console.error('Error checking deletion request:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reason.trim()) {
      toast.error('Please provide a reason for deletion')
      return
    }

    setLoading(true)
    try {
      await deletionRequestAPI.requestDeletion(reason)
      toast.success('Deletion request submitted. Admin will review it shortly.')
      setReason('')
      setHasRequest(true)
      onSuccess?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit deletion request')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Cancel deletion request?')) return

    setLoading(true)
    try {
      await deletionRequestAPI.cancelDeletionRequest()
      toast.success('Deletion request cancelled')
      setHasRequest(false)
      setDeletionRequest(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel deletion request')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-lg bg-surface p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface"
        >
          <X size={20} />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <AlertTriangle size={24} className="text-error" />
          <h2 className="text-xl font-semibold text-on-surface">Delete Account</h2>
        </div>

        {hasRequest && deletionRequest ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-error/10 p-4">
              <p className="text-sm text-on-surface">
                <span className="font-semibold">Status:</span> {deletionRequest.status}
              </p>
              {deletionRequest.reason && (
                <p className="mt-2 text-sm text-on-surface-variant">
                  <span className="font-semibold">Your reason:</span> {deletionRequest.reason}
                </p>
              )}
              {deletionRequest.approvalReason && (
                <p className="mt-2 text-sm text-on-surface-variant">
                  <span className="font-semibold">Admin note:</span> {deletionRequest.approvalReason}
                </p>
              )}
            </div>

            {deletionRequest.status === 'pending' && (
              <button
                onClick={handleCancel}
                disabled={loading}
                className="w-full rounded-lg bg-error/20 px-4 py-2 text-sm font-medium text-error hover:bg-error/30 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Cancel Request'}
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-on-surface-variant">
              This action is permanent. Your account will be deleted after admin approval. You can cancel the request anytime before approval.
            </p>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">
                Reason for deletion (optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Tell us why you're leaving..."
                maxLength={500}
                rows={4}
                className="w-full rounded-lg border border-outline bg-surface-variant px-3 py-2 text-on-surface placeholder-on-surface-variant focus:border-primary focus:outline-none"
              />
              <p className="mt-1 text-xs text-on-surface-variant">
                {reason.length}/500
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-outline px-4 py-2 font-medium text-on-surface hover:bg-surface-variant"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-error px-4 py-2 font-medium text-on-error hover:bg-error/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Request Deletion
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
