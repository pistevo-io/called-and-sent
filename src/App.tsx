import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './features/landing/LandingPage';
import ProfileRouter from './features/profile/ProfileRouter';
import DashboardPage from './features/profile/DashboardPage';
import { RequireAuth } from './features/auth/useAuthGuards';

// Route-level code splitting: secondary routes (auth, legal, settings, dev
// tooling) download on demand so the initial bundle stays small. Landing and
// the public profile router stay eager — they're the first paint.
const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const SignupPage = lazy(() => import('./features/auth/SignupPage'));
const ForgotPasswordPage = lazy(() => import('./features/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./features/auth/ResetPasswordPage'));
const PrivacyPolicy = lazy(() => import('./features/legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./features/legal/TermsOfService'));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage'));
const FontPreview = lazy(() => import('./components/FontPreview'));
const BrandExplorer = lazy(() => import('./components/BrandExplorer'));

/** Minimal spinner shown while a lazy route chunk loads. */
function RouteFallback() {
  return (
    <div className="h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-mission-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
          <Route path="/:slug" element={<ProfileRouter />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
          <Route path="/dev/fonts" element={<FontPreview />} />
          <Route path="/dev/brand" element={<BrandExplorer />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
