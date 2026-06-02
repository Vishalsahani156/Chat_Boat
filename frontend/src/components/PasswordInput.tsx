import { useState } from 'react';

interface FieldErrorProps {
  message?: string;
}

export function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;

  return (
    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
      {message}
    </p>
  );
}

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
}

export default function PasswordInput({
  id,
  value,
  onChange,
  placeholder = 'Enter password',
  autoComplete = 'current-password',
  error,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <div className="relative">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 pr-28 text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-dark-600 dark:bg-dark-700 dark:text-white"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? 'Hide Password' : 'Show Password'}
        </button>
      </div>
      <FieldError message={error} />
    </div>
  );
}
