'use client';

import React from 'react';
import { AuthGuard } from '@/components/common/auth-guard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard fallbackMessage="Please log in to access the dashboard.">
      {children}
    </AuthGuard>
  );
}
