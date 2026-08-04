import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './features/landing/LandingPage';
import ProfileRouter from './features/profile/ProfileRouter';
import DashboardPage from './features/profile/DashboardPage';
import LoginPage from './features/auth/LoginPage';
import SignupPage from './features/auth/SignupPage';
import PrivacyPolicy from './features/legal/PrivacyPolicy';
import TermsOfService from './features/legal/TermsOfService';
import SettingsPage from './features/settings/SettingsPage';
import FontPreview from './components/FontPreview';
import BrandExplorer from './components/BrandExplorer';
import { RequireAuth } from './features/auth/useAuthGuards';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path="/:slug" element={<ProfileRouter />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
        <Route path="/dev/fonts" element={<FontPreview />} />
        <Route path="/dev/brand" element={<BrandExplorer />} />
      </Routes>
    </BrowserRouter>
  );
}
