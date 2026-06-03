import { useState, useEffect } from 'react'
import { Coffee, Heart } from 'lucide-react'
import { paymentAPI } from '../services/api'

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`
  return `${Math.floor(seconds / 2592000)}mo ago`
}

export default function SupportersList({ userId, limit = 5 }) {
  const [supporters, setSupporters] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSupporters = async () => {
      try {
        const { data } = await paymentAPI.getPublicSupporters(userId, { limit })
        setSupporters(data.data || [])
      } catch (error) {
        console.error('Failed to load supporters:', error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchSupporters()
    }
  }, [userId, limit])

  if (loading) {
    return (
      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container p-6">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-on-surface">Top Supporters</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-10 w-10 rounded-full bg-surface-container-high" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-surface-container-high rounded mb-1" />
                <div className="h-3 w-16 bg-surface-container-high rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (supporters.length === 0) {
    return (
      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container p-6">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-on-surface">Top Supporters</h3>
        </div>
        <div className="text-center py-8">
          <Coffee className="h-12 w-12 text-on-surface-variant/30 mx-auto mb-3" />
          <p className="text-sm text-on-surface-variant">No supporters yet</p>
          <p className="text-xs text-on-surface-variant mt-1">Be the first to support!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container p-6">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-on-surface">Top Supporters</h3>
      </div>
      <div className="space-y-3">
        {supporters.map((supporter, index) => (
          <div
            key={supporter._id}
            className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-surface-container-high"
          >
            {/* Rank Badge */}
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              index === 0 ? 'bg-yellow-500/20 text-yellow-700' :
              index === 1 ? 'bg-gray-400/20 text-gray-700' :
              index === 2 ? 'bg-orange-600/20 text-orange-700' :
              'bg-surface-container-highest text-on-surface-variant'
            }`}>
              {index + 1}
            </div>

            {/* Avatar */}
            <div className="h-10 w-10 rounded-full bg-surface-container-high flex items-center justify-center text-sm font-medium text-on-surface-variant overflow-hidden">
              {supporter.supporter.avatar ? (
                <img src={supporter.supporter.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                supporter.supporter.name[0]
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-on-surface truncate">
                {supporter.supporter.name}
              </p>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <Coffee className="h-3 w-3" />
                <span>{supporter.totalCoffees} coffee{supporter.totalCoffees > 1 ? 's' : ''}</span>
                <span>•</span>
                <span>{timeAgo(supporter.lastSupport)}</span>
              </div>
            </div>

            {/* Amount */}
            <div className="text-right">
              <p className="text-sm font-semibold text-primary">₹{supporter.totalAmount}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
