import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { DEFAULT_LEARNING_DASHBOARD_RESPONSE } from '@/config/learning-data';
import { LearningDashboardResponseDto } from '@/types/learning';

function getLearningDashboardUrl(): string {
  let url = process.env.LEARNING_DASHBOARD_URL || '';
  const base = (
    process.env.LEARNING_BASE_URL ||
    process.env.BASE_URL ||
    'http://192.168.18.78:8085/'
  ).replace(/\/+$/, '');

  if (url.includes('${BASE_URL}')) {
    url = url.replace('${BASE_URL}', `${base}/`);
  }
  if (!url) {
    url = `${base}/api/learning/dashboard`;
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
  const targetUrl = getLearningDashboardUrl();
  logger.info(`Fetching learning dashboard from ${targetUrl}`, 'LearningDashboardAPI');

  try {
    const authHeader = getAuthHeader(request);
    const headers: Record<string, string> = {
      accept: '*/*',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const backendRes = await fetch(targetUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
      cache: 'no-store',
    }).finally(() => clearTimeout(timeoutId));

    if (!backendRes.ok) {
      const errText = await backendRes.text();
      logger.warn(
        `Backend returned ${backendRes.status} for ${targetUrl}: ${errText}. Using fallback dataset.`,
        'LearningDashboardAPI'
      );
      return NextResponse.json(DEFAULT_LEARNING_DASHBOARD_RESPONSE, { status: 200 });
    }

    const data: LearningDashboardResponseDto = await backendRes.json();
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    logger.warn(
      `Network/fetch error reaching ${targetUrl}: ${error}. Returning fallback live dataset.`,
      'LearningDashboardAPI'
    );
    // Return standard response so UI always displays smoothly
    return NextResponse.json(DEFAULT_LEARNING_DASHBOARD_RESPONSE, {
      status: 200,
      headers: {
        'X-Fallback': 'true',
      },
    });
  }
}

