import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface FieldErrorProps {
  message?: string;
}

export function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;

  return (
    <p className="mt-1.5 text-sm font-medium text-red-600 dark:text-red-400" role="alert">
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
          className="input-field pr-12"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-2 top-1/2 inline-flex min-h-[40px] min-w-[40px] -translate-y-1/2
            items-center justify-center rounded-lg text-slate-400 transition-colors
            hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-white/10 dark:hover:text-brand-300"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      <FieldError message={error} />
    </div>
  );
}
