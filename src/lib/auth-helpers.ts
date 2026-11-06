import { useAppStore } from '@/stores/app.store';

interface RouterLike {
  push: (url: string) => void;
  replace: (url: string) => void;
}

interface HandleUnauthorizedOptions {
  router?: RouterLike;
  message?: string;
  redirectUrl?: string;
}

let isRedirectingToLogin = false;

/**
 * Retrieves valid authentication token from browser storage (localStorage or cookies)
 * Checks 'accessToken', 'auth_token', 'token', and 'access_token'.
 */
export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Check localStorage for all common token keys
  const localToken =
    localStorage.getItem('accessToken') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token');

  if (
    localToken &&
    localToken !== 'null' &&
    localToken !== 'undefined' &&
    localToken.trim() !== ''
  ) {
    return localToken.trim();
  }

  // 2. Check document.cookie fallback
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(
      /(?:^|;\s*)(?:accessToken|auth_token|access_token|token)=([^;]+)/
    );
    if (match && match[1] && match[1] !== 'null' && match[1] !== 'undefined') {
      const decoded = decodeURIComponent(match[1]).trim();
      if (decoded) {
        // Sync back into localStorage
        try {
          localStorage.setItem('accessToken', decoded);
          localStorage.setItem('auth_token', decoded);
        } catch {
          // ignore
        }
        return decoded;
      }
    }
  }

  return null;
}

/**
 * Persists token to both localStorage and document.cookie
 */
export function setStoredAuthToken(token: string): void {
  if (typeof window === 'undefined' || !token) return;
  const cleanToken = token.trim();
  try {
    localStorage.setItem('accessToken', cleanToken);
    localStorage.setItem('auth_token', cleanToken);
  } catch {
    // ignore
  }

  if (typeof document !== 'undefined') {
    const expires = 'max-age=604800; path=/; SameSite=Lax';
    document.cookie = `accessToken=${encodeURIComponent(cleanToken)}; ${expires}`;
    document.cookie = `auth_token=${encodeURIComponent(cleanToken)}; ${expires}`;
  }
}

/**
 * Clears all auth-related credentials, tokens, and cookies
 */
export function clearStoredAuth(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('nextStep');
      localStorage.removeItem('onboarding_step_1_completed');
      localStorage.removeItem('onboarding_step_2_completed');
      localStorage.removeItem('onboarding_step_3_completed');
    } catch {
      // ignore
    }
  }

  if (typeof document !== 'undefined') {
    const clearCookie = '=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = `accessToken${clearCookie}`;
    document.cookie = `auth_token${clearCookie}`;
    document.cookie = `access_token${clearCookie}`;
    document.cookie = `token${clearCookie}`;
    document.cookie = `next_step${clearCookie}`;
  }
}

/**
 * Handles 401 Unauthorized / expired session / unauthenticated access attempt:
 * Clears stored credentials, cookies, displays a notification, and redirects to /login.
 * Includes debouncing to prevent multiple simultaneous 401s from triggering duplicate toasts.
 */
export function handleUnauthorizedSession(options?: HandleUnauthorizedOptions): void {
  if (typeof window === 'undefined') return;

  // Prevent duplicate redirect cascades from simultaneous API requests
  if (isRedirectingToLogin) return;
  isRedirectingToLogin = true;

  try {
    clearStoredAuth();

    // Inform user of session expiry / login requirement
    useAppStore.getState().addNotification({
      type: 'error',
      title: options?.message ? 'Authentication Required' : 'Session Expired',
      message: options?.message || 'Please log in with a valid access token to access this page.',
    });
  } catch {
    // ignore storage errors
  }

  const destination = options?.redirectUrl || '/login';

  // Navigate back to login page
  if (options?.router) {
    options.router.replace(destination);
  } else {
    window.location.href = destination;
  }

  // Reset flag after redirect settles
  setTimeout(() => {
    isRedirectingToLogin = false;
  }, 2000);
}

