import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-6 px-4 pt-4 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
