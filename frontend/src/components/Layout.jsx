import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex' }}>
      {/* Sidebar - Hidden on mobile */}
      <Sidebar />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0 }}>
        {/* Top Bar - Mobile header */}
        <TopBar />

        {/* Page Content with generous padding */}
        <main style={{ flex: 1, overflow: 'auto' }}>
          <div
            style={{ padding: '40px', paddingBottom: '120px' }}
            className="sm:px-10 px-5"
          >
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
