import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Network, Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const KEYCLOAK_ENABLED = import.meta.env.VITE_KEYCLOAK_ENABLED === 'true';
const ALLOW_REGISTRATION = import.meta.env.VITE_ALLOW_REGISTRATION === 'true';

export function LoginPage() {
  const navigate  = useNavigate();
  const { login, isLoading } = useAuthStore();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-axilog-gray dark:bg-dark-base flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl p-8
                        border border-gray-100 dark:border-dark-border">

          {/* Logo + name */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-axilog-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Network className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-axilog-primary dark:text-axilog-primary-light">
              NetTopoSuite
            </h1>
            <p className="text-sm text-gray-500 dark:text-dark-muted mt-1">
              Enterprise Network Topology & Service Management
            </p>
            <p className="text-xs text-gray-400 dark:text-dark-muted mt-0.5 font-medium">by Axilog</p>
          </div>

          {/* Keycloak SSO button (conditional) */}
          {KEYCLOAK_ENABLED && (
            <>
              <a
                href="/api/v1/auth/login?provider=keycloak"
                className="w-full flex items-center justify-center gap-3 px-4 py-3
                           border-2 border-axilog-primary text-axilog-primary
                           dark:border-axilog-primary-light dark:text-axilog-primary-light
                           rounded-xl font-semibold text-sm
                           hover:bg-axilog-primary hover:text-white
                           dark:hover:bg-axilog-primary transition-colors"
              >
                <Shield className="w-5 h-5" />
                Sign in with Axilog SSO
              </a>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-200 dark:bg-dark-border" />
                <span className="text-xs text-gray-400 dark:text-dark-muted">or sign in with email</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-dark-border" />
              </div>
            </>
          )}

          {/* Local login form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@axilog.local"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border
                           bg-white dark:bg-dark-elevated
                           text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-muted
                           focus:outline-none focus:ring-2 focus:ring-axilog-primary dark:focus:ring-axilog-primary-light
                           focus:border-transparent transition-colors text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-300 dark:border-dark-border
                             bg-white dark:bg-dark-elevated
                             text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-muted
                             focus:outline-none focus:ring-2 focus:ring-axilog-primary dark:focus:ring-axilog-primary-light
                             focus:border-transparent transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-dark-muted"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end mt-1">
                <Link to="/forgot-password" className="text-xs text-axilog-secondary hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20
                              border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white
                         bg-axilog-primary hover:bg-axilog-primary-dark
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors shadow-md"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Register link */}
          {ALLOW_REGISTRATION && (
            <p className="text-center text-sm text-gray-500 dark:text-dark-muted mt-5">
              No account?{' '}
              <Link to="/register" className="text-axilog-secondary font-semibold hover:underline">
                Create one
              </Link>
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 dark:text-dark-muted mt-4">
          Axilog NetTopoSuite v1.0 — Enterprise Network Operations
        </p>
      </div>
    </div>
  );
}
