import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Footer from './Footer'
import './AppLayout.css'
import '../../styles/convexButtons.css'

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="app-layout">
      <Navbar onMenuClick={toggleSidebar} />
      <div className="app-content">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}

export default AppLayout
