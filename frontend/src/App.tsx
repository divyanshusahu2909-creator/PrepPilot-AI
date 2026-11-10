import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { ConfigProvider } from './context/ConfigContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute, PublicOnlyRoute } from './components/RouteGuards';
import { AppShell } from './components/layout/AppShell';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/Dashboard';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import InterviewSetup from './pages/interview/InterviewSetup';
import InterviewSessionPage from './pages/interview/InterviewSessionPage';
import InterviewResults from './pages/interview/InterviewResults';
import VoiceCoach from './pages/VoiceCoach';
import PracticeQuestions from './pages/PracticeQuestions';
import Roadmap from './pages/Roadmap';
import InterviewHistory from './pages/InterviewHistory';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <ThemeProvider>
      <ConfigProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />

              <Route element={<PublicOnlyRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route element={<AppShell />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/resume" element={<ResumeAnalyzer />} />
                  <Route path="/interview" element={<InterviewSetup />} />
                  <Route path="/interview/:sessionId" element={<InterviewSessionPage />} />
                  <Route path="/interview/:sessionId/results" element={<InterviewResults />} />
                  <Route path="/voice" element={<VoiceCoach />} />
                  <Route path="/practice" element={<PracticeQuestions />} />
                  <Route path="/roadmap" element={<Roadmap />} />
                  <Route path="/history" element={<InterviewHistory />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgb(var(--c-surface-2))',
                color: 'rgb(var(--c-text))',
                border: '1px solid rgb(var(--c-border))',
              },
            }}
          />
        </AuthProvider>
      </ConfigProvider>
    </ThemeProvider>
  );
}