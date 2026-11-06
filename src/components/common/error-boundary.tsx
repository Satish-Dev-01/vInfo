'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Uncaught error caught by ErrorBoundary:', 'ErrorBoundary', {
      error: error.message,
      stack: errorInfo.componentStack,
    });
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] w-full items-center justify-center p-6">
          <Card className="max-w-md border-rose-500/20 bg-rose-500/5">
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <CardTitle className="text-rose-950 dark:text-rose-100">Component Render Failed</CardTitle>
              <CardDescription className="text-rose-800/80 dark:text-rose-300/80">
                An unexpected error occurred in this view.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <p className="rounded-lg bg-black/5 p-3 text-xs font-mono text-zinc-700 dark:bg-white/5 dark:text-zinc-300">
                {this.state.error?.message || 'Unknown error'}
              </p>
              <Button variant="outline" size="sm" onClick={this.handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry Component
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
