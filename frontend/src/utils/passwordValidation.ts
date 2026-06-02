export const PASSWORD_MIN = 4;
export const PASSWORD_MAX = 8;
export const USERNAME_MAX = 12;
export const EMAIL_MAX = 50;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9]*$/;

export const MSG_PASSWORD_REQUIRED = 'Password is required';
export const MSG_PASSWORD_MIN = 'Password must be at least 4 characters';
export const MSG_PASSWORD_MAX = 'Password cannot exceed 8 characters';

export const MSG_USERNAME_REQUIRED = 'Username is required';
export const MSG_USERNAME_MAX = 'Username cannot exceed 12 characters';
export const MSG_USERNAME_INVALID = 'Username can only contain letters and numbers';

export const MSG_EMAIL_REQUIRED = 'Email is required';
export const MSG_EMAIL_INVALID = 'Valid email is required';
export const MSG_EMAIL_INVALID_LOGIN = 'Invalid email format';
export const MSG_EMAIL_REQUIRED_LOGIN = 'Email is required';
export const MSG_EMAIL_TOO_LONG = 'Please add short email';

export type EmailValidationContext = 'login' | 'register';

export function getPasswordValidationError(password: string): string | null {
  if (!password) return MSG_PASSWORD_REQUIRED;
  if (password.length < PASSWORD_MIN) return MSG_PASSWORD_MIN;
  if (password.length > PASSWORD_MAX) return MSG_PASSWORD_MAX;
  return null;
}

export function getUsernameValidationError(name: string): string | null {
  if (!name.trim()) return MSG_USERNAME_REQUIRED;
  if (name.length > USERNAME_MAX) return MSG_USERNAME_MAX;
  if (!USERNAME_REGEX.test(name)) return MSG_USERNAME_INVALID;
  return null;
}

export function normalizeEmailInput(email: string): string {
  return email.trim().toLowerCase();
}

export function getEmailValidationError(
  email: string,
  context: EmailValidationContext = 'register'
): string | null {
  const trimmed = email.trim();

  if (!trimmed) {
    return context === 'login' ? MSG_EMAIL_REQUIRED_LOGIN : MSG_EMAIL_REQUIRED;
  }
  if (trimmed.length > EMAIL_MAX) return MSG_EMAIL_TOO_LONG;
  if (!EMAIL_REGEX.test(trimmed)) {
    return context === 'login' ? MSG_EMAIL_INVALID_LOGIN : MSG_EMAIL_INVALID;
  }
  return null;
}
