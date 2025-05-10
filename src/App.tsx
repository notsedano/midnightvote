import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { VotingProvider } from './contexts/VotingContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VotePage from './pages/VotePage';
import ResultsPage from './pages/ResultsPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import BlockExplorerPage from './pages/BlockExplorerPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import DebugPage from './pages/DebugPage';
import EmergencyPage from './pages/EmergencyPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <VotingProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            <Route path="/vote" element={
              <ProtectedRoute>
                <VotePage />
              </ProtectedRoute>
            } />
            
            <Route path="/results" element={
              <ProtectedRoute>
                <ResultsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            
            <Route path="/explorer" element={
              <ProtectedRoute>
                <BlockExplorerPage />
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            } />
            
            {/* Debug route that bypasses admin check */}
            <Route path="/debug-admin" element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            } />
            
            <Route path="/debug" element={
              <AdminRoute>
                <DebugPage />
              </AdminRoute>
            } />
            
            <Route path="/emergency" element={
              <ProtectedRoute>
                <EmergencyPage />
              </ProtectedRoute>
            } />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </VotingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;