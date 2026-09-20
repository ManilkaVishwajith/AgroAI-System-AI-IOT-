import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './components/Toast.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Layout from './components/Layout.jsx'

import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import UsersPage from './pages/UsersPage.jsx'
import DevicesPage from './pages/DevicesPage.jsx'
import DeviceRequestsPage from './pages/DeviceRequestsPage.jsx'
import PredictionsPage from './pages/PredictionsPage.jsx'
import ChatsPage from './pages/ChatsPage.jsx'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"element={<DashboardPage />} />
              <Route path="users"element={<UsersPage />} />
              <Route path="devices"element={<DevicesPage />} />
              <Route path="device-requests" element={<DeviceRequestsPage />} />
              <Route path="predictions" element={<PredictionsPage />} />
              <Route path="chats" element={<ChatsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
