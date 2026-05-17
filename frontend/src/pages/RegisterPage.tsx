import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Network, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth.api';

export function RegisterPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const [form, setForm] = useState({ email: '', password: '', displayName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 10) {
      setError('Password must be at least 10 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await authApi.register(form);
      setUser(user);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const field = (label: string, key: keyof typeof form, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={update(key)}
        placeholder={placeholder}
        required
        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border
                   bg-white dark:bg-dark-elevated text-gray-900 dark:text-dark-text
                   placeholder-gray-400 dark:placeholder-dark-muted
                   focus:outline-none focus:ring-2 focus:ring-axilog-primary
                   focus:border-transparent transition-colors text-sm"
      />
    </div>
  );

  const passwordStrength = form.password.length === 0 ? null
    : form.password.length < 10 ? 'weak'
    : form.password.length < 14 ? 'medium'
    : 'strong';

  return (
    <div className="min-h-screen bg-axilog-gray dark:bg-dark-base flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl p-8
                        border border-gray-100 dark:border-dark-border">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-axilog-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Network className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-axilog-primary dark:text-axilog-primary-light">
              Create your account
            </h1>
            <p className="text-sm text-gray-500 dark:text-dark-muted mt-1">Axilog NetTopoSuite</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {field('Full name', 'displayName', 'text', 'John Smith')}
            {field('Email address', 'email', 'email', 'you@axilog.local')}
            {field('Password', 'password', 'password', '10+ characters')}

            {/* Password strength indicator */}
            {passwordStrength && (
              <div className="flex items-center gap-2">
                <div className={`h-1.5 flex-1 rounded-full ${passwordStrength === 'strong' ? 'bg-green-500' : passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-red-400'}`} />
                <span className={`text-xs font-medium ${passwordStrength === 'strong' ? 'text-green-600' : passwordStrength === 'medium' ? 'text-yellow-600' : 'text-red-500'}`}>
                  {passwordStrength === 'strong' ? '✓ Strong' : passwordStrength === 'medium' ? 'Medium' : 'Too short'}
                </span>
              </div>
            )}

            {/* New account notice */}
            <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-4 py-3">
              <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                New accounts start with <strong>Viewer</strong> access. An administrator can promote your role.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20
                              border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white
                         bg-axilog-secondary hover:bg-axilog-secondary-dark
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors shadow-md"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-dark-muted mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-axilog-primary dark:text-axilog-primary-light font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
