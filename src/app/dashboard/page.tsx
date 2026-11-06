'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  Check,
  ArrowRight,
  ClipboardCheck,
  RefreshCw,
  Shield,
  LogOut,
  Settings,
  HelpCircle,
  Building2,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react';
import { useAppStore } from '@/stores/app.store';
import { getStoredAuthToken, handleUnauthorizedSession, clearStoredAuth } from '@/lib/auth-helpers';

export default function DashboardPage() {
  const router = useRouter();
  const addNotification = useAppStore((state) => state.addNotification);

  const [userName, setUserName] = useState('Rohan');
  const [orgName, setOrgName] = useState('Sunrise Pharma Pvt. Ltd.');
  const [userInitials, setUserInitials] = useState('RM');
  const [orgInitials, setOrgInitials] = useState('SP');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isOrgMenuOpen, setIsOrgMenuOpen] = useState(false);
  const [notifiedCapa, setNotifiedCapa] = useState(false);
  const [notifiedReg, setNotifiedReg] = useState(false);
  const [step1Completed, setStep1Completed] = useState(false);
  const [step2Completed, setStep2Completed] = useState(false);
  const [step3Completed, setStep3Completed] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (typeof window !== 'undefined') {
          const token = getStoredAuthToken();
          if (!token) {
            handleUnauthorizedSession({
              router,
              redirectUrl: '/login?redirect=/dashboard',
              message: 'You must be logged in with a valid access token to access the dashboard.',
            });
            return;
          }

          setStep1Completed(localStorage.getItem('onboarding_step_1_completed') === 'true');
          setStep2Completed(localStorage.getItem('onboarding_step_2_completed') === 'true');
          setStep3Completed(localStorage.getItem('onboarding_step_3_completed') === 'true');
        }

        const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        if (userStr) {
          const u = JSON.parse(userStr);
          if (u.fullName || u.name) {
            const rawName = (u.fullName || u.name).trim();
            const firstName = rawName.split(/\s+/)[0];
            setUserName(firstName || 'Rohan');

            const parts = rawName.split(/\s+/);
            const inits =
              parts.length >= 2
                ? `${parts[0][0]}${parts[1][0]}`
                : parts[0].slice(0, 2);
            setUserInitials(inits.toUpperCase());
          }

          const rawOrg = u.organizationName || u.companyName || u.orgName;
          if (rawOrg) {
            setOrgName(rawOrg);
            const orgParts = rawOrg.trim().split(/\s+/);
            const oInits =
              orgParts.length >= 2
                ? `${orgParts[0][0]}${orgParts[1][0]}`
                : orgParts[0].slice(0, 2);
            setOrgInitials(oInits.toUpperCase());
          }
        }
      } catch {
        // ignore
      }
    };

    loadUserData();
  }, [router]);

  const handleLogout = () => {
    clearStoredAuth();
    addNotification({
      type: 'info',
      title: 'Signed Out',
      message: 'You have been logged out of your session.',
    });
    router.push('/login');
  };

  const handleNotifyMe = (feature: 'CAPA' | 'Regulatory') => {
    if (feature === 'CAPA') {
      setNotifiedCapa(true);
      addNotification({
        type: 'success',
        title: 'Notification Enabled',
        message: 'We will notify you as soon as CAPA Management is available.',
      });
    } else {
      setNotifiedReg(true);
      addNotification({
        type: 'success',
        title: 'Notification Enabled',
        message: 'We will notify you as soon as Regulatory Compliance launches.',
      });
    }
  };

  const stepsDone = (step1Completed ? 1 : 0) + (step2Completed ? 1 : 0) + (step3Completed ? 1 : 0);

  const continueHref = !step1Completed
    ? '/onboarding'
    : !step2Completed
      ? '/onboarding/departments'
      : '/onboarding/invite';

  const subtitleText =
    stepsDone === 0
      ? '0 of 3 steps done. Start with your organisation and site setup.'
      : stepsDone === 1
        ? "1 of 3 steps done. Your team can't be invited until departments and levels are set."
        : stepsDone === 2
          ? '2 of 3 steps done. Invite your colleagues to activate collaboration.'
          : 'All setup steps complete. Your workspace is fully configured.';

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-[#1E232A] font-sans antialiased flex flex-col selection:bg-[#0D4036] selection:text-white">
      {/* ─────────────────────────────────────────────────────────────
          TOP NAVBAR
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#ECE7DE] px-6 sm:px-12 py-3 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        {/* Brand & Org Switcher */}
        <div className="flex items-center gap-4 sm:gap-5">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            {/* Dark green rounded badge with V */}
            <div className="w-7 h-7 rounded-lg bg-[#0D4036] text-white flex items-center justify-center font-serif font-bold text-sm shadow-xs transition-transform group-hover:scale-105">
              V
            </div>
            <span className="font-serif font-bold text-lg text-[#0D4036] tracking-tight">
              Vaayath
            </span>
          </Link>

          {/* Divider */}
          <div className="h-5 w-px bg-[#E5DFD5]" />

          {/* Organisation Pill Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOrgMenuOpen(!isOrgMenuOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[#E3DDD1] bg-white hover:bg-[#F9F7F2] transition-colors cursor-pointer text-left"
            >
              <div className="w-5 h-5 rounded bg-[#0D4036] text-white text-[10px] font-bold flex items-center justify-center tracking-tight">
                {orgInitials}
              </div>
              <span className="text-xs font-semibold text-[#1E232A] max-w-[140px] sm:max-w-[200px] truncate">
                {orgName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8A8175]" />
            </button>

            {isOrgMenuOpen && (
              <div className="absolute left-0 mt-2 w-60 rounded-xl bg-white border border-[#E3DDD1] shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2 border-b border-[#F2ECE1]">
                  <p className="text-[11px] font-semibold text-[#8A8175] uppercase tracking-wider">
                    Current Organisation
                  </p>
                  <p className="text-xs font-bold text-[#1E232A] mt-0.5 truncate">{orgName}</p>
                </div>
                <Link
                  href="/onboarding"
                  onClick={() => setIsOrgMenuOpen(false)}
                  className="w-full px-3.5 py-2 text-xs text-[#5C5346] hover:bg-[#FAF7F2] hover:text-[#0D4036] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Organisation Settings</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Nav: Learning, Settings, Help, Avatar */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/dashboard/learning"
            className="text-xs font-semibold text-[#165B4C] hover:text-[#0D4036] transition-colors flex items-center gap-1.5 bg-[#EAF5F1] px-2.5 py-1 rounded-lg"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Learning Suite</span>
          </Link>

          <Link
            href="/onboarding"
            className="text-xs font-semibold text-[#165B4C] hover:text-[#0D4036] transition-colors"
          >
            Settings
          </Link>

          <button
            type="button"
            onClick={() =>
              addNotification({
                type: 'info',
                title: 'Vaayath Support',
                message: 'Reach our GMP compliance team at support@vaayath.com',
              })
            }
            className="text-xs font-semibold text-[#165B4C] hover:text-[#0D4036] transition-colors cursor-pointer"
          >
            Help
          </button>

          {/* User Avatar Circle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-8 h-8 rounded-full bg-[#E5B563] text-[#3B2807] flex items-center justify-center text-xs font-bold font-sans shadow-2xs hover:ring-2 hover:ring-[#E5B563]/50 transition-all cursor-pointer"
              aria-label="User Profile"
            >
              {userInitials}
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white border border-[#E3DDD1] shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2 border-b border-[#F2ECE1]">
                  <p className="text-xs font-bold text-[#1E232A]">{userName}</p>
                  <p className="text-[11px] text-[#8A8175] truncate">{orgName}</p>
                </div>
                <Link
                  href="/dashboard/learning"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="w-full px-3.5 py-2 text-xs text-[#5C5346] hover:bg-[#FAF7F2] hover:text-[#0D4036] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Learning Suite</span>
                </Link>
                <Link
                  href="/onboarding"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="w-full px-3.5 py-2 text-xs text-[#5C5346] hover:bg-[#FAF7F2] hover:text-[#0D4036] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    addNotification({
                      type: 'info',
                      title: 'Vaayath Helpdesk',
                      message: 'Documentation & audit SOP manuals are available 24/7.',
                    });
                  }}
                  className="w-full px-3.5 py-2 text-xs text-[#5C5346] hover:bg-[#FAF7F2] hover:text-[#0D4036] flex items-center gap-2 transition-colors cursor-pointer text-left"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Documentation</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer text-left border-t border-[#F2ECE1] mt-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          MAIN CONTENT
      ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 sm:px-10 py-10 sm:py-12 space-y-7">
        {/* Welcome Section */}
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1E232A] tracking-tight">
            Welcome, {userName}
          </h1>
          <p className="text-xs sm:text-[13px] text-[#6B7280] mt-2">
            Choose a tool to get started. Every tool shares your team, departments and levels.
          </p>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            BANNER: FINISH SETTING UP SUNRISE PHARMA
        ───────────────────────────────────────────────────────────── */}
        {stepsDone < 3 && (
          <section className="bg-[#0C382E] text-white rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            {/* Banner Left Info */}
            <div className="space-y-1">
              <h2 className="text-sm sm:text-[15px] font-bold text-white tracking-tight">
                Finish setting up {orgName}
              </h2>
              <p className="text-xs text-[#A2C7BC] leading-relaxed max-w-md">
                {subtitleText}
              </p>
            </div>

            {/* Banner Center & Right Steps + Action */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
              {/* Step Checkpoints */}
              <div className="flex items-center gap-4 sm:gap-6 text-xs">
                {/* Step 1: Org & billing */}
                <div className="flex items-center gap-2">
                  {step1Completed ? (
                    <div className="w-4 h-4 rounded-full bg-[#E5B563] text-[#0C382E] flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#487B70] shrink-0" />
                  )}
                  <span className={`text-[12px] font-medium whitespace-nowrap ${step1Completed ? 'text-white' : 'text-[#C2DCD5]'}`}>
                    Org &amp; billing
                  </span>
                </div>

                {/* Step 2: Departments & levels */}
                <div className="flex items-center gap-2">
                  {step2Completed ? (
                    <div className="w-4 h-4 rounded-full bg-[#E5B563] text-[#0C382E] flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#487B70] shrink-0" />
                  )}
                  <span className={`text-[12px] font-medium whitespace-nowrap ${step2Completed ? 'text-white' : 'text-[#C2DCD5]'}`}>
                    Departments &amp; levels
                  </span>
                </div>

                {/* Step 3: Invite team */}
                <div className="flex items-center gap-2">
                  {step3Completed ? (
                    <div className="w-4 h-4 rounded-full bg-[#E5B563] text-[#0C382E] flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#487B70] shrink-0" />
                  )}
                  <span className={`text-[12px] font-medium whitespace-nowrap ${step3Completed ? 'text-white' : 'text-[#C2DCD5]'}`}>
                    Invite team
                  </span>
                </div>
              </div>

              {/* Continue Setup Button */}
              <Link
                href={continueHref}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#E5B563] hover:bg-[#DCA44E] text-[#3B2807] text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer self-start sm:self-auto"
              >
                Continue setup
              </Link>
            </div>
          </section>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TOOL CARDS GRID (LEARNING + GMP + CAPA + REGULATORY)
        ───────────────────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* CARD 0: Learning Suite (Available - Click to go to next page, whole card clickable) */}
          <Link
            href="/dashboard/learning"
            className="group bg-white rounded-2xl p-6 border border-[#E5E0D6] flex flex-col justify-between shadow-[0_2px_8px_rgba(22,91,76,0.08)] hover:border-[#165B4C] shadow-[0_4px_22px_rgba(22,91,76,0.18)] hover:-translate-y-1 transition-all cursor-pointer block select-none focus:outline-none focus:ring-2 focus:ring-[#165B4C]/40"
          >
            <div>
              {/* Top Row: Icon & Status Pill */}
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#EAF5F1] text-[#165B4C] flex items-center justify-center transition-transform group-hover:scale-110">
                  <GraduationCap className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-semibold text-[#165B4C] bg-[#EAF5F1] px-2.5 py-1 rounded-full">
                  Available
                </span>
              </div>

              {/* Content */}
              <h3 className="text-base sm:text-lg font-bold text-[#1E232A] mt-5 mb-2 group-hover:text-[#0D4036] transition-colors">
                Learning Suite
              </h3>
              <p className="text-xs sm:text-[12.5px] text-[#6B7280] leading-relaxed">
                Create SOP training modules with AI infographics, question banks, reviewer workflows and tracking.
              </p>
            </div>

            {/* CTA Button navigating to next page */}
            <div className="pt-6">
              <div className="w-full py-2.5 px-4 rounded-xl bg-[#F4F2EC] group-hover:bg-[#082C25] text-[#1E232A] group-hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.99]">
                <span>Open Learning</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5] transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* CARD 1: GMP Audit (Available - Whole Card Clickable) */}
          <div
            onClick={() =>
              addNotification({
                type: 'success',
                title: 'GMP Audit Suite',
                message: 'Loading active GMP audit checklists and protocols...',
              })
            }
            className="group bg-white rounded-2xl p-6 border border-[#E5E0D6] hover:border-[#165B4C] flex flex-col justify-between shadow-xs hover:shadow-[0_4px_16px_rgba(22,91,76,0.1)] hover:-translate-y-1 transition-all cursor-pointer"
          >
            <div>
              {/* Top Row: Icon & Status Pill */}
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#F4F2EC] group-hover:bg-[#EAF5F1] text-[#165B4C] flex items-center justify-center transition-colors">
                  <ClipboardCheck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-semibold text-[#165B4C] bg-[#EAF5F1] px-2.5 py-1 rounded-full">
                  Available
                </span>
              </div>

              {/* Content */}
              <h3 className="text-base sm:text-lg font-bold text-[#1E232A] mt-5 mb-2 group-hover:text-[#0D4036] transition-colors">
                GMP Audit
              </h3>
              <p className="text-xs sm:text-[12.5px] text-[#6B7280] leading-relaxed">
                Plan, run and report audits against Schedule M, WHO and PIC/S checklists — with AI-drafted summaries.
              </p>
            </div>

            {/* CTA Button */}
            <div className="pt-6">
              <div className="w-full py-2.5 px-4 rounded-xl bg-[#F4F2EC] group-hover:bg-[#0D4036] text-[#1E232A] group-hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all">
                <span>Open GMP Audit</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5] transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>

          {/* CARD 2: CAPA Management (Coming soon) */}
          <div className="bg-white rounded-2xl p-6 border border-[#E5E0D6] flex flex-col justify-between shadow-xs hover:shadow-sm transition-all">
            <div>
              {/* Top Row: Icon & Status Pill */}
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#F4F2EC] text-[#6B7280] flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 stroke-[2]" />
                </div>
                <span className="text-[11px] font-semibold text-[#8C6024] bg-[#F8EFE0] px-2.5 py-1 rounded-full">
                  Coming soon
                </span>
              </div>

              {/* Content */}
              <h3 className="text-base sm:text-lg font-bold text-[#1E232A] mt-5 mb-2">
                CAPA Management
              </h3>
              <p className="text-xs sm:text-[12.5px] text-[#6B7280] leading-relaxed">
                Log deviations and track corrective and preventive actions to closure.
              </p>
            </div>

            {/* Notify Me Button */}
            <div className="pt-6">
              <button
                type="button"
                onClick={() => handleNotifyMe('CAPA')}
                className={`w-full py-2 px-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${notifiedCapa
                  ? 'border-[#B8D8CE] bg-[#EAF5F1] text-[#165B4C]'
                  : 'border-[#E3DDD1] bg-white hover:bg-[#F9F7F2] text-[#374151]'
                  }`}
              >
                {notifiedCapa ? (
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#165B4C]" />
                    <span>Notification set</span>
                  </span>
                ) : (
                  <span>Notify me</span>
                )}
              </button>
            </div>
          </div>

          {/* CARD 3: Regulatory Compliance (Coming soon) */}
          <div className="bg-white rounded-2xl p-6 border border-[#E5E0D6] flex flex-col justify-between shadow-xs hover:shadow-sm transition-all">
            <div>
              {/* Top Row: Icon & Status Pill */}
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#F4F2EC] text-[#6B7280] flex items-center justify-center">
                  <Shield className="w-5 h-5 stroke-[2]" />
                </div>
                <span className="text-[11px] font-semibold text-[#8C6024] bg-[#F8EFE0] px-2.5 py-1 rounded-full">
                  Coming soon
                </span>
              </div>

              {/* Content */}
              <h3 className="text-base sm:text-lg font-bold text-[#1E232A] mt-5 mb-2">
                Regulatory Compliance
              </h3>
              <p className="text-xs sm:text-[12.5px] text-[#6B7280] leading-relaxed">
                Stay on top of changing regulations and the documentation they require.
              </p>
            </div>

            {/* Notify Me Button */}
            <div className="pt-6">
              <button
                type="button"
                onClick={() => handleNotifyMe('Regulatory')}
                className={`w-full py-2 px-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${notifiedReg
                  ? 'border-[#B8D8CE] bg-[#EAF5F1] text-[#165B4C]'
                  : 'border-[#E3DDD1] bg-white hover:bg-[#F9F7F2] text-[#374151]'
                  }`}
              >
                {notifiedReg ? (
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#165B4C]" />
                    <span>Notification set</span>
                  </span>
                ) : (
                  <span>Notify me</span>
                )}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
