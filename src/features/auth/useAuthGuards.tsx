import type { ReactNode } from 'react';
import { useRequireAuth } from './authHooks';

/**
 * Route-element wrapper that renders its children only for authenticated users,
 * redirecting anonymous visitors to /login. Shows a spinner while the session is
 * being resolved.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { state } = useRequireAuth();

  if (state === 'checking') {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-mission-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (state === 'anon') {
    // useRequireAuth triggers the redirect in an effect; render nothing meanwhile.
    return null;
  }

  return <>{children}</>;
}
