import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import './AppLayout.css'

const PortalLayout = () => {
  return (
    <div className="app-layout">
      <Navbar showMenu={false} />
      <main className="main-content portal-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default PortalLayout
