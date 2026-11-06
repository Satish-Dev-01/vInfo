import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

function getDepartmentsUrl(): string {
  let url = process.env.ORG_DEPARTMENTS_URL || '';
  const base = (process.env.BASE_URL || 'http://192.168.18.31:8085/').replace(/\/+$/, '');
  if (url.includes('${BASE_URL}')) {
    url = url.replace('${BASE_URL}', `${base}/`);
  }
  if (!url) {
    url = `${base}/api/org/departments`;
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

    const targetUrl = getDepartmentsUrl();
    logger.info(`Fetching departments from ${targetUrl}`, 'DepartmentsAPI');

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
      logger.info(`Departments endpoint returned 404, falling back to ${fallbackUrl}`, 'DepartmentsAPI');
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
        const depts = (fallbackData?.departments as unknown[]) || (fallbackData?.predefinedDepartments as unknown[]) || [];
        return NextResponse.json({
          success: true,
          data: depts,
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
      logger.warn(`Failed to fetch departments (${backendRes.status})`, 'DepartmentsAPI', data);
      const errObj = (data && typeof data === 'object') ? (data as Record<string, unknown>) : {};
      return NextResponse.json(
        {
          success: false,
          message: (errObj.message as string) || 'Failed to fetch departments',
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
    logger.error('Error in GET departments', 'DepartmentsAPI', error);
    return NextResponse.json(
      { success: false, message: 'Unable to connect to departments service', code: 'SERVICE_UNAVAILABLE' },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const targetUrl = getDepartmentsUrl();
    logger.info(`Adding custom department at ${targetUrl}`, 'DepartmentsAPI');

    const backendRes = await fetch(targetUrl, {
      method: 'POST',
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
      logger.warn(`Failed to add department (${backendRes.status})`, 'DepartmentsAPI', data);
      const errObj = (data && typeof data === 'object') ? (data as Record<string, unknown>) : {};
      return NextResponse.json(
        {
          success: false,
          message: (errObj.message as string) || (errObj.error as string) || 'Failed to add department',
          error: data,
        },
        { status: backendRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Department added successfully',
    });
  } catch (error) {
    logger.error('Error in POST departments', 'DepartmentsAPI', error);
    return NextResponse.json(
      { success: false, message: 'Unable to connect to departments service', code: 'SERVICE_UNAVAILABLE' },
      { status: 503 }
    );
  }
}
