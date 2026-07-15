import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import HomePortal from './pages/HomePortal'
import Dashboard from './pages/Dashboard'
import UserManagement from './pages/admin/UserManagement'
import ProjectManagement from './pages/admin/ProjectManagement'
import SubmitTravelRequest from './pages/TravelRequest/SubmitTravelRequest'
import MyTravelRequests from './pages/TravelRequest/MyTravelRequests'
import RequestsForMyProjects from './pages/TravelRequest/RequestsForMyProjects'
import MyTravelOrders from './pages/TravelOrder/MyTravelOrders'
import Profile from './pages/Profile'
import AppLayout from './components/Layout/AppLayout'
import PortalLayout from './components/Layout/PortalLayout'
import CorrespondenceLayout from './components/Layout/CorrespondenceLayout'
import CorrespondenceNewPage from './pages/Correspondence/CorrespondenceNewPage'
import CorrespondenceReviewPage from './pages/Correspondence/CorrespondenceReviewPage'
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
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/" />} />
      <Route path="/reset-password" element={!user ? <ResetPassword /> : <Navigate to="/" />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <PortalLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePortal />} />
      </Route>

      <Route
        path="/business-trips"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/business-trips/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />

        <Route path="admin/users" element={<ProtectedRoute requireAdmin><UserManagement /></ProtectedRoute>} />
        <Route path="admin/projects" element={<ProtectedRoute requireAdmin><ProjectManagement /></ProtectedRoute>} />

        <Route path="travel-requests/submit" element={<SubmitTravelRequest />} />
        <Route path="travel-requests/my-requests" element={<MyTravelRequests />} />
        <Route path="travel-requests/my-projects" element={<RequestsForMyProjects />} />

        <Route path="travel-orders" element={<MyTravelOrders />} />
      </Route>

      <Route
        path="/correspondence"
        element={
          <ProtectedRoute>
            <CorrespondenceLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="output/review" replace />} />
        <Route path="output/new" element={<CorrespondenceNewPage side="output" />} />
        <Route path="output/review" element={<CorrespondenceReviewPage side="output" />} />
        <Route path="output/edit" element={<Navigate to="../review" replace />} />
        <Route path="input/new" element={<CorrespondenceNewPage side="input" />} />
        <Route path="input/review" element={<CorrespondenceReviewPage side="input" />} />
        <Route path="input/edit" element={<Navigate to="../review" replace />} />
      </Route>
    </Routes>
  )
}

export default App
