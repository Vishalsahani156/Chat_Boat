import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from '../utils/authErrors';

const PASSWORD_MIN = 4;
const PASSWORD_MAX = 8;
const USERNAME_MAX = 12;
const EMAIL_MAX = 50;
const USERNAME_REGEX = /^[a-zA-Z0-9]*$/;
const MSG_EMAIL_TOO_LONG = 'Please add short email';
const MSG_PASSWORD_REQUIRED = 'Password field is required.';
const MSG_PASSWORD_MIN = 'Minimum 4 characters required.';
const MSG_PASSWORD_MAX = 'Maximum 8 characters allowed.';

function showPopup(message: string) {
  window.alert(message);
}

export default function RegisterPage() {
  const { register, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleNameChange = (value: string) => {
    if (!USERNAME_REGEX.test(value)) {
      showPopup('Username can only contain letters and numbers.');
      return;
    }
    if (value.length > USERNAME_MAX) {
      showPopup('Maximum length is 12 characters.');
      return;
    }
    setError(null);
    setName(value);
  };

  const handleEmailChange = (value: string) => {
    if (value.trim().length > EMAIL_MAX) {
      showPopup(MSG_EMAIL_TOO_LONG);
      return;
    }
    setError(null);
    setEmail(value);
  };

  const handlePasswordChange = (value: string) => {
    if (value.length > PASSWORD_MAX) {
      showPopup(MSG_PASSWORD_MAX);
      return;
    }
    setError(null);
    setPassword(value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      showPopup('Username is required.');
      return;
    }
    if (!USERNAME_REGEX.test(trimmedName)) {
      showPopup('Username can only contain letters and numbers.');
      return;
    }
    if (trimmedName.length > USERNAME_MAX) {
      showPopup('Maximum length is 12 characters.');
      return;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail.length > EMAIL_MAX) {
      showPopup(MSG_EMAIL_TOO_LONG);
      return;
    }

    if (!password) {
      showPopup(MSG_PASSWORD_REQUIRED);
      return;
    }
    if (password.length < PASSWORD_MIN) {
      showPopup(MSG_PASSWORD_MIN);
      return;
    }
    if (password.length > PASSWORD_MAX) {
      showPopup(MSG_PASSWORD_MAX);
      return;
    }

    setSubmitting(true);

    try {
      await register(trimmedName, trimmedEmail, password);
      navigate('/');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-dark-900">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-dark-700 dark:bg-dark-800">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
            <Sparkles size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create account</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-dark-400">Sign up to start chatting</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-dark-200">
              Username
            </label>
            <input
              id="name"
              type="text"
              required
              maxLength={USERNAME_MAX}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-dark-600 dark:bg-dark-700 dark:text-white"
              placeholder="Letters & numbers, max 12"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-dark-200">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-dark-600 dark:bg-dark-700 dark:text-white"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-dark-200">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              maxLength={PASSWORD_MAX}
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-dark-600 dark:bg-dark-700 dark:text-white"
              placeholder="4–8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-dark-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
