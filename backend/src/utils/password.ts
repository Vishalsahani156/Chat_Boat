import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

const PASSWORD_MIN = 4;
const PASSWORD_MAX = 8;

export function validatePassword(password: string): string | null {
  if (!password || password.length === 0) {
    return "Password is required";
  }
  if (password.length < PASSWORD_MIN) {
    return "Password must be at least 4 characters";
  }
  if (password.length > PASSWORD_MAX) {
    return "Password cannot exceed 8 characters";
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
