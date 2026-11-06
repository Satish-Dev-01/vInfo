import { NextResponse } from 'next/server';
import { systemService } from '@/services/system.service';
import { ApiResponse } from '@/types';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const metrics = await systemService.getSystemStatus();

    const response: ApiResponse<typeof metrics> = {
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    logger.error('Health API check failed:', 'HealthRoute', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: (error as Error).message || 'Failed to retrieve system status',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
