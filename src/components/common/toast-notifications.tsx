'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
} from 'lucide-react';

export function ToastNotifications() {
  const notifications = useAppStore((state) => state.notifications);
  const removeNotification = useAppStore((state) => state.removeNotification);

  // Auto dismiss toasts after 4 seconds
  useEffect(() => {
    if (notifications.length === 0) return;

    const timers = notifications.map((n) => {
      const remainingTime = Math.max(500, 4000 - (Date.now() - n.timestamp));
      return setTimeout(() => {
        removeNotification(n.id);
      }, remainingTime);
    });

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [notifications, removeNotification]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {notifications.map((item) => {
        const isSuccess = item.type === 'success';
        const isError = item.type === 'error';
        const isWarning = item.type === 'warning';

        return (
          <div
            key={item.id}
            className={`pointer-events-auto rounded-xl p-3.5 shadow-lg border backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-3 fade-in ${
              isError
                ? 'bg-rose-50/95 border-rose-200/80 text-rose-950'
                : isWarning
                ? 'bg-amber-50/95 border-amber-200/80 text-amber-950'
                : isSuccess
                ? 'bg-emerald-50/95 border-emerald-200/80 text-emerald-950'
                : 'bg-white/95 border-zinc-200 text-zinc-900'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                {isError ? (
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                ) : isWarning ? (
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                ) : isSuccess ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Info className="h-4 w-4 text-blue-600" />
                )}
              </div>

              <div className="flex-1 space-y-0.5 pr-2">
                <p className="text-xs font-semibold">{item.title}</p>
                {item.message && (
                  <p className="text-xs opacity-85 leading-relaxed">{item.message}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeNotification(item.id)}
                className="shrink-0 text-zinc-400 hover:text-zinc-600 p-0.5 rounded-md hover:bg-black/5 transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
