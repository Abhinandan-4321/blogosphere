import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function ImageCarousel({ images = [], className = '' }) {
  const [current, setCurrent] = useState(0)

  if (!images || images.length === 0) return null
  if (images.length === 1) {
    return (
      <div className={`overflow-hidden rounded-lg bg-surface-container ${className}`}>
        <img src={images[0]} alt="" className="h-full w-full object-cover" />
      </div>
    )
  }

  const prev = () => setCurrent(i => (i === 0 ? images.length - 1 : i - 1))
  const next = () => setCurrent(i => (i === images.length - 1 ? 0 : i + 1))

  return (
    <div className={`group relative overflow-hidden rounded-lg bg-surface-container ${className}`}>
      <img
        src={images[current]}
        alt=""
        className="h-full w-full object-cover transition-opacity duration-300"
      />

      {/* Nav arrows */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); prev() }}
        className="absolute left-1.5 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1 text-on-surface opacity-0 shadow-sm transition group-hover:opacity-100 hover:bg-white"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); next() }}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1 text-on-surface opacity-0 shadow-sm transition group-hover:opacity-100 hover:bg-white"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrent(i) }}
            className={`h-1.5 rounded-full transition-all ${
              i === current ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
