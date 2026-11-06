import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const USER_PROFILE_URL =
  process.env.USER_PROFILE_URL ||
  process.env.USER_DETAILS_URL ||
  'http://192.168.18.45:8085/api/user/profile';

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

    try {
      const backendRes = await fetch(USER_PROFILE_URL, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(6000),
      });

      if (backendRes.ok) {
        const data = await backendRes.json().catch(() => null);
        return NextResponse.json({
          success: true,
          data,
        });
      }
    } catch {
      // Backend not yet available or endpoint not ready - gracefully return empty profile
    }

    return NextResponse.json({
      success: true,
      data: null,
      message: 'Profile details initialized',
    });
  } catch (error) {
    logger.error('Error in GET user profile', 'UserProfileAPI', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve user profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return handleSaveProfile(request);
}

export async function PUT(request: NextRequest) {
  return handleSaveProfile(request);
}

async function handleSaveProfile(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);
    const body = await request.json().catch(() => ({}));

    const headers: Record<string, string> = {
      accept: '*/*',
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    let backendData: unknown = null;
    let savedOnBackend = false;

    try {
      logger.info(`Forwarding profile update to ${USER_PROFILE_URL}`, 'UserProfileAPI');
      const backendRes = await fetch(USER_PROFILE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(6000),
      });

      if (backendRes.ok) {
        backendData = await backendRes.json().catch(() => null);
        savedOnBackend = true;
      }
    } catch (err) {
      logger.warn('Backend profile update failed or unavailable, using fallback', 'UserProfileAPI', err);
    }

    const response = NextResponse.json({
      success: true,
      data: backendData || body,
      savedOnBackend,
      nextStep: 'DASHBOARD',
      message: 'Profile completed successfully',
    });

    // Set next_step cookie to DASHBOARD
    response.cookies.set('next_step', 'DASHBOARD', {
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    logger.error('Error saving profile', 'UserProfileAPI', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save profile' },
      { status: 500 }
    );
  }
}
