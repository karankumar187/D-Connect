import { NextResponse } from 'next/server';
import { getSessionCookieOptions } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  const cookieOptions = getSessionCookieOptions();
  
  // Clear the session cookie
  response.cookies.set(cookieOptions.name, '', {
    ...cookieOptions,
    maxAge: 0,
  });

  return response;
}
