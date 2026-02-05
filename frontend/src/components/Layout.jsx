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

        {/* Page Content with generous padding */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 md:p-10 lg:p-12 pb-28 md:pb-12">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>

        {/* Bottom Navigation - Mobile only */}
        <BottomNav />
      </div>
    </div>
  )
}
