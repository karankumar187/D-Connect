import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { AuthSession, SafeDiscordAccount } from './types';
import { DiscordAccount } from '@prisma/client';

const JWT_SECRET = new TextEncoder().encode(
  process.env.SECRET_KEY || 'default-dashboard-jwt-secret-key-32-chars-min'
);

const COOKIE_NAME = 'discord_dashboard_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(session: AuthSession): Promise<string> {
  return new SignJWT({
    userId: session.userId,
    email: session.email,
    name: session.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: (payload.name as string) || null,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export function getSessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: SESSION_DURATION_SECONDS,
    path: '/',
  };
}

/**
 * Sanitizes a DiscordAccount database object to strictly prevent any token exposure.
 */
export function sanitizeAccount(account: DiscordAccount): SafeDiscordAccount {
  return {
    id: account.id,
    userId: account.userId,
    discordUserId: account.discordUserId,
    username: account.username,
    globalName: account.globalName,
    avatarHash: account.avatarHash,
    avatarUrl: account.avatarUrl,
    email: account.email,
    tokenExpiresAt: account.tokenExpiresAt.toISOString(),
    authorizationStatus: account.authorizationStatus as any,
    nitroStatus: account.nitroStatus as any,
    nitroPlan: account.nitroPlan,
    lastSyncedAt: account.lastSyncedAt ? account.lastSyncedAt.toISOString() : null,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}
