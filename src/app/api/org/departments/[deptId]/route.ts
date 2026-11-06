import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const DEPARTMENTS_URL =
  process.env.ORG_DEPARTMENTS_URL ||
  'http://192.168.18.31:8085/api/org/departments';

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

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ deptId: string }> }
) {
  try {
    const { deptId } = await context.params;
    const authHeader = getAuthHeader(request);

    if (!deptId) {
      return NextResponse.json(
        { success: false, message: 'Department ID is required' },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {
      accept: '*/*',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const targetUrl = `${DEPARTMENTS_URL}/${deptId}`;
    logger.info(`Deleting department at ${targetUrl}`, 'DepartmentsAPI');

    const backendRes = await fetch(targetUrl, {
      method: 'DELETE',
      headers,
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
      logger.warn(`Failed to delete department (${backendRes.status})`, 'DepartmentsAPI', data);
      const errObj = (data && typeof data === 'object') ? (data as Record<string, unknown>) : {};
      return NextResponse.json(
        {
          success: false,
          message: (errObj.message as string) || (errObj.error as string) || 'Failed to delete department',
          error: data,
        },
        { status: backendRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    logger.error('Error in DELETE department', 'DepartmentsAPI', error);
    return NextResponse.json(
      { success: false, message: 'Unable to connect to departments service', code: 'SERVICE_UNAVAILABLE' },
      { status: 503 }
    );
  }
}
