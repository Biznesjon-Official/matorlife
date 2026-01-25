import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Tasks from '@/pages/Tasks';
import Cars from '@/pages/Cars';
import Debts from '@/pages/Debts';
import LoadingSpinner from '@/components/LoadingSpinner';
import AIChatWidget from '@/components/AIChatWidget';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

// Master pages
import MasterTasks from '@/pages/master/Tasks';
import MasterApprentices from '@/pages/master/Apprentices';
import MasterKnowledgeBase from '@/pages/master/KnowledgeBase';
import MasterSpareParts from '@/pages/master/SpareParts';

// Apprentice pages
import ApprenticeTasks from '@/pages/apprentice/Tasks';
import ApprenticeAllTasks from '@/pages/apprentice/AllTasks';
import ApprenticeAchievements from '@/pages/apprentice/Achievements';
import ApprenticeAIDiagnostic from '@/pages/apprentice/AIDiagnostic';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function MasterRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'master') {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
}

function ApprenticeRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'apprentice') {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
}

function LandingRoute({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingRoute>
            <Landing />
          </LandingRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Master routes */}
        <Route path="master/tasks" element={
          <MasterRoute>
            <MasterTasks />
          </MasterRoute>
        } />
        <Route path="master/apprentices" element={
          <MasterRoute>
            <MasterApprentices />
          </MasterRoute>
        } />
        <Route path="master/knowledge" element={
          <MasterRoute>
            <MasterKnowledgeBase />
          </MasterRoute>
        } />
        <Route path="master/spare-parts" element={
          <ProtectedRoute>
            <MasterSpareParts />
          </ProtectedRoute>
        } />
        <Route path="cars" element={
          <MasterRoute>
            <Cars />
          </MasterRoute>
        } />
        <Route path="debts" element={
          <MasterRoute>
            <Debts />
          </MasterRoute>
        } />
        
        {/* Apprentice routes */}
        <Route path="apprentice/tasks" element={
          <ApprenticeRoute>
            <ApprenticeTasks />
          </ApprenticeRoute>
        } />
        <Route path="apprentice/all-tasks" element={
          <ApprenticeRoute>
            <ApprenticeAllTasks />
          </ApprenticeRoute>
        } />
        <Route path="apprentice/achievements" element={
          <ApprenticeRoute>
            <ApprenticeAchievements />
          </ApprenticeRoute>
        } />
        <Route path="apprentice/cars" element={
          <ApprenticeRoute>
            <Cars />
          </ApprenticeRoute>
        } />
        <Route path="apprentice/ai-diagnostic" element={
          <ApprenticeRoute>
            <ApprenticeAIDiagnostic />
          </ApprenticeRoute>
        } />
        
        {/* Fallback tasks route - redirects based on role */}
        <Route path="tasks" element={<Tasks />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <AIChatWidget />
      <PWAInstallPrompt />
    </AuthProvider>
  );
}

export default App;