import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Camera, Loader2, Lock, User as UserIcon, Trash2, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { userAPI } from '../services/api'
import { showToast } from '../utils/toast'

const DICEBEAR_STYLES = ['adventurer', 'avataaars', 'big-ears', 'bottts', 'fun-emoji', 'lorelei', 'micah', 'miniavs', 'notionists', 'thumbs']
const SEEDS = ['Felix', 'Luna', 'Mia', 'Oliver', 'Charlie', 'Nala', 'Oscar', 'Willow', 'Leo', 'Daisy']
const PRESET_AVATARS = SEEDS.map((seed, i) => ({
  id: `${DICEBEAR_STYLES[i]}-${seed}`,
  url: `https://api.dicebear.com/9.x/${DICEBEAR_STYLES[i]}/svg?seed=${seed}`,
}))

export default function Settings() {
  const { user, fetchUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  // Profile state
  const [name, setName] = useState(user?.name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')

  // Avatar state
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '')
  const [avatarSaving, setAvatarSaving] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState('')

  const handleProfileSave = async () => {
    setProfileSaving(true)
    setProfileMsg('')
    try {
      const { data } = await userAPI.updateProfile({ name: name.trim(), bio: bio.trim() })
      await fetchUser()
      showToast.success('Profile updated successfully')
      setProfileMsg('Profile updated successfully.')
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile'
      showToast.error(msg)
      setProfileMsg(msg)
    } finally {
      setProfileSaving(false)
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) return
    setAvatarSaving(true)
    try {
      const formData = new FormData()
      formData.append('avatar', avatarFile)
      await userAPI.updateAvatar(formData)
      await fetchUser()
      setAvatarFile(null)
      showToast.success('Avatar updated successfully')
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to update avatar')
    } finally {
      setAvatarSaving(false)
    }
  }

  const handlePresetAvatar = async (url) => {
    setAvatarSaving(true)
    try {
      await userAPI.updateAvatar({ avatarUrl: url })
      setAvatarPreview(url)
      setAvatarFile(null)
      await fetchUser()
      showToast.success('Avatar updated successfully')
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to update avatar')
    } finally {
      setAvatarSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    setPasswordMsg('')
    if (newPassword !== confirmPassword) {
      setPasswordMsg('Passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordMsg('Password must be at least 8 characters.')
      return
    }
    setPasswordSaving(true)
    try {
      await userAPI.changePassword({ currentPassword, newPassword })
      showToast.success('Password changed successfully')
      setPasswordMsg('Password changed successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password'
      showToast.error(msg)
      setPasswordMsg(msg)
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Link to="/dashboard" className="text-on-surface-variant hover:text-on-surface transition">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-headline text-2xl font-semibold text-on-surface">Account Settings</h1>
        </div>
        <p className="text-sm text-on-surface-variant">Manage your profile, avatar, and security settings.</p>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-1 border-b border-outline-variant/20">
        {['profile', 'security'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition ${
              activeTab === tab ? 'border-b-2 border-primary text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-8">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-surface-container-high flex items-center justify-center text-2xl font-semibold text-on-surface-variant overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  user?.name?.[0]
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-on-primary shadow-lg hover:bg-primary-container hover:text-on-primary-container transition">
                <Camera className="h-3.5 w-3.5" />
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>
            <div>
              <p className="text-sm font-medium text-on-surface">{user?.name}</p>
              <p className="text-xs text-on-surface-variant">{user?.email}</p>
              {avatarFile && (
                <button
                  onClick={handleAvatarUpload}
                  disabled={avatarSaving}
                  className="mt-2 rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-on-primary hover:bg-primary-container hover:text-on-primary-container transition disabled:opacity-40"
                >
                  {avatarSaving ? 'Uploading...' : 'Upload Avatar'}
                </button>
              )}
            </div>
          </div>

          {/* Preset Avatars */}
          <div>
            <label className="mb-2 block text-xs font-medium text-on-surface-variant">Or choose a preset avatar</label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => handlePresetAvatar(avatar.url)}
                  disabled={avatarSaving}
                  className={`aspect-square rounded-xl border-2 p-1.5 transition hover:scale-105 disabled:opacity-50 ${
                    avatarPreview === avatar.url
                      ? 'border-primary bg-primary-container/30'
                      : 'border-outline-variant/20 hover:border-outline-variant/50'
                  }`}
                >
                  <img src={avatar.url} alt="" className="h-full w-full rounded-lg" />
                </button>
              ))}
            </div>
          </div>

          {/* Name & Bio */}
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-on-surface-variant">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-on-surface-variant">Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={3}
                placeholder="Tell readers about yourself..."
                className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/50 outline-none resize-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </div>

          {profileMsg && (
            <p className={`text-xs ${profileMsg.includes('success') ? 'text-green-600' : 'text-red-500'}`}>
              {profileMsg}
            </p>
          )}

          <button
            onClick={handleProfileSave}
            disabled={profileSaving || !name.trim()}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-on-primary hover:bg-primary-container hover:text-on-primary-container transition disabled:opacity-40"
          >
            {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-on-surface mb-4">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-on-surface-variant">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-on-surface-variant">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-on-surface-variant">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>

            {passwordMsg && (
              <p className={`mt-3 text-xs ${passwordMsg.includes('success') ? 'text-green-600' : 'text-red-500'}`}>
                {passwordMsg}
              </p>
            )}

            <button
              onClick={handlePasswordChange}
              disabled={passwordSaving || !currentPassword || !newPassword}
              className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-on-primary hover:bg-primary-container hover:text-on-primary-container transition disabled:opacity-40"
            >
              {passwordSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Change Password
            </button>
          </div>

          {/* Account Info */}
          <div className="border-t border-outline-variant/20 pt-6">
            <h3 className="text-sm font-semibold text-on-surface mb-2">Account Info</h3>
            <div className="space-y-2 text-xs text-on-surface-variant">
              <p><span className="font-medium text-on-surface">Email:</span> {user?.email}</p>
              <p><span className="font-medium text-on-surface">Role:</span> {user?.role}</p>
              <p><span className="font-medium text-on-surface">Joined:</span> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
