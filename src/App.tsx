import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import FontPreview from './components/FontPreview';
import BrandExplorer from './components/BrandExplorer';
import ProfileRouter from './components/ProfileRouter';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/:slug" element={<ProfileRouter />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/dev/fonts" element={<FontPreview />} />
        <Route path="/dev/brand" element={<BrandExplorer />} />
      </Routes>
    </BrowserRouter>
  );
}
