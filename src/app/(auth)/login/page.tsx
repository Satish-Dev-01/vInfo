'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { useAppStore } from '@/stores/app.store';
import { getStoredAuthToken, setStoredAuthToken } from '@/lib/auth-helpers';

const MAX_ATTEMPTS = 5;
const STORAGE_LOCK_KEY = 'vaayath_auth_lock';

interface SavedLockState {
  email: string;
  lockedUntil: number;
  attempts: number;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [nextOnboardingStep, setNextOnboardingStep] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const addNotification = useAppStore((state) => state.addNotification);

  // Restore existing lockout from localStorage or check status
  useEffect(() => {
    try {
      const token = getStoredAuthToken();
      const nextStep = localStorage.getItem('nextStep');

      if (token && nextStep === 'ORG_BILLING_DETAILS') {
        router.push('/onboarding');
        return;
      }
      if (token && nextStep === 'DEPARTMENTS_AND_LEVELS') {
        router.push('/onboarding/departments');
        return;
      }
      if (token && nextStep === 'USER_DETAILS') {
        router.push('/onboarding/user-details');
        return;
      }
      if (token && nextStep === 'INVITE_TEAM') {
        localStorage.setItem('onboarding_step_1_completed', 'true');
        localStorage.setItem('onboarding_step_2_completed', 'true');
        router.push('/onboarding/invite');
        return;
      }
      if (token && (!nextStep || nextStep === 'COMPLETED' || nextStep === 'DASHBOARD')) {
        router.push('/dashboard');
        return;
      }

      const saved = localStorage.getItem(STORAGE_LOCK_KEY);
      if (saved) {
        const parsed: SavedLockState = JSON.parse(saved);
        const now = Date.now();
        if (parsed.lockedUntil > now) {
          queueMicrotask(() => {
            setEmail(parsed.email);
            setFailedAttempts(MAX_ATTEMPTS);
            setIsLocked(true);
            setLockedUntil(parsed.lockedUntil);
            setRemainingSeconds(Math.ceil((parsed.lockedUntil - now) / 1000));
          });
        } else {
          localStorage.removeItem(STORAGE_LOCK_KEY);
        }
      }

      // Check if email or nextStep is passed in URL
      const emailQuery = searchParams.get('email');
      if (emailQuery) {
        queueMicrotask(() => {
          setEmail(emailQuery);
        });
      }

      const nextStepParam = searchParams.get('nextStep') || searchParams.get('step');
      if (nextStepParam === 'VERIFY_EMAIL' || nextStepParam === 'verify') {
        const targetEmail =
          emailQuery ||
          (typeof window !== 'undefined' ? localStorage.getItem('verify_email_address') : null);
        router.replace(
          targetEmail
            ? `/login/verification?email=${encodeURIComponent(targetEmail)}`
            : '/login/verification'
        );
        return;
      }
    } catch {
      // Ignore localStorage parse errors
    }
  }, [router, searchParams]);

  // Countdown timer when account is locked
  useEffect(() => {
    if (!isLocked || !lockedUntil) return;

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((lockedUntil - now) / 1000));
      setRemainingSeconds(diff);

      if (diff <= 0) {
        setIsLocked(false);
        setFailedAttempts(0);
        setLockedUntil(null);
        localStorage.removeItem(STORAGE_LOCK_KEY);
        addNotification({
          type: 'info',
          title: 'Lockout Expired',
          message: 'Your 30-minute lockout has ended. You may now attempt to log in again.',
        });
      }
    };

    tick();
    const timerId = setInterval(tick, 1000);
    return () => clearInterval(timerId);
  }, [isLocked, lockedUntil, addNotification]);

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleBackToLogin = () => {
    setIsLocked(false);
    setPassword('');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.status === 423 || data.isLocked) {
        // 5 failed attempts reached -> lock account for 30 minutes
        const lockExpiration = data.lockedUntil || Date.now() + 30 * 60 * 1000;
        setFailedAttempts(MAX_ATTEMPTS);
        setIsLocked(true);
        setLockedUntil(lockExpiration);
        setRemainingSeconds(data.remainingSeconds || 30 * 60);

        try {
          localStorage.setItem(
            STORAGE_LOCK_KEY,
            JSON.stringify({
              email,
              lockedUntil: lockExpiration,
              attempts: MAX_ATTEMPTS,
            })
          );
        } catch {
          // ignore storage quota errors
        }

        addNotification({
          type: 'error',
          title: 'Account Temporarily Locked',
          message: 'Your account has been locked for 30 minutes due to 5 unsuccessful login attempts.',
        });
      } else if (!response.ok || !data.success) {
        const apiErrorMessage =
          data?.message ||
          data?.error?.message ||
          (typeof data?.error === 'string' ? data.error : null) ||
          'Unable to sign in. Please check your credentials and try again.';

        setErrorMessage(apiErrorMessage);

        if (response.status === 503 || data.error?.code === 'SERVICE_UNAVAILABLE') {
          addNotification({
            type: 'error',
            title: 'Unable to Connect',
            message: apiErrorMessage,
          });
          return;
        }

        // If user does not exist (404)
        if (response.status === 404) {
          addNotification({
            type: 'error',
            title: 'Login Failed',
            message: apiErrorMessage,
          });
          return;
        }

        // Failed attempt (1 to 4)
        const attempts = data.attempts || failedAttempts + 1;
        setFailedAttempts(attempts);

        addNotification({
          type: 'error',
          title: 'Incorrect Credentials',
          message: apiErrorMessage,
        });
      } else {
        // Successful login
        setIsSuccess(true);
        setFailedAttempts(0);
        setErrorMessage(null);
        localStorage.removeItem(STORAGE_LOCK_KEY);

        const token = data.token || data.data?.token;
        const user = data.user || data.data?.user;
        const nextStep = data.nextStep || data.data?.nextStep;
        setNextOnboardingStep(nextStep || null);

        if (token) {
          setStoredAuthToken(token);
        }
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        if (nextStep) {
          localStorage.setItem('nextStep', nextStep);
          if (typeof document !== 'undefined') {
            document.cookie = `next_step=${encodeURIComponent(nextStep)}; path=/; max-age=604800; SameSite=Lax`;
          }
        } else {
          localStorage.removeItem('nextStep');
          if (typeof document !== 'undefined') {
            document.cookie = 'next_step=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          }
        }

        // Check if there was an intended redirect destination
        const redirectParam = typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('redirect')
          : null;

        // When nextStep is VERIFY_EMAIL, route to login verification screen
        if (nextStep === 'VERIFY_EMAIL') {
          const userEmail = (user as { email?: string })?.email || email;
          const userName =
            (user as { fullName?: string })?.fullName ||
            (user as { name?: string })?.name ||
            '';

          if (userEmail) {
            localStorage.setItem('verify_email_address', userEmail);
          }
          if (userName) {
            localStorage.setItem('verify_email_name', userName);
          }
          router.push(`/login/verification?email=${encodeURIComponent(userEmail)}`);
          return;
        }

        // When nextStep is ORG_BILLING_DETAILS, send directly to organisation setup
        if (nextStep === 'ORG_BILLING_DETAILS') {
          router.push('/onboarding');
          return;
        }

        // When nextStep is DEPARTMENTS_AND_LEVELS, send directly to departments setup
        if (nextStep === 'DEPARTMENTS_AND_LEVELS') {
          router.push('/onboarding/departments');
          return;
        }

        // When nextStep is USER_DETAILS, send directly to complete profile
        if (nextStep === 'USER_DETAILS') {
          router.push('/onboarding/user-details');
          return;
        }

        // When nextStep is INVITE_TEAM, send directly to invite team setup (step 3)
        if (nextStep === 'INVITE_TEAM') {
          if (typeof window !== 'undefined') {
            localStorage.setItem('onboarding_step_1_completed', 'true');
            localStorage.setItem('onboarding_step_2_completed', 'true');
          }
          router.push('/onboarding/invite');
          return;
        }

        // When nextStep is DASHBOARD, COMPLETED, or not present, send directly to dashboard
        if (!nextStep || nextStep === 'COMPLETED' || nextStep === 'DASHBOARD') {
          if (redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('/login')) {
            router.push(redirectParam);
          } else {
            router.push('/dashboard');
          }
          return;
        }

        addNotification({
          type: 'success',
          title: 'Welcome Back',
          message: user?.fullName ? `Welcome back, ${user.fullName}!` : 'Successfully logged in to your workspace.',
        });
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Connection Issue',
        message: 'Unable to connect. Please check your internet connection and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const remainingAttempts = Math.max(0, MAX_ATTEMPTS - failedAttempts);

  return (
    <div className="w-full">
      {/* 1. LOCKED ACCOUNT VIEW (Displays after 5 unsuccessful login attempts) */}
      {isLocked ? (
        <div className="w-full space-y-6 animate-in fade-in zoom-in-98 duration-200">
          {/* Circular Red Lock Icon */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FEECEC] text-[#DC2626]">
            <Lock className="h-5 w-5 stroke-[2.2]" />
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-[34px] font-serif font-normal tracking-tight text-zinc-900 leading-tight">
              Account temporarily locked
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              We locked <strong className="font-semibold text-zinc-900">{email || 'your account'}</strong> after 5 unsuccessful login attempts, to keep your company&apos;s data safe.
            </p>
          </div>

          {/* Countdown Timer Box */}
          <div className="rounded-xl border border-zinc-200/80 bg-[#F6F5F2] px-6 py-4 flex items-center justify-between shadow-xs">
            <span className="text-sm font-normal text-zinc-600">
              You can try again in
            </span>
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-zinc-900 tabular-nums">
              {formatCountdown(remainingSeconds)}
            </span>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => router.push(`/forgot-password?email=${encodeURIComponent(email)}`)}
              className="w-full flex items-center justify-center rounded-xl bg-[#1D5943] hover:bg-[#164836] active:scale-[0.99] text-white py-3.5 px-4 font-semibold text-sm transition-all duration-200 shadow-md shadow-[#1D5943]/20 cursor-pointer"
            >
              Reset password
            </button>

            <button
              type="button"
              onClick={handleBackToLogin}
              className="w-full flex items-center justify-center rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 active:scale-[0.99] text-zinc-900 py-3.5 px-4 font-semibold text-sm transition-all duration-200 shadow-xs cursor-pointer"
            >
              Back to log in
            </button>
          </div>

          {/* Footer Support Link */}
          <p className="text-xs text-center text-zinc-500 pt-3">
            Didn&apos;t try to log in?{' '}
            <Link
              href="/help"
              className="font-semibold text-zinc-700 underline hover:text-zinc-950 transition-colors"
            >
              Contact support
            </Link>{' '}
            — we&apos;ll help you secure your account.
          </p>
        </div>
      ) : isSuccess ? (
        /* 2. SUCCESSFUL LOGIN VIEW */
        <div key="login-success" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1D5943] text-white shadow-lg shadow-[#1D5943]/30">
            <CheckCircle2 className="h-8 w-8 text-[#52E098]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-serif text-zinc-900">Logged in Successfully!</h3>
            <p className="text-sm text-zinc-600">
              Welcome back to your workspace.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (nextOnboardingStep === 'USER_DETAILS') {
                  router.push('/onboarding/user-details');
                } else if (nextOnboardingStep === 'ORG_BILLING_DETAILS') {
                  router.push('/onboarding');
                } else if (nextOnboardingStep === 'DEPARTMENTS_AND_LEVELS') {
                  router.push('/onboarding/departments');
                } else if (nextOnboardingStep === 'INVITE_TEAM') {
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('onboarding_step_1_completed', 'true');
                    localStorage.setItem('onboarding_step_2_completed', 'true');
                  }
                  router.push('/onboarding/invite');
                } else {
                  router.push('/dashboard');
                }
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#1D5943] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#164836] transition-all shadow-md shadow-[#1D5943]/20 cursor-pointer"
            >
              <span>
                {nextOnboardingStep === 'USER_DETAILS'
                  ? 'Complete your profile'
                  : nextOnboardingStep === 'ORG_BILLING_DETAILS'
                    ? 'Continue to Organisation Setup'
                    : nextOnboardingStep === 'DEPARTMENTS_AND_LEVELS'
                      ? 'Continue to Departments Setup'
                      : nextOnboardingStep === 'INVITE_TEAM'
                        ? 'Continue to Invite Team'
                        : 'Continue to Workspace'}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSuccess(false);
                setPassword('');
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              Return to login
            </button>
          </div>
        </div>
      ) : (
        /* 3. DEFAULT LOGIN FORM */
        <div className="space-y-7">
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-[34px] font-serif font-normal tracking-tight text-zinc-900">
              Welcome back
            </h2>
            <p className="text-sm text-zinc-600">
              Log in to continue to your Vaayath workspace.
            </p>
          </div>

          {/* API Error Banner (e.g. "User does not exist") */}
          {errorMessage && failedAttempts === 0 && (
            <div className="rounded-xl border border-[#FCA5A5]/60 bg-[#FEF2F2] p-4 sm:p-4.5 animate-in fade-in zoom-in-98 duration-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-[#DC2626] shrink-0 mt-0.5 stroke-[2.2]" />
                <div className="space-y-1 flex-1">
                  <p className="text-xs leading-relaxed text-[#991B1B] font-semibold">
                    {errorMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Attempt Warning Banner (Shown on attempts 1-4) */}
          {failedAttempts > 0 && failedAttempts < MAX_ATTEMPTS && (
            <div className="rounded-xl border border-[#FCA5A5]/60 bg-[#FEF2F2] p-4 sm:p-4.5 animate-in fade-in zoom-in-98 duration-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-[#DC2626] shrink-0 mt-0.5 stroke-[2.2]" />
                <div className="space-y-2.5 flex-1">
                  <p className="text-xs leading-relaxed text-[#991B1B]">
                    <strong className="font-bold text-[#991B1B]">{errorMessage || 'Incorrect email or password.'}</strong>{' '}
                    You have {remainingAttempts} {remainingAttempts === 1 ? 'attempt' : 'attempts'} left before your account is temporarily locked.
                  </p>

                  {/* 5-segment pill progress indicator indented under text */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: MAX_ATTEMPTS }).map((_, index) => (
                        <div
                          key={index}
                          className={`h-1 w-6 sm:w-7 rounded-full transition-colors duration-300 ${index < failedAttempts ? 'bg-[#991B1B]' : 'bg-[#FCA5A5]/40'
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-normal text-[#991B1B] pl-1 select-none">
                      {failedAttempts} of {MAX_ATTEMPTS} attempts used
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form key="login-form" onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-200">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="you@company.com"
                className="w-full rounded-lg border border-zinc-200/90 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#1D5943] focus:outline-none focus:ring-2 focus:ring-[#1D5943]/20 transition-all shadow-xs"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-700">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#1D5943] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter your password"
                  className={`w-full rounded-lg bg-white px-3.5 py-2.5 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all shadow-xs ${failedAttempts > 0
                    ? 'border border-rose-300 focus:border-rose-400 focus:ring-rose-400/20'
                    : 'border border-zinc-200/90 focus:border-[#1D5943] focus:ring-[#1D5943]/20'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Error note below password field */}
              {failedAttempts > 0 && (
                <p className="text-xs text-[#DC2626] pt-0.5">
                  Check your password and try again, or reset it.
                </p>
              )}
            </div>

            {/* Keep me logged in */}
            <div className="flex items-center gap-2.5 pt-0.5">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-[#1D5943] accent-[#1D5943] focus:ring-[#1D5943]/20 cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs text-zinc-600 cursor-pointer select-none">
                Keep me logged in on this device
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center rounded-lg bg-[#1D5943] hover:bg-[#164836] active:scale-[0.99] text-white py-3 px-4 font-semibold text-sm transition-all duration-200 shadow-md shadow-[#1D5943]/20 disabled:opacity-70 disabled:pointer-events-none cursor-pointer"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Logging in...
                </span>
              ) : (
                'Log in'
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full text-center py-12 space-y-3">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E5F0EC] text-[#1D5943]">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
          <p className="text-sm text-zinc-500 font-medium">Loading login...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
