import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SnackbarProvider } from './context/SnackbarContext'
import { LoginPage } from './pages/LoginPage'
import { WorkspacePage } from './pages/WorkspacePage'
import './App.css'

function App() {
  return <SnackbarProvider>
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/workspaces" element={<WorkspacePage />} />
        <Route path="*" element={<Navigate to="/workspaces" replace />} />
      </Routes>
    </AuthProvider>
  </SnackbarProvider>
}

export default App