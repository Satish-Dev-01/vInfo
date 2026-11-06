'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Global Route Error caught:', 'GlobalError', {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <Card className="max-w-lg border-rose-500/30 bg-white dark:bg-zinc-900 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600">
            <AlertOctagon className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Application Exception
          </CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400 mt-2">
            A route-level error occurred during execution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="rounded-xl bg-rose-50 p-4 text-left text-xs font-mono text-rose-900 dark:bg-rose-950/40 dark:text-rose-200 break-all">
            {error.message || 'An unexpected error occurred.'}
          </div>
          <Button variant="primary" onClick={() => reset()} className="w-full">
            <RotateCcw className="mr-2 h-4 w-4" />
            Recover Route
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
