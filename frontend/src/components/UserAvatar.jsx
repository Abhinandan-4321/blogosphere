import { useState } from 'react'

export default function UserAvatar({ src, name, size = 'md', className = '' }) {
  const [imgError, setImgError] = useState(false)

  const sizes = {
    xs: 'h-6 w-6 text-[9px]',
    sm: 'h-7 w-7 text-[10px]',
    md: 'h-8 w-8 text-xs',
    lg: 'h-10 w-10 text-sm',
    xl: 'h-12 w-12 text-base',
    '2xl': 'h-16 w-16 text-xl',
    '3xl': 'h-24 w-24 text-3xl',
  }

  const sizeClass = sizes[size] || sizes.md
  const initial = name?.[0]?.toUpperCase() || 'U'

  return (
    <div className={`rounded-full bg-surface-container-high flex items-center justify-center font-semibold text-on-surface-variant overflow-hidden flex-shrink-0 ${sizeClass} ${className}`}>
      {src && !imgError ? (
        <img
          src={src}
          alt={name || ''}
          className="h-full w-full rounded-full object-cover"
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        initial
      )}
    </div>
  )
}
