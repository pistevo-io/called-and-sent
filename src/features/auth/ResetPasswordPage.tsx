import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, KeyRound, ArrowLeft } from 'lucide-react';
import { authClient } from './auth';

/**
 * Landing page for the emailed password-reset link. Reads the one-time `token`
 * from the query string and lets the user set a new password. No authed-user
 * redirect here on purpose: someone clicking a reset link (possibly with a
 * stale session) must be able to complete the reset.
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mirror the "links expire after 15 minutes" note from the forgot page.
  const invalidToken = !token || token === 'INVALID_TOKEN';

  useEffect(() => {
    if (invalidToken) {
      setError('This reset link is invalid or has expired. Please request a new one.');
    }
  }, [invalidToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await authClient.resetPassword({ newPassword, token: token ?? undefined });
      if (error) {
        setError(error.message || 'Could not reset password');
      } else {
        // Password updated — take the user back to sign in.
        navigate('/login');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230ea5e9' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Called <span className="text-mission-500">&amp;</span> Sent
            </h1>
          </a>
          <p className="text-muted-foreground mt-2">Choose a new password</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          {invalidToken ? (
            <div className="text-center space-y-4">
              <KeyRound className="w-10 h-10 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-semibold text-foreground">Invalid reset link</h2>
              <p className="text-muted-foreground text-sm">
                This reset link is invalid or has expired. Reset links only work for 15 minutes —
                request a new one and try again.
              </p>
              <a
                href="/forgot-password"
                className="inline-block mt-2 bg-mission-600 hover:bg-mission-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
              >
                Request a new link
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-foreground/80 mb-1.5">
                  New password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="password"
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-mission-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground/80 mb-1.5">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="password"
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-mission-500 transition-colors"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-mission-600 hover:bg-mission-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-full font-semibold transition-colors"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-6">
          <a href="/login" className="text-muted-foreground hover:text-foreground text-sm transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to sign in
          </a>
        </p>
      </motion.div>
    </div>
  );
}
