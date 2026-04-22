import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AnalysisProvider } from './context/AnalysisContext'
import AuthPages from './pages/AuthPages'
import Dashboard from './components/Dashboard'
import ChatBot from './components/ChatBot'
import { useAuth } from './context/AuthContext'

function AppRoutes() {
  const { user } = useAuth()
  return (
    <>
      <Routes>
        <Route path="/login" element={<AuthPages />} />
        <Route path="/register" element={<AuthPages />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      {user && <ChatBot />}
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <AnalysisProvider>
        <AppRoutes />
      </AnalysisProvider>
    </AuthProvider>
  )
}

export default App
