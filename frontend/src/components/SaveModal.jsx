import { useState, useEffect } from 'react'
import { X, Folder, Plus, Check } from 'lucide-react'
import { bookmarkAPI } from '../services/api'

export default function SaveModal({ blog, onClose, onSave }) {
  const [folders, setFolders] = useState([])
  const [selectedFolder, setSelectedFolder] = useState('default')
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const { data } = await bookmarkAPI.getFolders()
        setFolders(data.data || [])
      } catch {
        setFolders([{ name: 'default', count: 0 }])
      } finally {
        setLoading(false)
      }
    }
    fetchFolders()
  }, [])

  const handleSave = async () => {
    const folderToUse = showNewFolder && newFolderName.trim() 
      ? newFolderName.trim() 
      : selectedFolder

    try {
      await bookmarkAPI.toggleBookmark(blog._id, folderToUse)
      onSave?.(folderToUse)
      onClose()
    } catch (err) {
      console.error('Failed to save bookmark:', err)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="popup-enter w-full max-w-md rounded-2xl bg-surface-container-low shadow-2xl p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-on-surface">Save to Folder</h2>
          <button 
            onClick={onClose}
            className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-on-surface-variant mb-4 line-clamp-2">{blog.title}</p>

        {loading ? (
          <div className="py-8 text-center text-sm text-on-surface-variant">Loading folders...</div>
        ) : (
          <>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {folders.map((folder) => (
                <button
                  key={folder.name}
                  onClick={() => {
                    setSelectedFolder(folder.name)
                    setShowNewFolder(false)
                  }}
                  className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
                    selectedFolder === folder.name && !showNewFolder
                      ? 'border-primary bg-primary-fixed/10'
                      : 'border-outline-variant/30 hover:border-outline-variant/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Folder className="h-4 w-4 text-on-surface-variant" />
                    <div>
                      <p className="text-sm font-medium text-on-surface capitalize">{folder.name}</p>
                      <p className="text-xs text-on-surface-variant">{folder.count} saved</p>
                    </div>
                  </div>
                  {selectedFolder === folder.name && !showNewFolder && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowNewFolder(!showNewFolder)}
              className="w-full flex items-center gap-2 rounded-xl border border-dashed border-outline-variant/40 px-4 py-3 text-sm text-on-surface-variant hover:border-primary hover:bg-surface-container transition"
            >
              <Plus className="h-4 w-4" />
              Create New Folder
            </button>

            {showNewFolder && (
              <div className="mt-3">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="Folder name..."
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  autoFocus
                />
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={showNewFolder && !newFolderName.trim()}
                className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-on-primary hover:bg-primary-container hover:text-on-primary-container transition disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
