'use client';

import React from 'react';
import { useAppStore } from '@/stores/app.store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Sun, Moon, LayoutGrid, CheckCircle } from 'lucide-react';

export function StoreDemo() {
  const {
    notifications,
    theme,
    isSidebarOpen,
    toggleSidebar,
    setTheme,
    addNotification,
    clearNotifications,
  } = useAppStore();

  const handleAddSampleNotification = () => {
    addNotification({
      type: 'success',
      title: 'Audit Clause Verified',
      message: `Zustand store synced GMP checkpoint at ${new Date().toLocaleTimeString()}`,
    });
  };

  return (
    <Card className="border-[#1D5943]/20 bg-gradient-to-br from-[#1D5943]/[0.03] to-[#52E098]/[0.04] dark:border-[#285743]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-[#1D5943] dark:text-[#52E098]" />
            <CardTitle>Live Zustand State Manager</CardTitle>
          </div>
          <Badge variant="default">Client Store Active</Badge>
        </div>
        <CardDescription>
          Interact with global client state (persisted, selector-optimized, devtools enabled).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Theme State Controller */}
          <div className="rounded-xl border border-[#E8E2D7] bg-white/80 p-4 dark:border-[#214736] dark:bg-[#142D21]/80">
            <div className="text-xs font-semibold uppercase text-[#5B6F66] dark:text-[#9BB0A5] tracking-wider mb-2">
              Theme Slice
            </div>
            <div className="text-sm font-medium text-[#14281F] dark:text-[#FAF7F2] capitalize mb-3">
              Current: {theme}
            </div>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
              >
                <Sun className="h-3.5 w-3.5 mr-1" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
              >
                <Moon className="h-3.5 w-3.5 mr-1" />
                Dark
              </Button>
            </div>
          </div>

          {/* Sidebar Layout Controller */}
          <div className="rounded-xl border border-[#E8E2D7] bg-white/80 p-4 dark:border-[#214736] dark:bg-[#142D21]/80">
            <div className="text-xs font-semibold uppercase text-[#5B6F66] dark:text-[#9BB0A5] tracking-wider mb-2">
              Layout Slice
            </div>
            <div className="text-sm font-medium text-[#14281F] dark:text-[#FAF7F2] mb-3">
              Sidebar: {isSidebarOpen ? 'Expanded' : 'Collapsed'}
            </div>
            <Button variant="secondary" size="sm" onClick={toggleSidebar}>
              Toggle Sidebar
            </Button>
          </div>

          {/* Notification Slice Controller */}
          <div className="rounded-xl border border-[#E8E2D7] bg-white/80 p-4 dark:border-[#214736] dark:bg-[#142D21]/80">
            <div className="text-xs font-semibold uppercase text-[#5B6F66] dark:text-[#9BB0A5] tracking-wider mb-2">
              Audit Event Queue
            </div>
            <div className="text-sm font-medium text-[#14281F] dark:text-[#FAF7F2] mb-3">
              Items in Queue: {notifications.length}
            </div>
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={handleAddSampleNotification}>
                <Bell className="h-3.5 w-3.5 mr-1" />
                Trigger Event
              </Button>
              {notifications.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearNotifications}>
                  <BellOff className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Live Notification Event Feed */}
        {notifications.length > 0 && (
          <div className="rounded-xl border border-[#1D5943]/20 bg-[#EAF3EE] dark:bg-[#1A382B]/60 p-4 space-y-2">
            <div className="text-xs font-semibold text-[#1D5943] dark:text-[#52E098] flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" />
              Active Event Stream:
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1.5 pr-2">
              {notifications.slice(-3).map((item) => (
                <div
                  key={item.id}
                  className="text-xs bg-white dark:bg-[#11281E] p-2.5 rounded-lg border border-[#1D5943]/15 flex justify-between items-center"
                >
                  <span className="font-medium text-[#14281F] dark:text-[#FAF7F2]">
                    {item.title}: {item.message}
                  </span>
                  <span className="text-[10px] text-[#788C83] font-mono">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
