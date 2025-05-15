import React, { useEffect } from 'react';
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
import TestBucket from './pages/TestBucket';
import TestBannerPage from './pages/TestBannerPage';
import { enableDefaultFallbacks, hasAnyBanners } from './lib/bannerService';

function App() {
  // Initialize banner fallbacks if no banners are set
  useEffect(() => {
    // If no banners are set in localStorage, enable fallbacks
    if (!hasAnyBanners()) {
      console.log("No banners found in localStorage, enabling default fallbacks");
      enableDefaultFallbacks();
    } else {
      console.log("Banners found in localStorage, using those instead of fallbacks");
    }
  }, []);

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
            
            <Route path="/test-bucket" element={<TestBucket />} />
            <Route path="/test-banner" element={<TestBannerPage />} />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </VotingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;