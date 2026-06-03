import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Clock, Loader2, UserPlus, UserMinus, Users, BookOpen, MessageSquare } from 'lucide-react'
import { userAPI, blogAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import BuyMeCoffee from '../components/BuyMeCoffee'
import SupportersList from '../components/SupportersList'

export default function Profile() {
  const { id } = useParams()
  const { user: currentUser, isAuthenticated, fetchUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [blogs, setBlogs] = useState([])
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('posts')
  const [followLoading, setFollowLoading] = useState(false)
  const profileNavigate = useNavigate()

  const isOwnProfile = currentUser?._id === id

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        const requests = [
          userAPI.getUserProfile(id),
          userAPI.getUserBlogs(id, { limit: 20 }),
          userAPI.getFollowers(id, { limit: 100 }),
          userAPI.getFollowing(id, { limit: 100 }),
        ]
        const [profileRes, blogsRes, followersRes, followingRes] = await Promise.all(requests)
        setProfile(profileRes.data.data)
        setBlogs(blogsRes.data.data || [])
        const followersList = followersRes.data.data || []
        const followingList = followingRes.data.data || []
        setFollowers(followersList)
        setFollowing(followingList)
        setIsFollowing(Boolean(profileRes.data.data?.isFollowing) || followersList.some(f => f._id === currentUser?._id))

      } catch {
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [id, isAuthenticated, currentUser?._id, isOwnProfile])

  const handleFollow = async () => {
    if (!isAuthenticated || isOwnProfile) return
    setFollowLoading(true)
    try {
      await userAPI.toggleFollow(id)
      setIsFollowing(!isFollowing)
      setProfile(prev => ({
        ...prev,
        followersCount: isFollowing
          ? (prev.followersCount || 1) - 1
          : (prev.followersCount || 0) + 1,
      }))
      // Refresh current user to update followingCount in Dashboard
      fetchUser()
    } catch {} finally {
      setFollowLoading(false)
    }
  }

  const handleRemoveFollower = async (followerId) => {
    if (!window.confirm('Remove this follower?')) return
    try {
      await userAPI.removeFollower(followerId)
      setFollowers(prev => prev.filter(f => f._id !== followerId))
      setProfile(prev => ({
        ...prev,
        followersCount: Math.max(0, (prev.followersCount || 1) - 1),
      }))
      fetchUser()
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-on-surface-variant" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="py-24 text-center">
        <p className="text-on-surface-variant">User not found.</p>
        <Link to="/feed" className="mt-3 inline-block text-sm text-primary hover:underline">Back to Feed</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center mb-10">
        <div className="h-24 w-24 rounded-full bg-surface-container-high flex items-center justify-center text-3xl font-semibold text-on-surface-variant overflow-hidden mb-4">
          {profile.avatar ? (
            <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            profile.name?.[0]
          )}
        </div>
        <h1 className="font-headline text-2xl font-semibold text-on-surface">{profile.name}</h1>
        {profile.bio && (
          <p className="mt-2 max-w-md text-sm text-on-surface-variant leading-relaxed">{profile.bio}</p>
        )}

        {/* Stats */}
        <div className="mt-4 flex items-center gap-6 text-sm text-on-surface-variant">
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            <span className="font-medium text-on-surface">{blogs.length}</span> posts
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span className="font-medium text-on-surface">{profile.followersCount || 0}</span> followers
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-on-surface">{profile.followingCount || 0}</span> following
          </div>
        </div>

        {/* Action Buttons */}
        {isAuthenticated && !isOwnProfile && (
          <div className="mt-5 flex items-center gap-3 flex-wrap justify-center">
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition ${
                isFollowing
                  ? 'border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'
                  : 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container'
              }`}
            >
              {followLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isFollowing ? (
                <><UserMinus className="h-4 w-4" /> Unfollow</>
              ) : (
                <><UserPlus className="h-4 w-4" /> Follow</>
              )}
            </button>
            {profile?.isMutual && (
              <button
                onClick={() => profileNavigate(`/messages?user=${id}`)}
                className="flex items-center gap-2 rounded-xl border border-outline-variant/30 px-5 py-2.5 text-sm font-medium text-on-surface-variant transition hover:bg-surface-container-high"
              >
                <MessageSquare className="h-4 w-4" /> Message
              </button>
            )}
            <BuyMeCoffee creator={profile} />
          </div>
        )}
        
        {isOwnProfile && (
          <Link
            to="/settings"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-outline-variant/30 px-5 py-2.5 text-sm font-medium text-on-surface-variant transition hover:bg-surface-container-high"
          >
            Edit Profile
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-outline-variant/20 mb-8">
        {['posts', 'supporters', 'followers', 'following'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition ${
              activeTab === tab
                ? 'border-b-2 border-primary text-on-surface'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content: Posts */}
      {activeTab === 'posts' && (
        <div>
          {blogs.length === 0 ? (
            <p className="py-12 text-center text-on-surface-variant">No published posts yet.</p>
          ) : (
            <div className="space-y-6">
              {blogs.map(blog => (
                <article key={blog._id} className="flex gap-5 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5 transition hover:border-outline-variant/40">
                  {blog.coverImage && (
                    <div className="h-20 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-surface-container">
                      <img src={blog.coverImage} alt={blog.title} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <Link to={`/blog/${blog.slug || blog._id}`}>
                      <h2 className="text-base font-semibold text-on-surface transition hover:text-primary line-clamp-1">{blog.title}</h2>
                      <p className="mt-1 text-xs text-on-surface-variant line-clamp-2">{blog.excerpt}</p>
                    </Link>
                    <div className="mt-2 flex items-center gap-4 text-xs text-on-surface-variant">
                      <span className="capitalize rounded-full bg-surface-container-high px-2 py-0.5">{blog.category}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {blog.readTime} min</span>
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {blog.likesCount || 0}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {blog.commentsCount || 0}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Supporters */}
      {activeTab === 'supporters' && (
        <div className="max-w-2xl mx-auto">
          <SupportersList userId={id} limit={20} />
        </div>
      )}

      {/* Tab Content: Followers */}
      {activeTab === 'followers' && (
        <div>
          {followers.length === 0 ? (
            <p className="py-12 text-center text-on-surface-variant">No followers yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {followers.map(f => (
                <div key={f._id} className="flex items-center gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 transition hover:border-outline-variant/40">
                  <Link to={`/profile/${f._id}`} className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-full bg-surface-container-high flex items-center justify-center text-sm font-medium text-on-surface-variant overflow-hidden flex-shrink-0">
                      {f.avatar ? <img src={f.avatar} alt="" className="h-full w-full object-cover" /> : f.name?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">{f.name}</p>
                      {f.bio && <p className="text-xs text-on-surface-variant truncate">{f.bio}</p>}
                    </div>
                  </Link>
                  {isOwnProfile && (
                    <button
                      onClick={() => handleRemoveFollower(f._id)}
                      className="flex-shrink-0 rounded-xl border border-outline-variant/30 px-3 py-1.5 text-xs font-medium text-on-surface-variant transition hover:border-error/30 hover:bg-error-container/30 hover:text-error"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Following */}
      {activeTab === 'following' && (
        <div>
          {following.length === 0 ? (
            <p className="py-12 text-center text-on-surface-variant">Not following anyone yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {following.map(user => (
                <Link key={user._id} to={`/profile/${user._id}`}
                  className="flex items-center gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 transition hover:border-outline-variant/40">
                  <div className="h-10 w-10 rounded-full bg-surface-container-high flex items-center justify-center text-sm font-medium text-on-surface-variant overflow-hidden">
                    {user.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : user.name?.[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{user.name}</p>
                    {user.bio && <p className="text-xs text-on-surface-variant truncate">{user.bio}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
