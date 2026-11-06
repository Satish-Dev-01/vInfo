'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useAppStore } from '@/stores/app.store';

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const addNotification = useAppStore((state) => state.addNotification);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      queueMicrotask(() => {
        setEmail(emailParam);
      });
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const targetEmail = email;
    setSubmittedEmail(email);

    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setEmail('');
      addNotification({
        type: 'success',
        title: 'Reset link sent',
        message: `Instructions sent to ${targetEmail}`,
      });
    }, 1000);
  };

  return (
    <div className="w-full space-y-7">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl sm:text-[34px] font-serif font-normal tracking-tight text-zinc-900">
          Reset password
        </h2>
        <p className="text-sm text-zinc-600">
          Enter your work email and we&apos;ll send you instructions to reset your password.
        </p>
      </div>

      {isSuccess ? (
        <div key="forgot-success" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1D5943] text-white shadow-lg shadow-[#1D5943]/30">
            <CheckCircle2 className="h-8 w-8 text-[#52E098]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-serif text-zinc-900">Check your email</h3>
            <p className="text-sm text-zinc-600">
              We&apos;ve sent password reset instructions to <strong className="text-zinc-900">{submittedEmail}</strong>.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsSuccess(false);
                setEmail('');
              }}
              className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              Try another email
            </button>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-[#1D5943] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#164836] transition-colors"
            >
              Return to login
            </Link>
          </div>
        </div>
      ) : (
        <form key="forgot-form" onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-200">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-lg border border-zinc-200/90 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#1D5943] focus:outline-none focus:ring-2 focus:ring-[#1D5943]/20 transition-all shadow-xs"
            />
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
                Sending reset link...
              </span>
            ) : (
              'Send reset link'
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="w-full py-12 text-center text-zinc-400 text-sm">Loading...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
