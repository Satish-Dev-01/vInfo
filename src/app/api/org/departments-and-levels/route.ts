import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

function getDepartmentsAndLevelsUrl(): string {
  let url = process.env.ORG_DEPARTMENTS_AND_LEVELS_URL || '';
  const base = (process.env.BASE_URL || 'http://192.168.18.31:8085/').replace(/\/+$/, '');
  if (url.includes('${BASE_URL}')) {
    url = url.replace('${BASE_URL}', `${base}/`);
  }
  if (!url) {
    url = `${base}/api/org/departments-and-levels`;
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

    const targetUrl = getDepartmentsAndLevelsUrl();
    logger.info(`Fetching departments and levels from ${targetUrl}`, 'DepartmentsAndLevelsAPI');

    const backendRes = await fetch(targetUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000),
    });

    const text = await backendRes.text();
    let data: unknown = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text ? { raw: text } : null;
    }

    if (!backendRes.ok) {
      logger.warn(`Failed to fetch departments and levels (${backendRes.status})`, 'DepartmentsAndLevelsAPI', data);
      const errObj = (data && typeof data === 'object') ? (data as Record<string, unknown>) : {};
      return NextResponse.json(
        {
          success: false,
          message: (errObj.message as string) || (errObj.error as string) || 'Failed to fetch departments and levels',
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
    logger.error('Error in GET departments-and-levels', 'DepartmentsAndLevelsAPI', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to connect to departments and levels service',
        code: 'SERVICE_UNAVAILABLE',
      },
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

    const targetUrl = getDepartmentsAndLevelsUrl();
    logger.info(`Updating departments and levels at ${targetUrl}`, 'DepartmentsAndLevelsAPI');

    const backendRes = await fetch(targetUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
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
      logger.warn(`Failed to update departments and levels (${backendRes.status})`, 'DepartmentsAndLevelsAPI', data);
      const errObj = (data && typeof data === 'object') ? (data as Record<string, unknown>) : {};
      return NextResponse.json(
        {
          success: false,
          message: (errObj.message as string) || (errObj.error as string) || 'Failed to update departments and levels',
          error: data,
        },
        { status: backendRes.status }
      );
    }

    const response = NextResponse.json({
      success: true,
      nextStep: 'INVITE_TEAM',
      data,
      message: 'Departments and levels updated successfully',
    });

    response.cookies.set('next_step', 'INVITE_TEAM', {
      path: '/',
      maxAge: 604800,
      sameSite: 'lax',
    });
    response.cookies.set('onboarding_step_2_completed', 'true', {
      path: '/',
      maxAge: 604800,
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    logger.error('Error in PUT departments-and-levels', 'DepartmentsAndLevelsAPI', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to connect to departments and levels service',
        code: 'SERVICE_UNAVAILABLE',
      },
      { status: 503 }
    );
  }
}
