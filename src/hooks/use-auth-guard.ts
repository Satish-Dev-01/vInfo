'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getStoredAuthToken, handleUnauthorizedSession } from '@/lib/auth-helpers';

interface UseAuthGuardOptions {
  redirectTo?: string;
  message?: string;
}

/**
 * Hook to guard client pages. Ensures the user is logged in with a valid token
 * (accessToken or auth_token). If not, redirects to login immediately.
 */
export function useAuthGuard(options?: UseAuthGuardOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getStoredAuthToken();
    if (!token) {
      queueMicrotask(() => {
        setIsAuthenticated(false);
      });
      const redirectTarget =
        options?.redirectTo ||
        (pathname && pathname !== '/' ? `/login?redirect=${encodeURIComponent(pathname)}` : '/login');
      handleUnauthorizedSession({
        router,
        redirectUrl: redirectTarget,
        message: options?.message || 'Please log in with a valid access token to access this page.',
      });
    } else {
      queueMicrotask(() => {
        setIsAuthenticated(true);
      });
      // Ensure cookies match localStorage for SSR/proxy consistency
      if (typeof document !== 'undefined') {
        const hasTokenCookie =
          document.cookie.includes('accessToken=') ||
          document.cookie.includes('auth_token=');
        if (!hasTokenCookie) {
          const expires = 'max-age=604800; path=/; SameSite=Lax';
          document.cookie = `accessToken=${encodeURIComponent(token)}; ${expires}`;
          document.cookie = `auth_token=${encodeURIComponent(token)}; ${expires}`;
        }
      }
    }
  }, [router, pathname, options?.redirectTo, options?.message]);

  return { isAuthenticated, isLoading: isAuthenticated === null };
}
