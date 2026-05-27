import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

const PASSWORD_MIN = 4;
const PASSWORD_MAX = 8;

export function validatePassword(password: string): string | null {
  if (!password || password.length === 0) {
    return "Password field is required.";
  }
  if (password.length < PASSWORD_MIN) {
    return "Minimum 4 characters required.";
  }
  if (password.length > PASSWORD_MAX) {
    return "Maximum 8 characters allowed.";
  }
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
