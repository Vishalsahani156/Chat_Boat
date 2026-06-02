import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import PasswordInput, { FieldError } from '../components/PasswordInput';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from '../utils/authErrors';
import {
  getEmailValidationError,
  getPasswordValidationError,
  getUsernameValidationError,
  normalizeEmailInput,
} from '../utils/passwordValidation';

type FieldKey = 'name' | 'email' | 'password';

export default function RegisterPage() {
  const { register, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
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

  const validateField = (field: FieldKey, values: { name: string; email: string; password: string }) => {
    let error: string | null = null;
    switch (field) {
      case 'name':
        error = getUsernameValidationError(values.name);
        break;
      case 'email':
        error = getEmailValidationError(values.email);
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

  const validateAll = (values: { name: string; email: string; password: string }) => {
    const errors: Partial<Record<FieldKey, string>> = {};
    const nameError = getUsernameValidationError(values.name);
    const emailError = getEmailValidationError(values.email);
    const passwordError = getPasswordValidationError(values.password);
    if (nameError) errors.name = nameError;
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setTouched((prev) => ({ ...prev, name: true }));
    validateField('name', { name: value, email, password });
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setTouched((prev) => ({ ...prev, email: true }));
    validateField('email', { name, email: value, password });
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setTouched((prev) => ({ ...prev, password: true }));
    validateField('password', { name, email, password: value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setSubmitted(true);

    const values = { name, email, password };
    if (!validateAll(values)) return;

    setSubmitting(true);

    try {
      await register(name.trim(), normalizeEmailInput(email), password);
      navigate('/');
    } catch (err) {
      setApiError(getAuthErrorMessage(err));
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
          {apiError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
              {apiError}
            </div>
          )}

          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-dark-200">
              Username
            </label>
            <input
              id="name"
              type="text"
              autoComplete="username"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-dark-600 dark:bg-dark-700 dark:text-white"
              placeholder="yourusername"
            />
            <FieldError message={showFieldError('name')} />
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-dark-200">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-dark-600 dark:bg-dark-700 dark:text-white"
              placeholder="you@example.com"
            />
            <FieldError message={showFieldError('email')} />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-dark-200">
              Password
            </label>
            <PasswordInput
              id="password"
              value={password}
              onChange={handlePasswordChange}
              autoComplete="new-password"
              error={showFieldError('password')}
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
