import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import CorrespondenceSidebar from './CorrespondenceSidebar'
import Footer from './Footer'
import './AppLayout.css'
import '../../styles/convexButtons.css'

const CorrespondenceLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="app-layout">
      <Navbar onMenuClick={toggleSidebar} />
      <div className="app-content">
        <CorrespondenceSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}

export default CorrespondenceLayout
