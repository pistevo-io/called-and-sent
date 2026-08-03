import { useParams, Navigate } from 'react-router-dom';
import ProfilePage from './ProfilePage';

export default function ProfileRouter() {
  const { slug } = useParams<{ slug: string }>();

  if (slug?.startsWith('@')) {
    return <ProfilePage />;
  }

  // Not a profile — redirect to landing
  return <Navigate to="/" replace />;
}
