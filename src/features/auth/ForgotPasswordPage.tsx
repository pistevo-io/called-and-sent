import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft } from 'lucide-react';
import { authClient } from './auth';
import { useRedirectIfAuthed } from './authHooks';

export default function ForgotPasswordPage() {
  // Logged-in visitors shouldn't see the reset request form; same guard as login/signup.
  useRedirectIfAuthed();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Neon Managed Better Auth sends a tokenized reset link to this email.
      // redirectTo is where the emailed link lands (must be our own origin —
      // the Neon auth server has no hosted reset page of its own).
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setError(error.message || 'Could not send reset link');
      } else {
        setSent(true);
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
          <p className="text-muted-foreground mt-2">Reset your password</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          {sent ? (
            <div className="text-center space-y-4">
              <Mail className="w-10 h-10 mx-auto text-mission-500" />
              <h2 className="text-xl font-semibold text-foreground">Check your email</h2>
              <p className="text-muted-foreground text-sm">
                If an account exists for <span className="text-foreground">{email}</span>, we've
                sent a link to reset your password. The link expires after 15 minutes.
              </p>
              <a
                href="/login"
                className="inline-block mt-2 text-mission-400 hover:text-mission-300 font-semibold transition-colors"
              >
                Back to sign in
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-muted-foreground text-sm">
                Enter your account email and we'll send you a link to reset your password.
              </p>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground/80 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
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
                {loading ? 'Sending...' : 'Send Reset Link'}
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
