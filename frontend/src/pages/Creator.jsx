import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Bold, Italic, List, Link2, ImageIcon, ChevronDown, X, Check, Loader2,
  Heading1, Heading2, Heading3, Quote, Code, Strikethrough, ListOrdered,
  Minus, AlignLeft, AlignCenter, AlignRight, Upload, Table, Underline as UnderlineIcon,
  Undo2, Redo2
} from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import UnderlineExt from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { Table as TableExt } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { blogAPI, draftAPI, uploadAPI } from '../services/api'
import { saveDraft, getSocket } from '../services/socket'

const categories = ['general', 'technology', 'lifestyle', 'travel', 'food', 'design']

// Custom resizable image extension
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null, renderHTML: attrs => attrs.width ? { width: attrs.width } : {} },
      style: { default: null, renderHTML: attrs => attrs.style ? { style: attrs.style } : {} },
    }
  },
})

export default function Creator() {
  const { id: editId } = useParams()
  const [searchParams] = useSearchParams()
  const draftId = searchParams.get('draft')
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [category, setCategory] = useState('general')
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')
  const [coverImage, setCoverImage] = useState(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [imageWidth, setImageWidth] = useState('100')
  const [imageAlign, setImageAlign] = useState('center')
  const autoSaveTimer = useRef(null)
  const currentDraftId = useRef(draftId || null)
  const imageInputRef = useRef(null)
  const coverInputRef = useRef(null)
  const navigate = useNavigate()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      ResizableImage.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline' } }),
      UnderlineExt,
      TextAlign.configure({ types: ['heading', 'paragraph', 'image'] }),
      Placeholder.configure({ placeholder: 'Begin your story here. Let the words flow without judgment…' }),
      TableExt.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-headings:font-headline prose-headings:tracking-tight max-w-none min-h-[500px] outline-none text-on-surface leading-relaxed',
      },
    },
  })

  // Load existing blog when editing
  useEffect(() => {
    if (!editId || !editor) return
    blogAPI.getBlogBySlug(editId).then(({ data }) => {
      const blog = data.data
      setTitle(blog.title || '')
      editor.commands.setContent(blog.content || '')
      setTags(blog.tags || [])
      setCategory(blog.category || 'general')
      if (blog.coverImage) setCoverPreview(blog.coverImage)
    }).catch(() => setError('Failed to load blog for editing'))
  }, [editId, editor])

  // Load draft when draft ID is present
  useEffect(() => {
    if (!draftId || !editor) return
    currentDraftId.current = draftId
    draftAPI.getOne(draftId).then(({ data }) => {
      const draft = data.data
      setTitle(draft.title || '')
      editor.commands.setContent(draft.content || '')
      setTags(draft.tags || [])
      setCategory(draft.category || 'general')
    }).catch(() => setError('Failed to load draft'))
  }, [draftId, editor])

  // Listen for draft:saved to capture the draftId from backend
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const handler = (data) => {
      if (data.draftId) currentDraftId.current = data.draftId
    }
    socket.on('draft:saved', handler)
    return () => socket.off('draft:saved', handler)
  }, [])

  // Auto-save drafts via socket (skip when editing a published blog)
  const editorContent = editor?.getHTML() || ''
  useEffect(() => {
    if (editId) return
    if (!title && (!editorContent || editorContent === '<p></p>')) return
    clearTimeout(autoSaveTimer.current)
    setIsSaving(true)
    autoSaveTimer.current = setTimeout(() => {
      saveDraft({ draftId: currentDraftId.current, title, content: editorContent, tags, category })
      setLastSaved(new Date())
      setIsSaving(false)
    }, 3000)
    return () => clearTimeout(autoSaveTimer.current)
  }, [title, editorContent, tags, category, editId])

  const handleTagKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const tag = tagInput.trim().toLowerCase().replace(',', '')
      if (!tags.includes(tag)) setTags([...tags, tag])
      setTagInput('')
    }
  }

  const removeTag = (tag) => setTags(tags.filter(t => t !== tag))

  // Handle cover image selection
  const handleCoverChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverImage(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  // Handle inline image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return
    setUploading(true)
    try {
      const { data } = await uploadAPI.uploadImage(file)
      const url = data.data.url
      const widthPx = imageWidth === '100' ? '' : `${imageWidth}%`
      const style = `display:block;margin:${imageAlign === 'center' ? '0 auto' : imageAlign === 'right' ? '0 0 0 auto' : '0'};${widthPx ? `width:${widthPx};` : ''}`
      editor.chain().focus().setImage({ src: url, width: widthPx || null, style }).run()
      setShowImageDialog(false)
    } catch {
      setError('Failed to upload image')
    } finally {
      setUploading(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  // Handle URL-based image insert
  const handleImageUrl = () => {
    const url = prompt('Enter image URL:')
    if (!url || !editor) return
    const widthPx = imageWidth === '100' ? '' : `${imageWidth}%`
    const style = `display:block;margin:${imageAlign === 'center' ? '0 auto' : imageAlign === 'right' ? '0 0 0 auto' : '0'};${widthPx ? `width:${widthPx};` : ''}`
    editor.chain().focus().setImage({ src: url, width: widthPx || null, style }).run()
    setShowImageDialog(false)
  }

  const handlePublish = async () => {
    if (!title.trim() || !editor) return
    const htmlContent = editor.getHTML()
    if (!htmlContent || htmlContent === '<p></p>') return
    setPublishing(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('content', htmlContent)
      formData.append('category', category)
      if (tags.length > 0) formData.append('tags', tags.join(','))
      if (coverImage) formData.append('coverImage', coverImage)

      if (editId) {
        await blogAPI.updateBlog(editId, formData)
      } else {
        await blogAPI.createBlog(formData)
      }
      if (currentDraftId.current) {
        try { await draftAPI.delete(currentDraftId.current) } catch {}
      }
      navigate('/dashboard')
    } catch (err) {
      console.error('Publish error:', err.response?.data || err.message)
      const data = err.response?.data
      const msg = data?.errors?.join(', ') || data?.message || err.message || 'Failed to publish'
      setError(msg)
    } finally {
      setPublishing(false)
    }
  }

  const addLink = () => {
    const url = prompt('Enter URL:')
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const insertTable = () => {
    if (editor) {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    }
  }

  if (!editor) return null

  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between rounded-2xl border border-outline-variant/20 bg-surface-container-low mx-4 mb-3 px-3 py-2 gap-y-2">
        <div className="flex flex-wrap items-center gap-0.5">
          <ToolbarBtn icon={<Undo2 className="h-4 w-4" />} onClick={() => editor.chain().focus().undo().run()} title="Undo" disabled={!editor.can().undo()} />
          <ToolbarBtn icon={<Redo2 className="h-4 w-4" />} onClick={() => editor.chain().focus().redo().run()} title="Redo" disabled={!editor.can().redo()} />
          <Sep />
          <ToolbarBtn icon={<Heading1 className="h-4 w-4" />} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1" active={editor.isActive('heading', { level: 1 })} />
          <ToolbarBtn icon={<Heading2 className="h-4 w-4" />} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2" active={editor.isActive('heading', { level: 2 })} />
          <ToolbarBtn icon={<Heading3 className="h-4 w-4" />} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3" active={editor.isActive('heading', { level: 3 })} />
          <Sep />
          <ToolbarBtn icon={<Bold className="h-4 w-4" />} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold" active={editor.isActive('bold')} />
          <ToolbarBtn icon={<Italic className="h-4 w-4" />} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic" active={editor.isActive('italic')} />
          <ToolbarBtn icon={<UnderlineIcon className="h-4 w-4" />} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline" active={editor.isActive('underline')} />
          <ToolbarBtn icon={<Strikethrough className="h-4 w-4" />} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough" active={editor.isActive('strike')} />
          <Sep />
          <ToolbarBtn icon={<Quote className="h-4 w-4" />} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote" active={editor.isActive('blockquote')} />
          <ToolbarBtn icon={<Code className="h-4 w-4" />} onClick={() => editor.chain().focus().toggleCode().run()} title="Inline Code" active={editor.isActive('code')} />
          <ToolbarBtn icon={<span className="text-xs font-mono">{'{}'}</span>} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code Block" active={editor.isActive('codeBlock')} />
          <Sep />
          <ToolbarBtn icon={<List className="h-4 w-4" />} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List" active={editor.isActive('bulletList')} />
          <ToolbarBtn icon={<ListOrdered className="h-4 w-4" />} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered List" active={editor.isActive('orderedList')} />
          <Sep />
          <ToolbarBtn icon={<AlignLeft className="h-4 w-4" />} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Align Left" active={editor.isActive({ textAlign: 'left' })} />
          <ToolbarBtn icon={<AlignCenter className="h-4 w-4" />} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Align Center" active={editor.isActive({ textAlign: 'center' })} />
          <ToolbarBtn icon={<AlignRight className="h-4 w-4" />} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Align Right" active={editor.isActive({ textAlign: 'right' })} />
          <Sep />
          <ToolbarBtn icon={<Link2 className="h-4 w-4" />} onClick={addLink} title="Link" active={editor.isActive('link')} />
          <div className="relative">
            <ToolbarBtn icon={<ImageIcon className="h-4 w-4" />} onClick={() => setShowImageDialog(!showImageDialog)} title="Insert Image" />
            {showImageDialog && (
              <div className="popup-enter absolute left-0 top-10 z-20 w-64 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4 shadow-xl">
                <p className="mb-3 text-xs font-semibold text-on-surface">Insert Image</p>
                <div className="mb-3 space-y-2">
                  <label className="block text-xs text-on-surface-variant">Width (%)</label>
                  <input type="range" min="25" max="100" step="5" value={imageWidth} onChange={e => setImageWidth(e.target.value)} className="w-full accent-primary" />
                  <span className="text-xs text-on-surface-variant">{imageWidth}%</span>
                </div>
                <div className="mb-3">
                  <label className="block text-xs text-on-surface-variant mb-1">Alignment</label>
                  <div className="flex gap-1">
                    {['left', 'center', 'right'].map(a => (
                      <button key={a} onClick={() => setImageAlign(a)}
                        className={`rounded-lg px-3 py-1 text-xs capitalize transition ${imageAlign === a ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'}`}
                      >{a}</button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploading}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-medium text-on-primary hover:bg-primary-container hover:text-on-primary-container disabled:opacity-40"
                  >
                    {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    Upload
                  </button>
                  <button
                    onClick={handleImageUrl}
                    className="flex-1 rounded-xl border border-outline-variant/30 px-3 py-2 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high"
                  >
                    From URL
                  </button>
                </div>
                <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </div>
            )}
          </div>
          <ToolbarBtn icon={<Table className="h-4 w-4" />} onClick={insertTable} title="Insert Table" />
          <ToolbarBtn icon={<Minus className="h-4 w-4" />} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule" />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-on-surface-variant">
            {isSaving ? 'Saving…' : lastSaved ? `Auto-saved ${formatTime(lastSaved)}` : ''}
          </span>
          <button
            onClick={handlePublish}
            disabled={!title.trim() || publishing}
            className="rounded-xl bg-primary px-4 py-1.5 text-xs font-medium text-on-primary transition hover:bg-primary-container hover:text-on-primary-container disabled:opacity-40 flex items-center gap-1.5"
          >
            {publishing && <Loader2 className="h-3 w-3 animate-spin" />}
            {editId ? 'Update' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Writing canvas */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-3xl">
          {error && <div className="mb-4 rounded-xl bg-error-container px-4 py-2.5 text-sm text-on-error-container">{error}</div>}

          {/* Cover image upload */}
          <div className="mb-5">
            {coverPreview ? (
              <div className="relative rounded-2xl overflow-hidden">
                <img src={coverPreview} alt="Cover" className="w-full max-h-72 object-cover" />
                <button
                  onClick={() => { setCoverImage(null); setCoverPreview(''); if (coverInputRef.current) coverInputRef.current.value = '' }}
                  className="absolute top-3 right-3 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => coverInputRef.current?.click()}
                className="w-full rounded-2xl border-2 border-dashed border-outline-variant/30 px-6 py-8 text-center text-on-surface-variant hover:border-primary/40 hover:bg-surface-container-low transition"
              >
                <Upload className="mx-auto h-6 w-6 mb-2 opacity-40" />
                <span className="text-sm">Add cover image</span>
              </button>
            )}
            <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
          </div>

          {/* Category + tags meta */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="flex items-center gap-1.5 rounded-full border border-outline-variant/30 px-3 py-1 text-xs text-on-surface-variant hover:bg-surface-container-high"
              >
                {category} <ChevronDown className="h-3 w-3" />
              </button>
              {showCategoryDropdown && (
                <div className="popup-enter absolute left-0 top-8 z-10 rounded-xl border border-outline-variant/30 bg-surface-container-low py-1 shadow-lg">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => { setCategory(cat); setShowCategoryDropdown(false) }}
                      className={`flex w-full items-center gap-2 px-4 py-1.5 text-xs capitalize text-on-surface hover:bg-surface-container ${category === cat ? 'font-medium' : ''}`}
                    >
                      {category === cat && <Check className="h-3 w-3" />} {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs text-on-surface-variant">
                  #{tag}
                  <button onClick={() => removeTag(tag)} className="text-on-surface-variant hover:text-on-surface"><X className="h-2.5 w-2.5" /></button>
                </span>
              ))}
              <input
                type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown}
                placeholder="Add tag…"
                className="rounded-full border border-dashed border-outline-variant/40 bg-transparent px-2.5 py-0.5 text-xs text-on-surface outline-none placeholder-on-surface-variant/50 focus:border-primary w-20"
              />
            </div>
          </div>

          {/* Title */}
          <textarea
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Give your chronicle a title…"
            className="mb-3 w-full resize-none bg-transparent font-headline text-3xl font-semibold leading-tight tracking-tight text-on-surface outline-none placeholder-on-surface-variant/40"
            rows={2}
          />

          {/* TipTap Editor */}
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}

function ToolbarBtn({ icon, onClick, title, active, disabled }) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`rounded-lg p-1.5 transition disabled:opacity-30 ${
        active ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
      }`}
    >
      {icon}
    </button>
  )
}

function Sep() {
  return <div className="w-px h-6 bg-outline-variant/30 mx-0.5" />
}

function formatTime(date) {
  const diff = Math.floor((Date.now() - date) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}
