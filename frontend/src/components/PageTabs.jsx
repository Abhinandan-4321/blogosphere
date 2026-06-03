import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileEdit, Bookmark, Heart } from 'lucide-react'

const tabs = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
  { icon: FileEdit, label: 'Drafts', to: '/drafts' },
  { icon: Bookmark, label: 'Saved', to: '/favorites' },
  { icon: Heart, label: 'Liked', to: '/liked' },
]

export default function PageTabs() {
  const location = useLocation()

  return (
    <div className="mb-8 flex items-center gap-1 rounded-2xl bg-surface-container-low p-1.5">
      {tabs.map(({ icon: Icon, label, to }) => {
        const active = location.pathname === to
        return (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              active
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        )
      })}
    </div>
  )
}
