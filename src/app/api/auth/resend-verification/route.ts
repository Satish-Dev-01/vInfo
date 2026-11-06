import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const RESEND_VERIFICATION_URL =
  process.env.AUTH_RESEND_VERIFICATION_URL ||
  'http://192.168.18.31:8085/api/auth/resend-verification';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let email = searchParams.get('email');

    // Also check JSON body if not present in search params
    if (!email) {
      try {
        const body = await request.json();
        email = body?.email;
      } catch {
        // No json body
      }
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { success: false, message: 'Email is required to resend verification link' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const targetUrl = new URL(RESEND_VERIFICATION_URL);
    targetUrl.searchParams.set('email', normalizedEmail);

    logger.info(`Resending verification email for ${normalizedEmail}`, 'ResendVerificationAPI');

    const backendRes = await fetch(targetUrl.toString(), {
      method: 'POST',
      headers: {
        'accept': '*/*',
      },
      body: '',
      signal: AbortSignal.timeout(8000),
    });

    const text = await backendRes.text();
    let data: Record<string, unknown> | null = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text ? { message: text } : null;
    }

    if (backendRes.ok) {
      logger.info(`Verification email resent successfully to ${normalizedEmail}`, 'ResendVerificationAPI');
      return NextResponse.json(
        {
          success: true,
          message: (data?.message as string) || 'Verification email sent successfully.',
          data,
        },
        { status: backendRes.status }
      );
    }

    const errorMsg =
      (data?.message as string) ||
      (data?.error as string) ||
      'Failed to resend verification email';

    logger.warn(`Failed to resend verification email: ${errorMsg} (${backendRes.status})`, 'ResendVerificationAPI');
    return NextResponse.json(
      {
        success: false,
        message: errorMsg,
        error: data,
      },
      { status: backendRes.status }
    );
  } catch (error) {
    logger.error('Error forwarding resend-verification request', 'ResendVerificationAPI', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to connect to the email verification service. Please try again later.',
        code: 'SERVICE_UNAVAILABLE',
      },
      { status: 503 }
    );
  }
}
