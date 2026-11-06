import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export interface RegisterProxyOptions {
  targetUrl: string;
  body: Record<string, unknown>;
  contextName: string;
}

export async function proxyRegisterRequest({ targetUrl, body, contextName }: RegisterProxyOptions) {
  try {
    logger.info(`Forwarding registration request to ${targetUrl}`, contextName);

    const backendRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    const text = await backendRes.text();
    let data: Record<string, unknown> | null = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text ? { rawResponse: text } : null;
    }

    if (backendRes.ok) {
      logger.info(`Registration successful via ${targetUrl}`, contextName);
      return NextResponse.json(
        {
          success: true,
          data,
          message: (data?.message as string) || 'Registration successful',
        },
        { status: backendRes.status }
      );
    }

    const errorMessage =
      (data?.message as string) ||
      (data?.error as string) ||
      (typeof data === 'string' ? data : 'Registration failed');

    logger.warn(`Registration rejected by backend: ${errorMessage} (${backendRes.status})`, contextName);
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        error: data,
      },
      { status: backendRes.status }
    );
  } catch (error) {
    logger.error(`Could not connect to backend at ${targetUrl}`, contextName, error);
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to connect to the registration service. Please check network connection and verify backend is running.',
        code: 'SERVICE_UNAVAILABLE',
      },
      { status: 503 }
    );
  }
}
