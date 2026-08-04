import { useParams, useLocation, Navigate } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import ProfilePage from './ProfilePage';

export default function ProfileRouter() {
  const { slug } = useParams<{ slug: string }>();
  const { pathname } = useLocation();

  // /dashboard is a static route that shadows /:slug, so slug is undefined when
  // mounted there. Detect the path directly so the route renders the owner
  // dashboard instead of the public profile.
  if (pathname === '/dashboard' || slug === 'dashboard') {
    return <DashboardPage />;
  }

  // Any other slug renders the public profile page. Unknown slugs are handled
  // by ProfilePage's ContentState error state (not a redirect).
  if (slug) {
    return <ProfilePage slug={slug} />;
  }

  // No slug at all — not a profile route.
  return <Navigate to="/" replace />;
}
