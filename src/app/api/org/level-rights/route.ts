import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

function getLevelRightsUrl(): string {
  let url = process.env.ORG_LEVEL_RIGHTS_URL || '';
  const base = (process.env.BASE_URL || 'http://192.168.18.31:8085/').replace(/\/+$/, '');
  if (url.includes('${BASE_URL}')) {
    url = url.replace('${BASE_URL}', `${base}/`);
  }
  if (!url) {
    url = `${base}/api/org/level-rights`;
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

    const targetUrl = getLevelRightsUrl();
    logger.info(`Fetching level rights from ${targetUrl}`, 'LevelRightsAPI');

    const backendRes = await fetch(targetUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000),
    });

    if (backendRes.status === 404) {
      const fallbackUrl =
        process.env.ORG_DEPARTMENTS_AND_LEVELS_URL ||
        (process.env.BASE_URL
          ? `${process.env.BASE_URL.replace(/\/+$/, '')}/api/org/departments-and-levels`
          : 'http://192.168.18.31:8085/api/org/departments-and-levels');
      logger.info(`Level-rights endpoint returned 404, falling back to ${fallbackUrl}`, 'LevelRightsAPI');
      const fallbackRes = await fetch(fallbackUrl, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(10000),
      });

      if (fallbackRes.ok) {
        const fallbackText = await fallbackRes.text();
        let fallbackData: Record<string, unknown> | null = null;
        try {
          fallbackData = JSON.parse(fallbackText);
        } catch {
          fallbackData = null;
        }
        const lvls = (fallbackData?.levels as unknown[]) || (fallbackData?.predefinedLevels as unknown[]) || [];
        return NextResponse.json({
          success: true,
          data: lvls,
        });
      }
    }

    const text = await backendRes.text();
    let data: unknown = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text ? { raw: text } : null;
    }

    if (!backendRes.ok) {
      logger.warn(`Failed to fetch level rights (${backendRes.status})`, 'LevelRightsAPI', data);
      const errObj = (data && typeof data === 'object') ? (data as Record<string, unknown>) : {};
      return NextResponse.json(
        {
          success: false,
          message: (errObj.message as string) || 'Failed to fetch level rights',
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
    logger.error('Error in GET level-rights', 'LevelRightsAPI', error);
    return NextResponse.json(
      { success: false, message: 'Unable to connect to level rights service', code: 'SERVICE_UNAVAILABLE' },
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

    const targetUrl = getLevelRightsUrl();
    logger.info(`Updating level rights at ${targetUrl}`, 'LevelRightsAPI');

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
      logger.warn(`Failed to update level rights (${backendRes.status})`, 'LevelRightsAPI', data);
      const errObj = (data && typeof data === 'object') ? (data as Record<string, unknown>) : {};
      return NextResponse.json(
        {
          success: false,
          message: (errObj.message as string) || (errObj.error as string) || 'Failed to update level rights',
          error: data,
        },
        { status: backendRes.status }
      );
    }

    const response = NextResponse.json({
      success: true,
      nextStep: 'INVITE_TEAM',
      data,
      message: 'Level rights updated successfully',
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
    logger.error('Error in PUT level-rights', 'LevelRightsAPI', error);
    return NextResponse.json(
      { success: false, message: 'Unable to connect to level rights service', code: 'SERVICE_UNAVAILABLE' },
      { status: 503 }
    );
  }
}
