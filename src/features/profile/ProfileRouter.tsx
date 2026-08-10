import { useParams, useLocation, Navigate } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import ProfilePage from './ProfilePage';

export default function ProfileRouter() {
  const { slug } = useParams<{ slug: string }>();
  const { pathname } = useLocation();

  if (pathname === '/dashboard' || slug === 'dashboard') {
    return <DashboardPage />;
  }

  // Normalize handles: the nav links to /@<slug>, but profile data is keyed by
  // the bare slug (DB + API lookups). Strip a leading '@' so both /@k and /k
  // resolve to the same profile.
  const cleanSlug = slug?.replace(/^@/, '');

  if (cleanSlug) {
    return <ProfilePage slug={cleanSlug} />;
  }

  return <Navigate to="/" replace />;
}
