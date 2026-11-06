import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

function getInvitationsBaseUrl(): string {
  let url = process.env.AUTH_INVITATIONS_URL;
  const rawBase = process.env.BASE_URL || 'http://192.168.18.45:8085/';
  const base = rawBase.replace(/\/+$/, '');

  if (url && url.includes('${BASE_URL}')) {
    url = url.replace('${BASE_URL}', `${base}/`);
  }
  if (!url) {
    url = `${base}/api/auth/invitations`;
  }
  return url.replace(/\/+$/, '');
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;

    if (!code || !code.trim()) {
      return NextResponse.json(
        { success: false, message: 'Invitation code is required' },
        { status: 400 }
      );
    }

    const baseUrl = getInvitationsBaseUrl();
    const targetUrl = `${baseUrl}/${encodeURIComponent(code.trim())}`;
    logger.info(`Verifying invite code at ${targetUrl}`, 'AuthInvitationsAPI');

    const backendRes = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        accept: '*/*',
      },
      signal: AbortSignal.timeout(10000),
    });

    const text = await backendRes.text();
    let data: unknown = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text ? { message: text } : null;
    }

    if (!backendRes.ok) {
      logger.warn(`Failed to verify invite code (${backendRes.status})`, 'AuthInvitationsAPI', data);
      const errObj = (data && typeof data === 'object') ? (data as Record<string, unknown>) : {};
      return NextResponse.json(
        {
          success: false,
          message:
            (errObj.message as string) ||
            (errObj.error as string) ||
            "This code isn't valid or has expired. Check it with your company admin, or ask them to send a new invite.",
          error: data,
        },
        { status: backendRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Invitation code verified successfully',
    });
  } catch (error) {
    logger.error('Error verifying invite code', 'AuthInvitationsAPI', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to connect to invitation verification service',
        code: 'SERVICE_UNAVAILABLE',
      },
      { status: 503 }
    );
  }
}
