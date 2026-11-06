'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/common/auth-guard';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Client-side forward-only guard: verify current step against completed steps
  useEffect(() => {
    try {
      const storedNextStep = localStorage.getItem('nextStep');

      if (storedNextStep === 'DASHBOARD' || storedNextStep === 'COMPLETED') {
        router.replace('/dashboard');
        return;
      }

      // Step 1 cannot be revisited once user advances
      if (pathname === '/onboarding') {
        if (storedNextStep === 'DEPARTMENTS_AND_LEVELS') {
          router.replace('/onboarding/departments');
          return;
        }
        if (storedNextStep === 'USER_DETAILS') {
          router.replace('/onboarding/user-details');
          return;
        }
        if (storedNextStep === 'INVITE_TEAM') {
          router.replace('/onboarding/invite');
          return;
        }
      }

      const isStep1Completed =
        localStorage.getItem('onboarding_step_1_completed') === 'true' ||
        storedNextStep === 'DEPARTMENTS_AND_LEVELS' ||
        storedNextStep === 'USER_DETAILS' ||
        storedNextStep === 'INVITE_TEAM' ||
        storedNextStep === 'DASHBOARD' ||
        storedNextStep === 'COMPLETED';

      // Cannot access later steps if Step 1 is not completed
      if (
        (pathname === '/onboarding/departments' ||
          pathname === '/onboarding/user-details' ||
          pathname === '/onboarding/invite') &&
        storedNextStep === 'ORG_BILLING_DETAILS' &&
        !isStep1Completed
      ) {
        router.replace('/onboarding');
        return;
      }

      const isStep2Completed =
        localStorage.getItem('onboarding_step_2_completed') === 'true' ||
        storedNextStep === 'USER_DETAILS' ||
        storedNextStep === 'INVITE_TEAM' ||
        storedNextStep === 'DASHBOARD' ||
        storedNextStep === 'COMPLETED';

      if (
        pathname === '/onboarding/invite' &&
        storedNextStep === 'DEPARTMENTS_AND_LEVELS' &&
        !isStep2Completed
      ) {
        router.replace('/onboarding/departments');
        return;
      }
    } catch {
      // ignore localStorage errors
    }
  }, [pathname, router]);

  return (
    <AuthGuard fallbackMessage="Please log in to access the onboarding workflow.">
      {children}
    </AuthGuard>
  );
}

