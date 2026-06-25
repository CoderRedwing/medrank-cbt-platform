import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4'; // 👈 1. Import ReactGA
import useAuthStore from './store/authStore';
import AppLayout   from './components/layout/AppLayout.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';
import { LoadingScreen } from './components/ui/index.jsx';
import AIRPredictorPage from './pages/Airpredictorpage.jsx';

// Student pages
import LoginPage           from './pages/LoginPage.jsx';
import RegisterPage        from './pages/RegisterPage.jsx';
import DashboardPage       from './pages/DashboardPage.jsx';
import TestSelectionPage   from './pages/TestSelectionPage.jsx';
import ActiveTestPage      from './pages/ActiveTestPage.jsx';
import AnalysisPage        from './pages/AnalysisPage.jsx';
import OverallAnalysisPage from './pages/OverallAnalysisPage.jsx';
import HistoryPage         from './pages/HistoryPage.jsx';
import ProfilePage         from './pages/ProfilePage.jsx';
import AiTutorPage         from './pages/AiTutorPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminStudents  from './pages/admin/AdminStudents.jsx';
import AdminTests     from './pages/admin/AdminTests.jsx';
import AdminPapers    from './pages/admin/AdminPapers.jsx';
import AdminSettings  from './pages/admin/AdminSettings.jsx';

/* ── Analytics Tracker Component ─────────────────────────────── */
// 👈 2. This component listens to the router changes and sends them to GA4
function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    ReactGA.send({ 
      hitType: 'pageview', 
      page: location.pathname + location.search 
    });
  }, [location]);

  return null; // This component doesn't render anything on screen
}

/* ── Auth guard ─────────────────────────────────────────────────── */
function ProtectedRoute({ children }) {
  const { token, initializing } = useAuthStore();
  const location = useLocation();
  if (initializing) return <LoadingScreen message="Loading your profile…" />;
  if (!token)       return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

/* ── Admin guard ────────────────────────────────────────────────── */
function AdminRoute({ children }) {
  const { user, token, initializing } = useAuthStore();
  const location = useLocation();
  if (initializing)          return <LoadingScreen message="Verifying access…" />;
  if (!token)                return <Navigate to="/login" state={{ from: location }} replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

/* ── Wrapped layouts ────────────────────────────────────────────── */
const S = ({ children }) => <AppLayout>{children}</AppLayout>;
const A = ({ children }) => <AdminLayout>{children}</AdminLayout>;

export default function App() {
  const { init, initializing } = useAuthStore();
  useEffect(() => { init(); }, []);
  if (initializing) return <LoadingScreen message="Initialising…" />;

  return (
    <BrowserRouter>
      {/* 👈 3. Put the tracker here inside BrowserRouter */}
      <AnalyticsTracker /> 

      <Routes>
        {/* Public */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/air-predictor" element={<AIRPredictorPage />} />

        <Route path="/forgot-password" element={<ForgotPasswordPage />} /> 
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* Student routes */}
        <Route path="/dashboard" element={<ProtectedRoute><S><DashboardPage /></S></ProtectedRoute>} />
        <Route path="/tests"     element={<ProtectedRoute><S><TestSelectionPage /></S></ProtectedRoute>} />
        <Route path="/history"   element={<ProtectedRoute><S><HistoryPage /></S></ProtectedRoute>} />
        <Route path="/analysis"  element={<ProtectedRoute><S><OverallAnalysisPage /></S></ProtectedRoute>} />
        <Route path="/analysis/:sessionId" element={<ProtectedRoute><S><AnalysisPage /></S></ProtectedRoute>} />
        <Route path="/profile"   element={<ProtectedRoute><S><ProfilePage /></S></ProtectedRoute>} />
        <Route path="/ai-tutor"  element={<ProtectedRoute><S><AiTutorPage /></S></ProtectedRoute>} />

        {/* Active test — full-screen, no sidebar */}
        <Route path="/test/active" element={<ProtectedRoute><ActiveTestPage /></ProtectedRoute>} />

        {/* ── Admin routes ── */}
        <Route path="/admin"           element={<AdminRoute><A><AdminDashboard /></A></AdminRoute>} />
        <Route path="/admin/students"  element={<AdminRoute><A><AdminStudents /></A></AdminRoute>} />
        <Route path="/admin/tests"     element={<AdminRoute><A><AdminTests /></A></AdminRoute>} />
        <Route path="/admin/papers"    element={<AdminRoute><A><AdminPapers /></A></AdminRoute>} />
        <Route path="/admin/settings"  element={<AdminRoute><A><AdminSettings /></A></AdminRoute>} />

        {/* Redirects */}
        <Route path="/" element={<LandingPage />} /> 
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}