import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ApprenticeDashboard from '@/pages/apprentice/Dashboard';
import Tasks from '@/pages/Tasks';
import Cars from '@/pages/Cars';
import Debts from '@/pages/Debts';
import LoadingSpinner from '@/components/LoadingSpinner';
import AIChatWidget from '@/components/AIChatWidget';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import { useReminders } from '@/hooks/useReminders';

// Master pages
import MasterTasks from '@/pages/master/Tasks';
import MasterApprentices from '@/pages/master/Apprentices';
import MasterKnowledgeBase from '@/pages/master/KnowledgeBase';
import MasterSpareParts from '@/pages/master/SpareParts';
import MasterCashier from '@/pages/master/Cashier';
import MasterExpenses from '@/pages/master/Expenses';
import MasterReminders from '@/pages/master/Reminders';

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

function DashboardRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Agar master bo'lsa, to'g'ridan-to'g'ri kassa sahifasiga yo'naltirish
  if (user.role === 'master') {
    return <Navigate to="/app/master/cashier" replace />;
  }

  // Agar apprentice bo'lsa, dashboard ko'rsatish
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();
  
  // Global reminder notifications - faqat login qilgan foydalanuvchilar uchun
  useReminders(!!user);

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
        <Route path="dashboard" element={
          <DashboardRoute>
            <ApprenticeDashboard />
          </DashboardRoute>
        } />
        
        {/* Master routes */}
        <Route path="master/cashier" element={
          <MasterRoute>
            <MasterCashier />
          </MasterRoute>
        } />
        <Route path="master/expenses" element={
          <MasterRoute>
            <MasterExpenses />
          </MasterRoute>
        } />
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
        <Route path="master/reminders" element={
          <MasterRoute>
            <MasterReminders />
          </MasterRoute>
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
        <Route path="apprentice/spare-parts" element={
          <ProtectedRoute>
            <MasterSpareParts />
          </ProtectedRoute>
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