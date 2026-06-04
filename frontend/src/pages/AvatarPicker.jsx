import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Check, Loader2, ArrowRight, Upload, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { userAPI } from '../services/api'

const DICEBEAR_STYLES = ['adventurer', 'avataaars', 'big-ears', 'bottts', 'fun-emoji', 'lorelei', 'micah', 'miniavs', 'notionists', 'thumbs']
const SEEDS = ['Felix', 'Luna', 'Mia', 'Oliver', 'Charlie', 'Nala', 'Oscar', 'Willow', 'Leo', 'Daisy']

function generateAvatars() {
  return SEEDS.map((seed, i) => ({
    id: `${DICEBEAR_STYLES[i]}-${seed}`,
    url: `https://api.dicebear.com/9.x/${DICEBEAR_STYLES[i]}/svg?seed=${seed}`,
    style: DICEBEAR_STYLES[i],
    seed,
  }))
}

export default function AvatarPicker() {
  const navigate = useNavigate()
  const { user, fetchUser } = useAuth()
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [customPreview, setCustomPreview] = useState(null)
  const [customFile, setCustomFile] = useState(null)
  const [avatars, setAvatars] = useState(() => generateAvatars())
  const fileRef = useRef(null)

  const refreshAvatars = () => {
    const newSeeds = Array.from({ length: 10 }, () => Math.random().toString(36).substring(2, 8))
    setAvatars(newSeeds.map((seed, i) => ({
      id: `${DICEBEAR_STYLES[i]}-${seed}`,
      url: `https://api.dicebear.com/9.x/${DICEBEAR_STYLES[i]}/svg?seed=${seed}`,
      style: DICEBEAR_STYLES[i],
      seed,
    })))
    setSelected(null)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCustomFile(file)
    setCustomPreview(URL.createObjectURL(file))
    setSelected('custom')
  }

  const handleContinue = async () => {
    if (!selected) return
    setSaving(true)
    setError('')
    try {
      if (selected === 'custom' && customFile) {
        const formData = new FormData()
        formData.append('avatar', customFile)
        await userAPI.updateAvatar(formData)
      } else {
        const avatar = avatars.find(a => a.id === selected)
        if (avatar) {
          await userAPI.updateAvatar({ avatarUrl: avatar.url })
        }
      }
      await fetchUser()
      navigate('/feed')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save avatar')
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = async () => {
    setSaving(true)
    try {
      // Set a default avatar and mark as picked
      const defaultAvatar = avatars[0]
      await userAPI.updateAvatar({ avatarUrl: defaultAvatar.url })
      await fetchUser()
      navigate('/feed')
    } catch {
      navigate('/feed')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-container">
            <Camera className="h-7 w-7 text-on-primary-container" />
          </div>
          <h1 className="font-headline text-3xl font-semibold tracking-tight text-on-surface">
            Choose your avatar
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Pick a profile picture to get started. You can always change it later.
          </p>
        </div>

        {/* Avatar grid */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-on-surface-variant">Choose from generated avatars</p>
          <button
            onClick={refreshAvatars}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
        <div className="grid grid-cols-5 gap-3 mb-6">
          {avatars.map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => { setSelected(avatar.id); setCustomFile(null); setCustomPreview(null) }}
              className={`relative aspect-square rounded-2xl border-2 p-2 transition hover:scale-105 ${
                selected === avatar.id
                  ? 'border-primary bg-primary-container/30 shadow-md'
                  : 'border-outline-variant/20 bg-surface-container-low hover:border-outline-variant/50'
              }`}
            >
              <img
                src={avatar.url}
                alt={avatar.seed}
                className="h-full w-full rounded-xl"
              />
              {selected === avatar.id && (
                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <Check className="h-3 w-3 text-on-primary" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Upload custom */}
        <div className="mb-8">
          <button
            onClick={() => fileRef.current?.click()}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 text-sm font-medium transition ${
              selected === 'custom'
                ? 'border-primary bg-primary-container/20 text-primary'
                : 'border-outline-variant/30 text-on-surface-variant hover:border-outline-variant/50 hover:text-on-surface'
            }`}
          >
            {customPreview ? (
              <div className="flex items-center gap-3">
                <img src={customPreview} alt="" className="h-10 w-10 rounded-full object-cover" />
                <span>Custom image selected</span>
                <Check className="h-4 w-4 text-primary" />
              </div>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload from device
              </>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {error && (
          <p className="mb-4 text-center text-sm text-error">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            disabled={saving}
            className="text-sm text-on-surface-variant hover:text-on-surface transition"
          >
            Skip for now
          </button>
          <button
            onClick={handleContinue}
            disabled={!selected || saving}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-on-primary transition hover:bg-primary-container hover:text-on-primary-container disabled:opacity-40"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Continue <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
