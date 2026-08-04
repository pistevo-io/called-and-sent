import { useParams, useLocation, Navigate } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import ProfilePage from './ProfilePage';

export default function ProfileRouter() {
  const { slug } = useParams<{ slug: string }>();
  const { pathname } = useLocation();

  if (pathname === '/dashboard' || slug === 'dashboard') {
    return <DashboardPage />;
  }

  if (slug) {
    return <ProfilePage />;
  }

  return <Navigate to="/" replace />;
}
