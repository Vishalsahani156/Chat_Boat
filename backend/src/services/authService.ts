import prisma from "../config/database";
import { AppError } from "../middleware/errorHandler";
import { comparePassword, hashPassword, validatePassword } from "../utils/password";
import { signAccessToken } from "../utils/jwt";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface AuthResult {
  user: AuthUser;
  token: string;
}

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();

  const passwordError = validatePassword(password);
  if (passwordError) {
    throw new AppError(passwordError, 400);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new AppError("Email is already registered", 409);
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name: trimmedName,
      email: normalizedEmail,
      password: hashedPassword,
    },
  });

  const token = signAccessToken({ userId: user.id, email: user.email });

  return {
    user: toPublicUser(user),
    token,
  };
}

export async function loginUser(email: string, password: string): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AppError("Invalid email", 401);
  }

  const isValidPassword = await comparePassword(password, user.password);
  if (!isValidPassword) {
    throw new AppError("Invalid password", 401);
  }

  const token = signAccessToken({ userId: user.id, email: user.email });

  return {
    user: toPublicUser(user),
    token,
  };
}

export async function getUserById(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return toPublicUser(user);
}
