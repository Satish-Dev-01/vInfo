'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FlaskConical, Check, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAppStore } from '@/stores/app.store';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthHeaderHidden = useAppStore((state) => state.isAuthHeaderHidden);

  // Top-right navigation helper based on current route
  const renderTopNav = () => {
    if (pathname === '/signup') {
      return (
        <span className="text-xs sm:text-sm text-zinc-500">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-[#1D5943] hover:underline"
          >
            Log in
          </Link>
        </span>
      );
    }
    if (pathname.startsWith('/login/verification')) {
      return (
        <span className="text-xs sm:text-sm text-zinc-500">
          Already verified?{' '}
          <Link
            href="/login"
            className="font-semibold text-[#1D5943] hover:underline"
          >
            Log in
          </Link>
        </span>
      );
    }
    if (pathname === '/forgot-password') {
      return (
        <span className="text-xs sm:text-sm text-zinc-500">
          Remember password?{' '}
          <Link
            href="/login"
            className="font-semibold text-[#1D5943] hover:underline"
          >
            Log in
          </Link>
        </span>
      );
    }
    return (
      <span className="text-xs sm:text-sm text-zinc-500">
        New to Vaayath?{' '}
        <Link
          href="/signup"
          className="font-semibold text-[#1D5943] hover:underline"
        >
          Create an account
        </Link>
      </span>
    );
  };

  return (
    <div className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row bg-[#FAF7F2] text-zinc-900 font-sans selection:bg-[#1D5943] selection:text-white relative lg:overflow-hidden">
      {/* FIXED LEFT BRAND PANEL */}
      <div className="lg:w-[46%] xl:w-[44%] 2xl:w-[42%] lg:h-full bg-[#12281E] text-white p-8 sm:p-12 lg:p-14 2xl:p-18 flex flex-col justify-between shrink-0 z-20 relative overflow-hidden border-r border-[#1F3D30] shadow-[4px_0_24px_rgba(0,0,0,0.25)]">
        {/* Subtle Ambient Radial Glows */}
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-[#1F4E3A]/40 blur-3xl" />
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[#183B2C]/50 blur-3xl" />

        {/* Top: Brand Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1D5943] border border-[#2D7357]/40 text-[#4ADE80] shadow-sm group-hover:scale-105 transition-transform">
              <FlaskConical className="h-5 w-5 stroke-[2.2]" />
            </div>
            <span className="text-2xl font-serif tracking-tight text-white">
              Vaayath
            </span>
          </Link>
        </div>

        {/* Middle: Headline & Value Prop */}
        <div className="my-10 lg:my-auto py-4 space-y-6 max-w-lg relative z-10">
          <h1 className="text-3xl sm:text-4xl lg:text-[40px] 2xl:text-[44px] font-serif font-normal text-white leading-[1.18] tracking-tight">
            One account for every Vaayath tool.
          </h1>
          <p className="text-[#A3B8AD] text-sm sm:text-base leading-relaxed">
            Register your company or yourself once. Every module we launch plugs into the same login, team and permissions.
          </p>

          {/* Value Bullet Points */}
          <div className="space-y-3.5 pt-1">
            <div className="flex items-center gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1A382B] text-[#52E098] border border-[#285743]/50">
                <Check className="h-3 w-3 stroke-[3]" />
              </div>
              <span className="text-xs sm:text-sm text-[#D1E2DB]">
                Tools for manufacturing, quality and compliance teams
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1A382B] text-[#52E098] border border-[#285743]/50">
                <Check className="h-3 w-3 stroke-[3]" />
              </div>
              <span className="text-xs sm:text-sm text-[#D1E2DB]">
                Department and level-based rights for your team
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1A382B] text-[#52E098] border border-[#285743]/50">
                <Check className="h-3 w-3 stroke-[3]" />
              </div>
              <span className="text-xs sm:text-sm text-[#D1E2DB]">
                Invite your team and external partners
              </span>
            </div>
          </div>

          {/* Compliance Assurance Pill Card */}
          <div className="p-3.5 rounded-xl bg-[#173428]/70 border border-[#234E3C]/60 text-xs text-[#B2CCC2] flex items-center gap-3 shadow-inner">
            <div className="w-8 h-8 rounded-lg bg-[#1E4333] text-[#52E098] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <p className="text-[12px] leading-snug">
              Engineered for Schedule M, WHO-GMP, and 21 CFR Part 11 compliant audit and quality workflows.
            </p>
          </div>
        </div>

        {/* Bottom: Footer Info */}
        <div className="flex items-center gap-4 text-xs text-[#7E968C] pt-6 relative z-10">
          <span>© 2026 Vaayath</span>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          <Link href="/help" className="hover:text-white transition-colors">Help</Link>
        </div>
      </div>

      {/* RIGHT INTERACTIVE FORM COLUMN */}
      <div
        key={pathname}
        className="flex-1 bg-[#FAF7F2] flex flex-col justify-between p-6 sm:p-10 lg:p-12 2xl:p-16 lg:h-full lg:overflow-y-auto z-10"
      >
        {/* Top-Right Navigation Header - Constrained and aligned to form container */}
        <div className="w-full  mx-auto flex justify-between items-center pb-2">
          {!isAuthHeaderHidden ? (
            <>
              {pathname === '/forgot-password' ? (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#245c58] hover:text-[#164836] transition-colors group cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4 stroke-[2.2] transition-transform group-hover:-translate-x-1" />
                  Back
                </Link>
              ) : pathname === '/signup' ? (
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('signup-back-clicked'));
                  }}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#245c58] hover:text-[#164836] transition-colors group cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4 stroke-[2.2] transition-transform group-hover:-translate-x-1" />
                  Back
                </button>
              ) : (
                <div />
              )}

              {renderTopNav()}
            </>
          ) : (
            <div className="h-4" />
          )}
        </div>

        {/* Center Form Content */}
        <div className="flex-1 flex items-center justify-center py-4 my-auto">
          <div className="w-full max-w-[480px] sm:max-w-[500px]">
            {children}
          </div>
        </div>

        {/* Bottom spacing helper */}
        <div className="h-4" />
      </div>
    </div>
  );
}


