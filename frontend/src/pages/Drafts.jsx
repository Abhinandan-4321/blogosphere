import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Clock, Loader2, Trash2, PenSquare } from 'lucide-react'
import { draftAPI } from '../services/api'
import PageTabs from '../components/PageTabs'
import ConfirmDialog from '../components/ConfirmDialog'
import { showToast } from '../utils/toast'

export default function Drafts() {
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    draftAPI.getAll({ limit: 50 })
      .then(({ data }) => setDrafts(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await draftAPI.delete(deleteTarget.id)
      setDrafts(prev => prev.filter(d => d._id !== deleteTarget.id))
      showToast.success('Draft deleted successfully')
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to delete draft')
    }
    setDeleteTarget(null)
  }

  return (
    <div className="px-6 py-2">
      <div className="mx-auto max-w-5xl">
        <PageTabs />

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-headline text-2xl font-semibold tracking-tight text-on-surface">Your Drafts</h1>
            <p className="mt-1 text-sm text-on-surface-variant">{drafts.length} draft{drafts.length !== 1 ? 's' : ''} in progress</p>
          </div>
          <Link
            to="/create"
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary transition hover:bg-primary-container hover:text-on-primary-container"
          >
            <PenSquare className="h-4 w-4" /> New Draft
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-on-surface-variant" /></div>
        ) : drafts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-outline-variant/30 p-12 text-center">
            <PenSquare className="mx-auto h-10 w-10 text-outline-variant/30 mb-3" />
            <p className="text-sm text-on-surface-variant mb-1">No drafts yet</p>
            <p className="text-xs text-on-surface-variant mb-4">Start writing and your work will be auto-saved here.</p>
            <Link to="/create" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-container hover:text-on-primary-container">
              Start Writing
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {drafts.map(draft => (
              <div key={draft._id} className="flex items-center justify-between rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5 transition hover:border-outline-variant/40">
                <Link to={`/create?draft=${draft._id}`} className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-on-surface truncate">{draft.title || 'Untitled Draft'}</p>
                  <p className="mt-1 text-xs text-on-surface-variant line-clamp-1">{draft.content ? draft.content.substring(0, 120) + (draft.content.length > 120 ? '…' : '') : 'No content yet'}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                      <Clock className="h-3 w-3" />
                      {new Date(draft.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs text-on-surface-variant capitalize">{draft.category}</span>
                    {draft.tags?.length > 0 && (
                      <span className="text-xs text-on-surface-variant">
                        {draft.tags.map(t => `#${t}`).join(' ')}
                      </span>
                    )}
                  </div>
                </Link>
                <button
                  onClick={() => setDeleteTarget({ id: draft._id, title: draft.title || 'Untitled draft' })}
                  className="ml-4 rounded-md p-2 text-on-surface-variant hover:bg-error-container/30 hover:text-error transition flex-shrink-0"
                  title="Delete draft"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Draft"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
