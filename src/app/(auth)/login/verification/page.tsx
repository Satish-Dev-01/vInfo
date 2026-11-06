'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/stores/app.store';

function LoginVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addNotification = useAppStore((state) => state.addNotification);

  const [email, setEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [isResending, setIsResending] = useState<boolean>(false);
  const [resendCountdown, setResendCountdown] = useState<number>(0);

  // Token verification states (if user clicked verification link from email)
  const token = searchParams.get('token');
  const [isVerifyingToken, setIsVerifyingToken] = useState<boolean>(!!token);
  const [tokenVerified, setTokenVerified] = useState<boolean>(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    const emailFromParam = searchParams.get('email');
    const nameFromParam = searchParams.get('name');

    const storedEmail =
      typeof window !== 'undefined'
        ? localStorage.getItem('verify_email_address') || localStorage.getItem('user_email')
        : null;

    const storedName =
      typeof window !== 'undefined'
        ? localStorage.getItem('verify_email_name') || localStorage.getItem('user_name')
        : null;

    const resolvedEmail = (emailFromParam || storedEmail || '').trim();
    const resolvedName = (nameFromParam || storedName || '').trim();

    queueMicrotask(() => {
      setEmail(resolvedEmail);
      setUserName(resolvedName);
    });

    if (resolvedEmail && typeof window !== 'undefined') {
      localStorage.setItem('verify_email_address', resolvedEmail);
    }
  }, [searchParams]);

  // Handle token verification if token query param exists
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    const verifyToken = async () => {
      setIsVerifyingToken(true);
      setTokenError(null);

      try {
        const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await response.json().catch(() => null);

        if (!isMounted) return;

        if (response.ok && data?.success !== false) {
          setTokenVerified(true);
          addNotification({
            type: 'success',
            title: 'Email Verified',
            message: data?.message || 'Your email has been verified! You can now log in.',
          });
        } else {
          setTokenError(data?.message || 'Invalid or expired verification link.');
        }
      } catch {
        if (!isMounted) return;
        setTokenError('Unable to connect to verification service. Please try again.');
      } finally {
        if (isMounted) {
          setIsVerifyingToken(false);
        }
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [token, addNotification]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const handleResendVerification = async () => {
    if (resendCountdown > 0 || isResending) return;

    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) {
      addNotification({
        type: 'error',
        title: 'Email Required',
        message: 'Could not determine your email address. Please return to login and try again.',
      });
      return;
    }

    setIsResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success !== false) {
        setResendCountdown(60);
        addNotification({
          type: 'success',
          title: 'Verification Email Sent',
          message: data?.message || `A fresh verification link has been sent to ${targetEmail}.`,
        });
      } else {
        const errorMsg =
          data?.message ||
          data?.error ||
          (typeof data === 'string' ? data : null) ||
          'Failed to resend verification email. Please try again later.';

        addNotification({
          type: 'error',
          title: 'Unable to Resend',
          message: errorMsg,
        });
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Connection Error',
        message: 'Unable to reach the verification service. Please check your internet connection.',
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleReturnToLogin = () => {
    if (email) {
      router.push(`/login?email=${encodeURIComponent(email)}`);
    } else {
      router.push('/login');
    }
  };

  const handleChangeAccount = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('verify_email_address');
      localStorage.removeItem('verify_email_name');
    }
    router.push('/login');
  };

  // 1. TOKEN VERIFICATION IN PROGRESS
  if (isVerifyingToken) {
    return (
      <div className="w-full text-center space-y-6 py-8 animate-in fade-in duration-200">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E5F0EC] text-[#1D5943]">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-serif text-zinc-900">
            Verifying your email...
          </h2>
          <p className="text-sm text-zinc-600">
            Please wait while we validate your activation link.
          </p>
        </div>
      </div>
    );
  }

  // 2. TOKEN VERIFICATION SUCCESS
  if (tokenVerified) {
    return (
      <div className="w-full text-left space-y-6 animate-in fade-in duration-200">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-[#1D5943] border border-emerald-500/20 shadow-xs">
          <CheckCircle2 className="h-7 w-7 text-[#1D5943]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-[38px] font-serif font-normal text-zinc-900 leading-tight">
            Email verified successfully!
          </h2>
          <p className="text-sm text-zinc-600">
            Your account is now active. You can log in with your email and password to access your workspace.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReturnToLogin}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1D5943] hover:bg-[#164836] active:scale-[0.99] text-white py-3.5 px-4 font-semibold text-sm transition-all shadow-md shadow-[#1D5943]/20 cursor-pointer"
        >
          <span>Continue to log in</span>
        </button>
      </div>
    );
  }

  // 3. TOKEN VERIFICATION FAILED
  if (tokenError) {
    return (
      <div className="w-full text-left space-y-6 animate-in fade-in duration-200">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 shadow-xs">
          <AlertCircle className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-[36px] font-serif font-normal text-zinc-900 leading-tight">
            Verification link expired
          </h2>
          <p className="text-sm text-zinc-600 leading-relaxed">
            {tokenError} Verification links expire after 24 hours. Request a fresh link below.
          </p>
        </div>
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resendCountdown > 0 || isResending}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1D5943] hover:bg-[#164836] active:scale-[0.99] text-white py-3.5 px-4 font-semibold text-sm transition-all shadow-md shadow-[#1D5943]/20 cursor-pointer"
          >
            {isResending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Sending new link...</span>
              </>
            ) : resendCountdown > 0 ? (
              <span>Resend link in 0:{resendCountdown.toString().padStart(2, '0')}</span>
            ) : (
              <span>Send fresh verification link</span>
            )}
          </button>
          <button
            type="button"
            onClick={handleReturnToLogin}
            className="w-full flex items-center justify-center rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 py-3.5 px-4 font-medium text-sm transition-colors cursor-pointer"
          >
            Return to log in
          </button>
        </div>
      </div>
    );
  }

  // 4. DEFAULT LOGIN VERIFICATION VIEW (Prompt to check inbox)
  return (
    <div className="w-full text-left space-y-6 animate-in fade-in duration-200">
      {/* Email Badge Icon */}
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E5F0EC] text-[#1D5943] shadow-xs">
        <Mail className="h-6 w-6 stroke-[1.75]" />
      </div>

      {/* Heading & Subtitle */}
      <div className="space-y-3">
        <h2 className="text-3xl sm:text-[38px] font-serif font-normal tracking-tight text-zinc-900 leading-tight">
          Verify your email to log in
        </h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          {userName ? `Hi ${userName}, ` : ''}Your account requires email verification before you can log in.
          We sent a verification link to{' '}
          <strong className="font-semibold text-zinc-900">
            {email || 'your registered email address'}
          </strong>
          .
        </p>
      </div>

      {/* Instructions Card */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-xs text-left space-y-2.5 text-sm text-zinc-600">
        <p className="flex items-center gap-2.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">1</span>
          <span>Open your email client and check your inbox</span>
        </p>
        <p className="flex items-center gap-2.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">2</span>
          <span>Click the <strong className="font-semibold text-zinc-900">Verify email address</strong> button</span>
        </p>
        <p className="flex items-center gap-2.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">3</span>
          <span>Return here and log in to access your workspace</span>
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-1">
        <button
          type="button"
          onClick={handleReturnToLogin}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1D5943] hover:bg-[#164836] active:scale-[0.99] text-white py-3.5 px-4 font-semibold text-sm transition-all duration-200 shadow-md shadow-[#1D5943]/20 cursor-pointer"
        >
          <span>Back to log in</span>
        </button>

        <button
          type="button"
          onClick={handleResendVerification}
          disabled={resendCountdown > 0 || isResending}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 font-medium text-xs transition-all duration-200 ${
            resendCountdown > 0 || isResending
              ? 'bg-[#EAE8E3]/60 text-zinc-500 cursor-not-allowed border border-zinc-200/40'
              : 'bg-[#EAE8E3] hover:bg-[#E0DDD7] text-zinc-700 cursor-pointer border border-zinc-300/60'
          }`}
        >
          {isResending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Sending verification link...</span>
            </>
          ) : resendCountdown > 0 ? (
            <span>Resend verification email in 0:{resendCountdown.toString().padStart(2, '0')}</span>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Resend verification email</span>
            </>
          )}
        </button>
      </div>

      {/* Footer Assistance */}
      <div className="pt-2 border-t border-zinc-200/70 text-xs text-zinc-500 space-y-1">
        <p>
          Can&apos;t find the email? Check your spam or promotions folder.
        </p>
        <p>
          Need to use another account?{' '}
          <button
            type="button"
            onClick={handleChangeAccount}
            className="font-semibold text-zinc-900 hover:underline cursor-pointer"
          >
            Log in with a different email
          </button>
        </p>
      </div>
    </div>
  );
}

export default function LoginVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full text-center py-12 space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E5F0EC] text-[#1D5943]">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <p className="text-sm text-zinc-500 font-medium">Loading verification...</p>
        </div>
      }
    >
      <LoginVerificationContent />
    </Suspense>
  );
}
