import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { OrgInvitationsRequest } from '@/types';

function getInvitationsUrl(): string {
  let url = process.env.ORG_INVITATIONS_URL;
  const rawBase = process.env.BASE_URL || 'http://192.168.18.31:8085/';
  const base = rawBase.replace(/\/+$/, '');

  if (url && url.includes('${BASE_URL}')) {
    url = url.replace('${BASE_URL}', `${base}/`);
  }
  if (!url) {
    url = `${base}/api/org/invitations`;
  }
  return url;
}

function getAuthHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (
    authHeader &&
    authHeader.trim() !== '' &&
    authHeader !== 'Bearer' &&
    authHeader !== 'Bearer null' &&
    authHeader !== 'Bearer undefined'
  ) {
    return authHeader;
  }

  const cookieToken =
    request.cookies.get('accessToken')?.value ||
    request.cookies.get('auth_token')?.value ||
    request.cookies.get('access_token')?.value ||
    request.cookies.get('token')?.value;
  if (
    cookieToken &&
    cookieToken.trim() !== '' &&
    cookieToken !== 'null' &&
    cookieToken !== 'undefined'
  ) {
    return `Bearer ${cookieToken.trim()}`;
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);
    const body: OrgInvitationsRequest = await request.json();

    const headers: Record<string, string> = {
      accept: '*/*',
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const targetUrl = getInvitationsUrl();
    logger.info(`Sending invitations to ${targetUrl}`, 'InvitationsAPI');

    const backendRes = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    const text = await backendRes.text();
    let data: unknown = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text ? { message: text } : null;
    }

    if (!backendRes.ok) {
      logger.warn(`Failed to send invitations (${backendRes.status})`, 'InvitationsAPI', data);
      const errObj = (data && typeof data === 'object') ? (data as Record<string, unknown>) : {};
      return NextResponse.json(
        {
          success: false,
          message: (errObj.message as string) || (errObj.error as string) || 'Failed to send invitations',
          error: data,
        },
        { status: backendRes.status }
      );
    }

    const response = NextResponse.json({
      success: true,
      nextStep: 'DASHBOARD',
      data,
      message: 'Invitations processed successfully',
    });

    response.cookies.set('next_step', 'DASHBOARD', {
      path: '/',
      maxAge: 604800,
      sameSite: 'lax',
    });
    response.cookies.set('onboarding_step_3_completed', 'true', {
      path: '/',
      maxAge: 604800,
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    logger.error('Error in POST invitations', 'InvitationsAPI', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to connect to invitations service',
        code: 'SERVICE_UNAVAILABLE',
      },
      { status: 503 }
    );
  }
}
