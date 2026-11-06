import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const BASE_URL = process.env.BASE_URL || 'http://192.168.18.31:8085/';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Verification token is required' },
        { status: 400 }
      );
    }

    const backendUrl = new URL('api/auth/verify-email', BASE_URL);
    backendUrl.searchParams.set('token', token);

    logger.info(`Forwarding email verification to ${backendUrl}`, 'VerifyEmailAPI');

    const backendRes = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'accept': '*/*',
      },
      signal: AbortSignal.timeout(8000),
    });

    const data = await backendRes.json().catch(() => null);

    if (backendRes.ok) {
      return NextResponse.json(
        {
          success: true,
          message: (data?.message as string) || 'Email verified successfully. You can now log in.',
          data,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: (data?.message as string) || (data?.error as string) || 'Invalid or expired verification token.',
        data,
      },
      { status: backendRes.status }
    );
  } catch (error) {
    logger.error('Error verifying email token', 'VerifyEmailAPI', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to connect to the email verification service.',
      },
      { status: 503 }
    );
  }
}
