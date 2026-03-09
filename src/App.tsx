import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PlanPage from './pages/PlanPage'
import TeamPage from './pages/TeamPage'
import { IssuesPage, TodosPage, RocksPage } from './pages/OtherPages'
import RoomsPage from './pages/meeting/RoomsPage'
import MeetingRoomPage from './pages/meeting/MeetingRoomPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-cult-black flex items-center justify-center">
      <div className="font-mono text-xs text-cult-text tracking-[0.4em] animate-pulse">CULT LOS</div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <AppLayout>{children}</AppLayout>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/plan" element={<ProtectedRoute><PlanPage /></ProtectedRoute>} />
          <Route path="/team" element={<ProtectedRoute><TeamPage /></ProtectedRoute>} />
          <Route path="/issues" element={<ProtectedRoute><IssuesPage /></ProtectedRoute>} />
          <Route path="/todos" element={<ProtectedRoute><TodosPage /></ProtectedRoute>} />
          <Route path="/rocks" element={<ProtectedRoute><RocksPage /></ProtectedRoute>} />
          <Route path="/rooms" element={<ProtectedRoute><RoomsPage /></ProtectedRoute>} />
          <Route path="/meeting/:roomId" element={<ProtectedRoute><MeetingRoomPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}