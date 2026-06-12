import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import UserManagement from './pages/admin/UserManagement'
import ProjectManagement from './pages/admin/ProjectManagement'
import SubmitTravelRequest from './pages/TravelRequest/SubmitTravelRequest'
import MyTravelRequests from './pages/TravelRequest/MyTravelRequests'
import RequestsForMyProjects from './pages/TravelRequest/RequestsForMyProjects'
import MyTravelOrders from './pages/TravelOrder/MyTravelOrders'
import Profile from './pages/Profile'
import AppLayout from './components/Layout/AppLayout'
import ProtectedRoute from './components/Auth/ProtectedRoute'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/dashboard" />} />
      <Route path="/reset-password" element={!user ? <ResetPassword /> : <Navigate to="/dashboard" />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        
        {/* Admin routes */}
        <Route path="admin/users" element={<ProtectedRoute requireAdmin><UserManagement /></ProtectedRoute>} />
        <Route path="admin/projects" element={<ProtectedRoute requireAdmin><ProjectManagement /></ProtectedRoute>} />
        
        {/* Travel request routes */}
        <Route path="travel-requests/submit" element={<SubmitTravelRequest />} />
        <Route path="travel-requests/my-requests" element={<MyTravelRequests />} />
        <Route path="travel-requests/my-projects" element={<RequestsForMyProjects />} />
        
        {/* Travel order routes */}
        <Route path="travel-orders" element={<MyTravelOrders />} />
      </Route>
    </Routes>
  )
}

export default App

