import { Outlet } from 'react-router-dom'
import Header from './Header'

export default function Layout() {
  return (
    <div className="warm-top-accent min-h-screen bg-surface">
      <Header />
      <main className="relative z-[1] pt-20">
        <Outlet />
      </main>
    </div>
  )
}
