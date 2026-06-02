import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import PasswordInput, { FieldError } from '../components/PasswordInput';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from '../utils/authErrors';
import {
  getEmailValidationError,
  getPasswordValidationError,
  normalizeEmailInput,
} from '../utils/passwordValidation';

type FieldKey = 'email' | 'password';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const showFieldError = (field: FieldKey): string | undefined => {
    if (!touched[field] && !submitted) return undefined;
    return fieldErrors[field];
  };

  const validateField = (field: FieldKey, values: { email: string; password: string }) => {
    let error: string | null = null;
    switch (field) {
      case 'email':
        error = getEmailValidationError(values.email, 'login');
        break;
      case 'password':
        error = getPasswordValidationError(values.password);
        break;
    }
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (error) next[field] = error;
      else delete next[field];
      return next;
    });
    return error;
  };

  const validateAll = (values: { email: string; password: string }) => {
    const errors: Partial<Record<FieldKey, string>> = {};
    const emailError = getEmailValidationError(values.email, 'login');
    const passwordError = getPasswordValidationError(values.password);
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setTouched((prev) => ({ ...prev, email: true }));
    validateField('email', { email: value, password });
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setTouched((prev) => ({ ...prev, password: true }));
    validateField('password', { email, password: value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setSubmitted(true);

    const values = { email, password };
    if (!validateAll(values)) return;

    setSubmitting(true);

    try {
      await login(normalizeEmailInput(email), password);
      navigate('/', { replace: true });
    } catch (err) {
      setApiError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen min-h-[100dvh] items-center justify-center overflow-x-hidden p-4 sm:p-6">
      <div className="glass-card w-full max-w-md animate-fade-in-up p-6 sm:p-8">
        <div className="mb-8 text-center">
          <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow">
            <Sparkles size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome back</h1>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">Sign in to continue to AI Chatbot</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {apiError && (
            <div
              className="rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-800
                dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
              role="alert"
            >
              {apiError}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
            />
            <FieldError message={showFieldError('email')} />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Password
            </label>
            <PasswordInput
              id="password"
              value={password}
              onChange={handlePasswordChange}
              error={showFieldError('password')}
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
