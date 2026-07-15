import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import MainLayout from './layouts/MainLayout'
import DashboardLayout from './layouts/DashboardLayout'
import Home from './pages/Home'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Explorer from './pages/Explorer'
import Performance from './pages/Performance'
import { useAuth } from './hooks/useAuth'
import ErrorBoundary from './components/ErrorBoundary'

function PublicRoute({ children }) {
  return <MainLayout>{children}</MainLayout>
}

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? (
    <DashboardLayout>{children}</DashboardLayout>
  ) : (
    <Navigate to="/login" replace />
  )
}

function App() {
  return (
    <Router>
      <Toaster 
        position="top-right" 
        toastOptions={{
          className: 'dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 border-slate-200 bg-white text-slate-800 border font-sans text-sm rounded-xl',
          duration: 4050
        }}
      />
      <Routes>
        <Route path="/" element={<ErrorBoundary><PublicRoute><Home /></PublicRoute></ErrorBoundary>} />
        <Route path="/register" element={<ErrorBoundary><PublicRoute><Register /></PublicRoute></ErrorBoundary>} />
        <Route path="/login" element={<ErrorBoundary><PublicRoute><Login /></PublicRoute></ErrorBoundary>} />

        <Route path="/dashboard" element={<ErrorBoundary><PrivateRoute><Dashboard /></PrivateRoute></ErrorBoundary>} />
        <Route path="/upload" element={<ErrorBoundary><PrivateRoute><Upload /></PrivateRoute></ErrorBoundary>} />
        <Route path="/explorer" element={<ErrorBoundary><PrivateRoute><Explorer /></PrivateRoute></ErrorBoundary>} />
        <Route path="/performance" element={<ErrorBoundary><PrivateRoute><Performance /></PrivateRoute></ErrorBoundary>} />

        {/* Fallback Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
