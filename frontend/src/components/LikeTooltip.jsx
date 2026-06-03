import { useRef, useState } from 'react'
import { blogAPI } from '../services/api'

export default function LikeTooltip({ blogId, children }) {
  const [likers, setLikers] = useState(null)
  const [total, setTotal] = useState(0)
  const [show, setShow] = useState(false)
  const [fetched, setFetched] = useState(false)
  const timeoutRef = useRef(null)

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(async () => {
      setShow(true)
      if (!fetched) {
        try {
          const { data } = await blogAPI.getLikers(blogId, { limit: 5 })
          setLikers(data.data.likers || [])
          setTotal(data.data.total || 0)
          setFetched(true)
        } catch {
          setLikers([])
        }
      }
    }, 400)
  }

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current)
    setShow(false)
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {show && (
        <div className="popup-enter absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2 shadow-lg">
          {likers === null ? (
            <p className="text-[10px] text-on-surface-variant">Loading...</p>
          ) : likers.length === 0 ? (
            <p className="text-[10px] text-on-surface-variant">No likes yet</p>
          ) : (
            <div>
              <div className="flex -space-x-1.5 mb-1">
                {likers.map(u => (
                  <div key={u._id} className="h-5 w-5 rounded-full bg-surface-container-high border-2 border-surface-container-low flex items-center justify-center text-[8px] font-medium text-on-surface-variant overflow-hidden">
                    {u.avatar ? <img src={u.avatar} alt="" className="h-full w-full object-cover" /> : u.name?.[0]}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-on-surface-variant">
                {likers.map(u => u.name.split(' ')[0]).join(', ')}
                {total > likers.length && ` and ${total - likers.length} more`}
              </p>
            </div>
          )}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-white" />
        </div>
      )}
    </div>
  )
}
