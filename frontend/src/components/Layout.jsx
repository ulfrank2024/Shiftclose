import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar - Hidden on mobile */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top Bar - Mobile header */}
        <TopBar />

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 lg:p-10 pb-24 md:pb-10 overflow-auto">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>

        {/* Bottom Navigation - Mobile only */}
        <BottomNav />
      </div>
    </div>
  )
}
