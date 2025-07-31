import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { DashboardLayout } from './components/Layout/DashboardLayout'
import { Footer } from './components/Layout/Footer'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { Dashboard } from './pages/Dashboard'
import { TeamManagement } from './pages/TeamManagement'
import { Properties } from './pages/Properties'
import { ProjectManagement } from './pages/ProjectManagement'
import { Clients } from './pages/Clients'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={
            <div className="min-h-screen flex flex-col">
              <main className="flex-1">
                <LandingPage />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected dashboard routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/team" element={
            <ProtectedRoute>
              <DashboardLayout>
                <TeamManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          {/* Placeholder routes for other dashboard pages */}
          <Route path="/properties" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Properties />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/projects" element={
            <ProtectedRoute>
              <DashboardLayout>
                <ProjectManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/clients" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Clients />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <DashboardLayout>
                <div className="p-8">
                  <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                  <p className="text-gray-600 mt-2">Analytics dashboard coming soon...</p>
                </div>
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute>
              <DashboardLayout>
                <div className="p-8">
                  <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
                  <p className="text-gray-600 mt-2">Calendar view coming soon...</p>
                </div>
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute>
              <DashboardLayout>
                <div className="p-8">
                  <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                  <p className="text-gray-600 mt-2">Messaging system coming soon...</p>
                </div>
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/documents" element={
            <ProtectedRoute>
              <DashboardLayout>
                <div className="p-8">
                  <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
                  <p className="text-gray-600 mt-2">Document management coming soon...</p>
                </div>
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <DashboardLayout>
                <div className="p-8">
                  <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                  <p className="text-gray-600 mt-2">Settings panel coming soon...</p>
                </div>
              </DashboardLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App