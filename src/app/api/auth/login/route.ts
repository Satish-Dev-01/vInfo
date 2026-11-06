import { NextRequest, NextResponse } from 'next/server';
import { cacheStore } from '@/lib/cache';
import { logger } from '@/lib/logger';

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes in milliseconds
function resolveAuthBackendUrl(): string {
  let url = process.env.AUTH_BACKEND_URL || '';
  if (url.includes('${BASE_URL}')) {
    const base = process.env.BASE_URL || 'http://192.168.18.31:8085/';
    url = url.replace('${BASE_URL}', base);
  }
  if (!url) {
    url = process.env.BASE_URL
      ? `${process.env.BASE_URL.replace(/\/+$/, '')}/api/auth/login`
      : 'http://192.168.18.31:8085/api/auth/login';
  }
  return url;
}

interface LoginAttemptRecord {
  attempts: number;
  lockedUntil: number | null;
  lastAttemptAt: number;
}

function getCacheKey(email: string): string {
  return `auth_attempts:${email.trim().toLowerCase()}`;
}

/**
 * GET /api/auth/login?email=...
 * Check the current lock and attempt status for a given email address.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: { message: 'Email query parameter is required', code: 'MISSING_EMAIL' } },
        { status: 400 }
      );
    }

    const key = getCacheKey(email);
    const record = await cacheStore.get<LoginAttemptRecord>(key);

    if (!record) {
      return NextResponse.json({
        email,
        attempts: 0,
        maxAttempts: MAX_ATTEMPTS,
        remainingAttempts: MAX_ATTEMPTS,
        isLocked: false,
        lockedUntil: null,
        remainingSeconds: 0,
      });
    }

    const now = Date.now();
    const isCurrentlyLocked = !!record.lockedUntil && record.lockedUntil > now;

    // Auto-unlock if lock period has expired
    if (record.lockedUntil && record.lockedUntil <= now) {
      await cacheStore.delete(key);
      return NextResponse.json({
        email,
        attempts: 0,
        maxAttempts: MAX_ATTEMPTS,
        remainingAttempts: MAX_ATTEMPTS,
        isLocked: false,
        lockedUntil: null,
        remainingSeconds: 0,
      });
    }

    const remainingSeconds = isCurrentlyLocked && record.lockedUntil
      ? Math.max(0, Math.ceil((record.lockedUntil - now) / 1000))
      : 0;

    return NextResponse.json({
      email,
      attempts: record.attempts,
      maxAttempts: MAX_ATTEMPTS,
      remainingAttempts: Math.max(0, MAX_ATTEMPTS - record.attempts),
      isLocked: isCurrentlyLocked,
      lockedUntil: record.lockedUntil,
      remainingSeconds,
    });
  } catch (error) {
    logger.error('Error fetching login attempt status', 'AuthLoginAPI', error);
    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/login
 * Verifies credentials with backend API (http://192.168.18.248:8082/api/auth/login)
 * and manages failed attempt counting / 30-minute lockout.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, action } = body;

    if (!email) {
      return NextResponse.json(
        { error: { message: 'Email is required', code: 'MISSING_EMAIL' } },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const key = getCacheKey(normalizedEmail);
    const now = Date.now();

    // Manual reset action for dev/test support
    if (action === 'reset_lock') {
      await cacheStore.delete(key);
      return NextResponse.json({
        success: true,
        message: 'Lockout status cleared',
        attempts: 0,
        isLocked: false,
        remainingAttempts: MAX_ATTEMPTS,
      });
    }

    const existingRecord = await cacheStore.get<LoginAttemptRecord>(key);

    // If lock period has already expired, clear the old record
    if (existingRecord?.lockedUntil && existingRecord.lockedUntil <= now) {
      await cacheStore.delete(key);
    }

    const activeRecord = (existingRecord?.lockedUntil && existingRecord.lockedUntil > now)
      ? existingRecord
      : (existingRecord?.lockedUntil && existingRecord.lockedUntil <= now)
        ? null
        : existingRecord;

    // Check if user is currently locked out
    if (activeRecord?.lockedUntil && activeRecord.lockedUntil > now) {
      const remainingSeconds = Math.max(0, Math.ceil((activeRecord.lockedUntil - now) / 1000));
      return NextResponse.json(
        {
          success: false,
          isLocked: true,
          lockedUntil: activeRecord.lockedUntil,
          remainingSeconds,
          attempts: MAX_ATTEMPTS,
          maxAttempts: MAX_ATTEMPTS,
          remainingAttempts: 0,
          message: 'Account is temporarily locked for 30 minutes due to 5 unsuccessful login attempts.',
        },
        { status: 423 } // 423 Locked
      );
    }

    let isAuthenticationSuccessful = false;
    let backendResponseData: unknown = null;
    let backendErrorMessage = '';
    let backendStatus = 401;

    // Forward authentication request to backend API
    const backendUrl = resolveAuthBackendUrl();
    try {
      const backendRes = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
        signal: AbortSignal.timeout(10000),
      });

      backendStatus = backendRes.status;
      backendResponseData = await backendRes.json().catch(() => null);

      const parsedBackend = backendResponseData as Record<string, unknown> | null;
      const detectedNextStep =
        (parsedBackend?.nextStep as string) ||
        ((parsedBackend?.data as Record<string, unknown>)?.nextStep as string) ||
        null;

      const isVerifyEmailStep = detectedNextStep === 'VERIFY_EMAIL';

      if (backendRes.ok || isVerifyEmailStep) {
        isAuthenticationSuccessful = true;
      } else {
        isAuthenticationSuccessful = false;
        const errObj = backendResponseData as { message?: string; error?: string } | null;
        backendErrorMessage =
          errObj?.message ||
          errObj?.error ||
          (backendStatus === 404 ? 'User does not exist' : 'Incorrect email or password.');
      }
    } catch (networkError) {
      logger.error(`Could not reach auth backend at ${backendUrl}`, 'AuthLoginAPI', networkError);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Unable to connect to the login service. Please check your internet connection and try again.',
            code: 'SERVICE_UNAVAILABLE',
          },
        },
        { status: 503 }
      );
    }

    if (!isAuthenticationSuccessful) {
      // If user does not exist (404), do not increment lockout counter
      if (backendStatus === 404) {
        return NextResponse.json(
          {
            success: false,
            status: 404,
            message: backendErrorMessage || 'User does not exist',
            error: backendResponseData,
          },
          { status: 404 }
        );
      }

      const currentAttempts = (activeRecord?.attempts || 0) + 1;
      const willLock = currentAttempts >= MAX_ATTEMPTS;
      const lockedUntil = willLock ? now + LOCK_DURATION_MS : null;
      const remainingSeconds = willLock ? 30 * 60 : 0;

      const newRecord: LoginAttemptRecord = {
        attempts: currentAttempts,
        lockedUntil,
        lastAttemptAt: now,
      };

      // Store in cache for 35 minutes
      await cacheStore.set(key, newRecord, { ttlMs: 35 * 60 * 1000 });

      if (willLock) {
        logger.warn(`Account locked for email: ${normalizedEmail}`, 'AuthLoginAPI');
        return NextResponse.json(
          {
            success: false,
            isLocked: true,
            attempts: MAX_ATTEMPTS,
            maxAttempts: MAX_ATTEMPTS,
            remainingAttempts: 0,
            lockedUntil,
            remainingSeconds,
            message: 'Account is temporarily locked for 30 minutes after 5 unsuccessful attempts.',
          },
          { status: 423 }
        );
      }

      const remainingAttempts = Math.max(0, MAX_ATTEMPTS - currentAttempts);
      return NextResponse.json(
        {
          success: false,
          isLocked: false,
          attempts: currentAttempts,
          maxAttempts: MAX_ATTEMPTS,
          remainingAttempts,
          message: backendErrorMessage || `Incorrect password. ${remainingAttempts} attempts remaining.`,
          error: backendResponseData,
        },
        { status: backendStatus || 401 }
      );
    }

    // Successful credentials: Clear any previous failed attempts
    await cacheStore.delete(key);

    const parsedBackend = backendResponseData as Record<string, unknown> | null;
    const finalNextStep =
      (parsedBackend?.nextStep as string) ||
      ((parsedBackend?.data as Record<string, unknown>)?.nextStep as string) ||
      null;

    const token =
      (parsedBackend?.token as string) ||
      ((parsedBackend?.data as Record<string, unknown>)?.token as string) ||
      null;

    const finalUser =
      (parsedBackend?.user as Record<string, unknown>) ||
      ((parsedBackend?.data as Record<string, unknown>)?.user as Record<string, unknown>) || {
        email: normalizedEmail,
        fullName:
          ((parsedBackend?.user as Record<string, unknown>)?.fullName as string) ||
          (parsedBackend?.fullName as string) ||
          (parsedBackend?.name as string) ||
          normalizedEmail.split('@')[0],
        name: normalizedEmail.split('@')[0],
      };

    const response = NextResponse.json({
      success: true,
      token,
      nextStep: finalNextStep,
      user: finalUser,
      emailVerificationToken:
        ((parsedBackend?.emailVerificationToken as string) ||
          ((parsedBackend?.data as Record<string, unknown>)?.emailVerificationToken as string)) ??
        null,
      data: backendResponseData,
      message:
        finalNextStep === 'VERIFY_EMAIL'
          ? 'Please verify your email address to continue.'
          : 'Logged in successfully',
    });

    if (token) {
      response.cookies.set('auth_token', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });
      response.cookies.set('accessToken', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    if (finalNextStep) {
      response.cookies.set('next_step', finalNextStep, {
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    return response;
  } catch (error) {
    logger.error('Error processing login request', 'AuthLoginAPI', error);
    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
