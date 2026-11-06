import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

function getBillingDetailsUrl(): string {
  let url = process.env.ORG_BILLING_DETAILS_URL || '';
  const base = (process.env.BASE_URL || 'http://192.168.18.31:8085/').replace(/\/+$/, '');
  if (url.includes('${BASE_URL}')) {
    url = url.replace('${BASE_URL}', `${base}/`);
  }
  if (!url) {
    url = `${base}/api/org/billing-details`;
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

export async function GET(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);
    const headers: Record<string, string> = {
      accept: '*/*',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const targetUrl = getBillingDetailsUrl();
    const backendRes = await fetch(targetUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000),
    });

    const text = await backendRes.text();
    let data: Record<string, unknown> | null = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text ? { raw: text } : null;
    }

    if (!backendRes.ok) {
      logger.warn(`Failed to fetch billing details (${backendRes.status})`, 'BillingDetailsAPI', data);
      return NextResponse.json(
        {
          success: false,
          message: (data?.message as string) || 'Failed to fetch billing details',
          error: data,
        },
        { status: backendRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Error in GET billing-details', 'BillingDetailsAPI', error);
    return NextResponse.json(
      { success: false, message: 'Unable to connect to billing details service', code: 'SERVICE_UNAVAILABLE' },
      { status: 503 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);
    const body = await request.json();

    const headers: Record<string, string> = {
      accept: '*/*',
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const targetUrl = getBillingDetailsUrl();
    logger.info(`Sending PUT billing-details to ${targetUrl}`, 'BillingDetailsAPI');

    const backendRes = await fetch(targetUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    const text = await backendRes.text();
    let data: Record<string, unknown> | null = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text ? { message: text } : null;
    }

    if (!backendRes.ok) {
      logger.warn(`Failed to save billing details (${backendRes.status})`, 'BillingDetailsAPI', data);
      return NextResponse.json(
        {
          success: false,
          message: (data?.message as string) || (data?.error as string) || 'Failed to save billing details',
          error: data,
        },
        { status: backendRes.status }
      );
    }

    const dataObj = (data && typeof data === 'object') ? (data as Record<string, unknown>) : {};
    const backendNextStep =
      (dataObj.nextStep as string) ||
      (dataObj.data && typeof dataObj.data === 'object'
        ? ((dataObj.data as Record<string, unknown>).nextStep as string)
        : undefined);
    const nextStep = backendNextStep || 'DEPARTMENTS_AND_LEVELS';

    const response = NextResponse.json({
      success: true,
      data,
      nextStep,
      message: (dataObj?.message as string) || 'Organisation & billing details saved',
    });

    response.cookies.set('next_step', nextStep, {
      path: '/',
      maxAge: 604800,
      sameSite: 'lax',
    });
    response.cookies.set('onboarding_step_1_completed', 'true', {
      path: '/',
      maxAge: 604800,
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    logger.error('Error in PUT billing-details', 'BillingDetailsAPI', error);
    return NextResponse.json(
      { success: false, message: 'Unable to connect to billing details service', code: 'SERVICE_UNAVAILABLE' },
      { status: 503 }
    );
  }
}
