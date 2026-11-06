'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Building2,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Globe2,
  ChevronDown,
  User,
  Check,
  Info,
  AlertCircle,
  Lock,
  Mail,
} from 'lucide-react';
import { useAppStore } from '@/stores/app.store';
import { handleUnauthorizedSession } from '@/lib/auth-helpers';
import { COUNTRIES } from '@/lib/constants/countries';
import { validatePassword } from '@/lib/validators/password';

type RegistrationType = 'company' | 'individual';
type CompanyKind = 'manufacturing' | 'service_provider';
type IndividualKind = 'employee' | 'independent_auditor';

function SignupForm() {
  const searchParams = useSearchParams();
  const codeParam = searchParams.get('invite') || searchParams.get('code');
  const emailParam = searchParams.get('email');
  const orgParam = searchParams.get('org');
  const nextStepParam = searchParams.get('nextStep') || searchParams.get('step');
  const nameParam = searchParams.get('name');

  // Multi-step State
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Selection states
  const [registrationType, setRegistrationType] = useState<RegistrationType>('company');
  const [companyKind, setCompanyKind] = useState<CompanyKind>('service_provider');
  const [individualKind, setIndividualKind] = useState<IndividualKind>('employee');

  // Step 2: Form fields
  const [companyName, setCompanyName] = useState('');
  const [inviteCode, setInviteCode] = useState(codeParam || '');
  const [isInviteValid, setIsInviteValid] = useState<boolean | null>(codeParam ? true : null);
  const [isInviteVerified, setIsInviteVerified] = useState<boolean>(Boolean(codeParam));
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState<boolean>(false);
  const [verifiedOrg, setVerifiedOrg] = useState<string | null>(codeParam ? orgParam || 'Cipla Ltd.' : null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(emailParam || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [country, setCountry] = useState('India');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resendCountdown, setResendCountdown] = useState(42);
  const [isResending, setIsResending] = useState(false);

  const addNotification = useAppStore((state) => state.addNotification);
  const setAuthHeaderHidden = useAppStore((state) => state.setAuthHeaderHidden);

  // Check if we should directly show the VERIFY_EMAIL screen
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const storedNextStep = typeof window !== 'undefined' ? localStorage.getItem('nextStep') : null;
        const isVerifyEmail = nextStepParam === 'VERIFY_EMAIL' || storedNextStep === 'VERIFY_EMAIL';

        if (isVerifyEmail) {
          let storedEmail =
            (typeof window !== 'undefined' ? localStorage.getItem('verify_email_address') : null) ||
            emailParam ||
            '';
          let storedName =
            (typeof window !== 'undefined' ? localStorage.getItem('verify_email_name') : null) ||
            nameParam ||
            '';

          if (!storedEmail || !storedName) {
            try {
              const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
              if (userStr) {
                const u = JSON.parse(userStr);
                if (!storedEmail && u.email) storedEmail = u.email;
                if (!storedName && (u.fullName || u.name)) storedName = u.fullName || u.name;
              }
            } catch {
              // ignore
            }
          }

          if (storedEmail) setSubmittedEmail(storedEmail);
          if (storedName) setSubmittedName(storedName);
          setIsSuccess(true);
        }
      } catch {
        // ignore
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [nextStepParam, emailParam, nameParam]);

  // Hide top header bar (Back and Already have account) when on "Check your inbox" screen
  useEffect(() => {
    setAuthHeaderHidden(isSuccess);
    return () => setAuthHeaderHidden(false);
  }, [isSuccess, setAuthHeaderHidden]);

  // Countdown timer for email resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSuccess && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSuccess, resendCountdown]);

  // Listen to Top-Bar Back button clicks
  useEffect(() => {
    const handleBack = () => {
      if (isSuccess) {
        setIsSuccess(false);
      } else if (step === 2) {
        if (registrationType === 'individual' && individualKind === 'employee' && isInviteVerified) {
          setIsInviteVerified(false);
        } else {
          setStep(1);
        }
      } else {
        window.history.back();
      }
    };

    window.addEventListener('signup-back-clicked', handleBack);
    return () => window.removeEventListener('signup-back-clicked', handleBack);
  }, [isSuccess, step, registrationType, individualKind, isInviteVerified]);

  // Handle verify invite code submission
  const handleVerifyInviteCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = inviteCode.trim();

    if (!cleaned) {
      setInviteError("Please enter your invitation code.");
      setIsInviteValid(false);
      return;
    }

    setIsVerifyingCode(true);
    setInviteError(null);

    try {
      const response = await fetch(`/api/auth/invitations/${encodeURIComponent(cleaned)}`, {
        method: 'GET',
        headers: {
          accept: '*/*',
        },
      });

      const result = await response.json().catch(() => null);

      if (response.ok && result?.success !== false) {
        setIsInviteValid(true);

        const rawResult = (result && typeof result === 'object' ? (result as Record<string, unknown>) : {}) as Record<string, unknown>;
        const rawData = (rawResult.data && typeof rawResult.data === 'object' ? (rawResult.data as Record<string, unknown>) : rawResult) as Record<string, unknown>;
        const inviteData = (rawData.data && typeof rawData.data === 'object' ? (rawData.data as Record<string, unknown>) : rawData) as Record<string, unknown>;

        const orgObj = inviteData.organization && typeof inviteData.organization === 'object' ? (inviteData.organization as Record<string, unknown>) : null;
        const compObj = inviteData.company && typeof inviteData.company === 'object' ? (inviteData.company as Record<string, unknown>) : null;

        const orgName =
          (inviteData.organizationName as string) ||
          (inviteData.orgName as string) ||
          (inviteData.companyName as string) ||
          (orgObj?.name as string) ||
          (compObj?.name as string) ||
          orgParam ||
          'Verified Organisation';

        setVerifiedOrg(orgName);

        const invitedEmail =
          (inviteData.email as string) ||
          (inviteData.userEmail as string) ||
          (inviteData.recipientEmail as string);

        if (invitedEmail) {
          setEmail(invitedEmail);
        } else if (!email && emailParam) {
          setEmail(emailParam);
        }

        const invitedFullName =
          (inviteData.fullName as string) ||
          (inviteData.name as string);
        if (invitedFullName && !fullName) {
          setFullName(invitedFullName);
        }

        setIsInviteVerified(true);
        addNotification({
          type: 'success',
          title: 'Invite Code Verified',
          message: `Joined ${orgName}. Please complete your profile to finish registration.`,
        });
      } else {
        setIsInviteValid(false);
        const errMsg =
          result?.message ||
          result?.error ||
          "This code isn't valid or has expired. Check it with your company admin, or ask them to send a new invite.";
        setInviteError(errMsg);
      }
    } catch (err) {
      console.error('Error verifying invite code:', err);
      setIsInviteValid(false);
      setInviteError('Unable to connect to invitation verification service. Please try again.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCountdown > 0 || isResending) return;

    const targetEmail = (submittedEmail || email).trim().toLowerCase();
    if (!targetEmail) {
      addNotification({
        type: 'error',
        title: 'Email Required',
        message: 'Could not find the email address to resend the verification link to.',
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
          message: data?.message || `A new verification link has been sent to ${targetEmail}.`,
        });
      } else {
        if (response.status === 401) {
          handleUnauthorizedSession({ message: 'Please log in to your account.' });
          return;
        }

        const errorMsg =
          data?.message ||
          data?.error ||
          (typeof data === 'string' ? data : null) ||
          'Failed to resend verification email. Please try again.';
        addNotification({
          type: 'error',
          title: 'Resend Failed',
          message: errorMsg,
        });
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Connection Error',
        message: 'Unable to connect to the email verification service. Please try again later.',
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      addNotification({
        type: 'error',
        title: 'Passwords do not match',
        message: 'Please ensure both password fields match before continuing.',
      });
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      addNotification({
        type: 'error',
        title: 'Password Requirements Not Met',
        message: passwordValidation.message,
      });
      return;
    }

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      addNotification({
        type: 'error',
        title: 'Required Fields Missing',
        message: 'Please fill in all required fields.',
      });
      return;
    }

    if (registrationType === 'company' && !companyName.trim()) {
      addNotification({
        type: 'error',
        title: 'Company Name Required',
        message: 'Please enter your company name.',
      });
      return;
    }

    if (registrationType === 'individual' && individualKind === 'employee' && !inviteCode.trim()) {
      addNotification({
        type: 'error',
        title: 'Invite Code Required',
        message: 'Please enter a valid organisation invitation code to continue.',
      });
      return;
    }

    setIsLoading(true);

    let endpoint = '/api/auth/register/company';
    let payload: Record<string, unknown> = {};

    if (registrationType === 'company') {
      // Company registration
      endpoint = '/api/auth/register/company';
      payload = {
        firmType: companyKind === 'manufacturing' ? 'MANUFACTURING' : 'SERVICE_PROVIDER',
        companyName: (companyName || '').trim(),
        country: (country || '').trim(),
        fullName: (fullName || '').trim(),
        email: (email || '').trim().toLowerCase(),
        password,
        confirmPassword,
      };
    } else if (individualKind === 'employee') {
      // Individual & Employee registration
      endpoint = '/api/auth/register/employee';
      payload = {
        inviteCode: (inviteCode || '').trim(),
        email: (email || '').trim().toLowerCase(),
        fullName: (fullName || '').trim(),
        country: (country || '').trim(),
        password,
        confirmPassword,
      };
    } else {
      // Individual & Independent Professional registration
      endpoint = '/api/auth/register/individual';
      payload = {
        inviteCode: (inviteCode || '').trim(),
        email: (email || '').trim().toLowerCase(),
        fullName: (fullName || '').trim(),
        country: (country || '').trim(),
        password,
        confirmPassword,
      };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      const isVerifyEmail =
        data?.nextStep === 'VERIFY_EMAIL' ||
        data?.data?.nextStep === 'VERIFY_EMAIL' ||
        data?.data?.data?.nextStep === 'VERIFY_EMAIL';

      if ((response.ok && data?.success !== false) || isVerifyEmail) {
        const returnedName =
          data?.user?.fullName ||
          data?.data?.user?.fullName ||
          data?.fullName ||
          data?.data?.fullName ||
          fullName;
        const returnedEmail =
          data?.user?.email ||
          data?.data?.user?.email ||
          data?.email ||
          data?.data?.email ||
          email;

        const cleanName = returnedName ? String(returnedName).trim() : '';
        const cleanEmail = returnedEmail ? String(returnedEmail).trim().toLowerCase() : '';

        setSubmittedName(cleanName);
        setSubmittedEmail(cleanEmail);
        setIsSuccess(true);
        setResendCountdown(45);

        if (typeof window !== 'undefined') {
          localStorage.setItem('nextStep', 'VERIFY_EMAIL');
          localStorage.setItem('verify_email_address', cleanEmail);
          if (cleanName) {
            localStorage.setItem('verify_email_name', cleanName);
          }
          if (typeof document !== 'undefined') {
            document.cookie = 'next_step=VERIFY_EMAIL; path=/; max-age=604800';
          }
        }

        addNotification({
          type: 'success',
          title: 'Account Created Successfully',
          message: data?.message || `Verification link sent to ${cleanEmail}.`,
        });
      } else {
        const errorMsg =
          data?.message ||
          data?.error ||
          (typeof data === 'string' ? data : null) ||
          'Registration failed. Please check the information provided and try again.';
        addNotification({
          type: 'error',
          title: 'Registration Failed',
          message: errorMsg,
        });
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Connection Error',
        message: 'Could not connect to the registration service. Please verify your connection and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl space-y-6">
      {/* Step Indicator Header */}
      {!isSuccess && (
        <div className="space-y-1.5">
          {registrationType === 'individual' && individualKind === 'employee' && isInviteVerified ? (
            <>
              <div className="text-[11px] font-bold tracking-widest uppercase text-[#1D5943]">
                YOU&apos;VE BEEN INVITED
              </div>
              <h2 className="text-3xl sm:text-[38px] font-serif font-normal tracking-tight text-zinc-900 leading-tight">
                Join Sunrise Pharma on Vaayath
              </h2>
            </>
          ) : (
            <>
              <div className="text-[11px] font-bold tracking-widest uppercase text-[#1D5943]">
                STEP {step} OF 2
              </div>
              <h2 className="text-3xl sm:text-[38px] font-serif font-normal tracking-tight text-zinc-900 leading-tight">
                {step === 1
                  ? 'Create your account'
                  : registrationType === 'individual' && individualKind === 'employee' && !isInviteVerified
                    ? 'Enter your invite code'
                    : registrationType === 'individual'
                      ? 'Set up your professional account'
                      : 'Set up your company account'}
              </h2>
              <p className="text-sm text-zinc-600">
                {step === 1
                  ? "Tell us who's registering so we set up the right workspace."
                  : registrationType === 'individual' && individualKind === 'employee' && !isInviteVerified
                    ? "Your company admin shares this code when they invite you. It's also in your invite email."
                    : ''}
              </p>
              {step === 2 && (
                <div className="inline-flex items-center gap-2 rounded-full bg-[#e8f2f0] py-1 pl-3 pr-1 text-[13px] font-semibold text-[#245c58]">
                  {registrationType === 'company' ? (
                    <span className="font-semibold">
                      <strong className="font-semibold">Company</strong>
                      {companyKind === 'manufacturing' ? (
                        <span className="font-semibold"> · Manufacturing Firm</span>
                      ) : (
                        <span className="font-semibold"> · Service Firm</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="rounded-full bg-white ml-2 px-2.5 py-1 text-[13px] font-semibold text-[#36736d] cursor-pointer"
                      >
                        Change
                      </button>
                    </span>
                  ) : (
                    <span className="font-semibold">
                      <strong className="font-semibold">Individual</strong>
                      {individualKind === 'employee' ? (
                        <span className="font-semibold"> · Employee</span>
                      ) : (
                        <span className="font-semibold"> · Independent professional</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="rounded-full bg-white ml-2 px-2.5 py-1 text-[13px] font-semibold text-[#36736d] cursor-pointer"
                      >
                        Change
                      </button>
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {isSuccess ? (
        <div key="signup-check-inbox" className="text-left space-y-6 animate-in fade-in duration-200">
          {/* Email Icon Badge */}
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E5F0EC] text-[#1D5943]">
            <Mail className="h-6 w-6 stroke-[1.75]" />
          </div>

          {/* Heading & Subtitle */}
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-[38px] font-serif font-normal tracking-tight text-zinc-900 leading-tight">
              Check your inbox{submittedName ? `, ${submittedName.trim().split(' ')[0]}` : ''}
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              We sent a verification link to{' '}
              <strong className="font-semibold text-zinc-900">
                {submittedEmail || email || 'your email address'}
              </strong>
              . Open it to activate your account — the link is valid for 24 hours.
            </p>
          </div>

          {/* Steps Card */}
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-xs text-left space-y-2 text-sm text-zinc-600">
            <p>1. Open the email from Vaayath</p>
            <p>
              2. Click <strong className="font-semibold text-zinc-900">Verify email address</strong>
            </p>
            <p>3. Log in — we&apos;ll help you finish setting up</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/login"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('nextStep');
                  localStorage.removeItem('verify_email_address');
                  localStorage.removeItem('verify_email_name');
                  if (typeof document !== 'undefined') {
                    document.cookie = 'next_step=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                  }
                }
              }}
              className="w-full flex items-center justify-center rounded-xl bg-[#134E43] hover:bg-[#0E3E35] active:scale-[0.99] text-white py-3.5 px-4 font-semibold text-sm transition-all duration-200 shadow-md shadow-[#134E43]/20 text-center"
            >
              Go to log in
            </Link>

            <button
              type="button"
              onClick={handleResendEmail}
              disabled={resendCountdown > 0 || isResending}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 font-medium text-xs transition-all duration-200 ${resendCountdown > 0 || isResending
                ? 'bg-[#EAE8E3]/60 text-zinc-500 cursor-not-allowed border border-zinc-200/40'
                : 'bg-[#EAE8E3] hover:bg-[#E0DDD7] text-zinc-700 cursor-pointer border border-zinc-300/60'
                }`}
            >
              {isResending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Sending email...
                </>
              ) : resendCountdown > 0 ? (
                `Resend email in 0:${resendCountdown.toString().padStart(2, '0')}`
              ) : (
                'Resend email'
              )}
            </button>
          </div>

          {/* Footer Assistance */}
          <p className="text-xs text-zinc-500 leading-relaxed pt-1">
            Can&apos;t find it? Check your spam or promotions folder. Wrong address?{' '}
            <button
              type="button"
              onClick={() => {
                setIsSuccess(false);
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('nextStep');
                  localStorage.removeItem('verify_email_address');
                  localStorage.removeItem('verify_email_name');
                  if (typeof document !== 'undefined') {
                    document.cookie = 'next_step=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                  }
                }
              }}
              className="font-semibold text-zinc-900 hover:underline cursor-pointer"
            >
              Change email
            </button>
          </p>
        </div>
      ) : step === 1 ? (
        /* STEP 1: Role Selection */
        <div key="signup-step-1" className="space-y-6 animate-in fade-in duration-200">
          {/* Section 1: Registration Type Cards */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-zinc-800">
              Registration type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Company Option Card */}
              <button
                type="button"
                onClick={() => setRegistrationType('company')}
                className={`relative cursor-pointer select-none text-left p-4 sm:p-5 rounded-2xl transition-all duration-200 flex flex-col justify-between ${registrationType === 'company'
                  ? 'border-2 border-[#1D5943] bg-[#EAF3EE]/80 shadow-xs'
                  : 'border border-zinc-200/90 bg-white hover:border-zinc-300'
                  }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${registrationType === 'company'
                      ? 'bg-[#1D5943]/12 text-[#1D5943]'
                      : 'bg-zinc-100 text-zinc-600'
                      }`}
                  >
                    <Building2 className="h-5 w-5" />
                  </div>
                  {/* Radio Indicator */}
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${registrationType === 'company'
                      ? 'border-[#1D5943]'
                      : 'border-zinc-300'
                      }`}
                  >
                    {registrationType === 'company' && (
                      <div className="h-2.5 w-2.5 rounded-full bg-[#1D5943]" />
                    )}
                  </div>
                </div>

                <div className="pt-3">
                  <h4 className="text-sm font-bold text-zinc-900">Company</h4>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    Register your organisation and manage your team.
                  </p>
                </div>
              </button>

              {/* Individual Option Card */}
              <button
                type="button"
                onClick={() => setRegistrationType('individual')}
                className={`relative cursor-pointer select-none text-left p-4 sm:p-5 rounded-2xl transition-all duration-200 flex flex-col justify-between ${registrationType === 'individual'
                  ? 'border-2 border-[#1D5943] bg-[#EAF3EE]/80 shadow-xs'
                  : 'border border-zinc-200/90 bg-white hover:border-zinc-300'
                  }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${registrationType === 'individual'
                      ? 'bg-[#1D5943]/12 text-[#1D5943]'
                      : 'bg-zinc-100 text-zinc-600'
                      }`}
                  >
                    <User className="h-5 w-5" />
                  </div>
                  {/* Radio Indicator */}
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${registrationType === 'individual'
                      ? 'border-[#1D5943]'
                      : 'border-zinc-300'
                      }`}
                  >
                    {registrationType === 'individual' && (
                      <div className="h-2.5 w-2.5 rounded-full bg-[#1D5943]" />
                    )}
                  </div>
                </div>

                <div className="pt-3">
                  <h4 className="text-sm font-bold text-zinc-900">Individual</h4>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    Join your company&apos;s workspace, or work independently.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Sub-category based on Registration Type */}
          {registrationType === 'company' ? (
            <div className="space-y-2.5 pt-1">
              <label className="text-xs font-semibold text-zinc-800">
                What kind of company?
              </label>
              <div className="space-y-2.5">
                {/* Manufacturing firm */}
                <button
                  type="button"
                  onClick={() => setCompanyKind('manufacturing')}
                  className={`w-full text-left p-4 rounded-2xl transition-all duration-200 flex items-center gap-3.5 cursor-pointer ${companyKind === 'manufacturing'
                    ? 'border-2 border-[#1D5943] bg-[#EAF3EE]/80 shadow-xs'
                    : 'border border-zinc-200/90 bg-white hover:border-zinc-300'
                    }`}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${companyKind === 'manufacturing'
                      ? 'border-[#1D5943]'
                      : 'border-zinc-300'
                      }`}
                  >
                    {companyKind === 'manufacturing' && (
                      <div className="h-2.5 w-2.5 rounded-full bg-[#1D5943]" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">
                      Manufacturing firm
                    </h4>
                    <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">
                      You make pharmaceutical products at your own or partner sites.
                    </p>
                  </div>
                </button>

                {/* Service provider firm */}
                <button
                  type="button"
                  onClick={() => setCompanyKind('service_provider')}
                  className={`w-full text-left p-4 rounded-2xl transition-all duration-200 flex items-center gap-3.5 cursor-pointer ${companyKind === 'service_provider'
                    ? 'border-2 border-[#1D5943] bg-[#EAF3EE]/80 shadow-xs'
                    : 'border border-zinc-200/90 bg-white hover:border-zinc-300'
                    }`}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${companyKind === 'service_provider'
                      ? 'border-[#1D5943]'
                      : 'border-zinc-300'
                      }`}
                  >
                    {companyKind === 'service_provider' && (
                      <div className="h-2.5 w-2.5 rounded-full bg-[#1D5943]" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">
                      Service provider firm
                    </h4>
                    <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                      You provide independent quality and compliance services to manufacturers.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 pt-1">
              <label className="text-xs font-semibold text-zinc-800">
                How are you joining?
              </label>
              <div className="space-y-2.5">
                {/* Employee Option */}
                <button
                  type="button"
                  onClick={() => setIndividualKind('employee')}
                  className={`w-full text-left p-4 rounded-2xl transition-all duration-200 flex items-center gap-3.5 cursor-pointer ${individualKind === 'employee'
                    ? 'border-2 border-[#1D5943] bg-[#EAF3EE]/80 shadow-xs'
                    : 'border border-zinc-200/90 bg-white hover:border-zinc-300'
                    }`}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${individualKind === 'employee'
                      ? 'border-[#1D5943]'
                      : 'border-zinc-300'
                      }`}
                  >
                    {individualKind === 'employee' && (
                      <div className="h-2.5 w-2.5 rounded-full bg-[#1D5943]" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">
                      Employee
                    </h4>
                    <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">
                      Your company has invited you. You&apos;ll need the invite code from your admin.
                    </p>
                  </div>
                </button>

                {/* Independent Auditor */}
                <button
                  type="button"
                  onClick={() => setIndividualKind('independent_auditor')}
                  className={`w-full text-left p-4 rounded-2xl transition-all duration-200 flex items-center gap-3.5 cursor-pointer ${individualKind === 'independent_auditor'
                    ? 'border-2 border-[#1D5943] bg-[#EAF3EE]/80 shadow-xs'
                    : 'border border-zinc-200/90 bg-white hover:border-zinc-300'
                    }`}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${individualKind === 'independent_auditor'
                      ? 'border-[#1D5943]'
                      : 'border-zinc-300'
                      }`}
                  >
                    {individualKind === 'independent_auditor' && (
                      <div className="h-2.5 w-2.5 rounded-full bg-[#1D5943]" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">
                      Independent Professional
                    </h4>
                    <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                      You work with manufacturers on your own, not through a firm.
                    </p>
                  </div>
                </button>
                {registrationType === 'individual' && individualKind === 'employee' && (
                  <div
                    className="w-full mt-8 text-left p-4 rounded-2xl transition-all duration-200 flex items-center gap-3.5 border border-[#f2e3c4] bg-[#fcf4e7]/80 shadow-xs"
                  >
                    <Info className="stroke-[#56400e]" />
                    <div>

                      <p className="text-xs mt-0.5 leading-relaxed text-[#836e49]">
                        Got an invite email? Open the link in it instead — we&apos;ll fill in your invite
                        code and email for you.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Continue Button */}
          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1D5943] hover:bg-[#164836] active:scale-[0.99] text-white py-3.5 px-4 font-semibold text-sm transition-all duration-200 shadow-md shadow-[#1D5943]/20 cursor-pointer"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : registrationType === 'individual' && individualKind === 'employee' && !isInviteVerified ? (
        /* STEP 2 (Employee): Dedicated Invite Code Verification matching design */
        <form key="signup-step-2-employee-verify" onSubmit={handleVerifyInviteCode} className="space-y-5 animate-in fade-in duration-200">
          {/* Invite Code Input */}
          <div className="space-y-2 text-left">
            <label className="text-xs font-semibold text-zinc-700">Invite code</label>
            <div className="relative">
              <input
                type="text"
                required
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value);
                  setInviteError(null);
                  setIsInviteValid(null);
                }}
                placeholder="e.g. dfhhtrthgbfh"
                className={`w-full rounded-xl bg-white px-4 py-3 text-base sm:text-lg font-mono tracking-wider font-semibold text-zinc-900 placeholder:text-zinc-300 placeholder:font-mono focus:outline-none transition-all shadow-xs ${inviteError || isInviteValid === false
                  ? 'border border-rose-300 ring-2 ring-rose-200/70 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border border-zinc-200/90 focus:border-[#1D5943] focus:ring-2 focus:ring-[#1D5943]/20'
                  }`}
              />
            </div>

            {/* Error Message */}
            {(inviteError || isInviteValid === false) && (
              <div className="flex items-start gap-2 text-xs text-rose-600 pt-1 animate-in fade-in duration-150">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                <p className="leading-relaxed">
                  {inviteError || "This code isn't valid or has expired. Check it with your company admin, or ask them to send a new invite."}
                </p>
              </div>
            )}
          </div>

          {/* Primary Verify Button */}
          <button
            type="submit"
            disabled={isVerifyingCode}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#164E43] hover:bg-[#123F36] active:scale-[0.99] text-white py-3.5 px-4 font-semibold text-sm transition-all duration-200 shadow-md shadow-[#164E43]/20 disabled:opacity-75 disabled:pointer-events-none cursor-pointer"
          >
            {isVerifyingCode ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying code...
              </>
            ) : (
              'Verify code'
            )}
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center py-2">
            <div className="w-full border-t border-zinc-200" />
            <span className="absolute bg-[#FAF7F2] px-3 text-xs text-zinc-400 font-medium">
              or
            </span>
          </div>

          {/* Bottom Card for Independent Professional */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs space-y-1 text-left">
            <h4 className="text-sm font-bold text-zinc-900">Not joining a company?</h4>
            <p className="text-xs text-zinc-600 leading-relaxed">
              If you work on your own,{' '}
              <button
                type="button"
                onClick={() => {
                  setIndividualKind('independent_auditor');
                  setInviteError(null);
                }}
                className="font-semibold text-[#1D5943] hover:underline cursor-pointer"
              >
                register as an independent professional
              </button>{' '}
              instead.
            </p>
          </div>
        </form>
      ) : registrationType === 'individual' && individualKind === 'employee' && isInviteVerified ? (
        /* STEP 2 (Employee - Verified): Exact "Join Sunrise Pharma on Vaayath" invitation screen */
        <form key="signup-step-2-employee-verified" onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-200 text-left">
          {/* Company Card */}
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-xs flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0B2E24] text-[#4ADE80] font-bold text-sm tracking-wide">
              {(verifiedOrg || 'Sunrise Pharma').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-zinc-900 leading-tight">
                {verifiedOrg || orgParam || 'Sunrise Pharma Pvt. Ltd.'}
              </h4>
              <p className="text-xs text-zinc-500 mt-0.5 truncate">
                {codeParam ? 'Invited by workspace admin' : `Invited via code ${inviteCode}`}
              </p>
            </div>
          </div>

          {/* 2-Column Form Fields */}
          <div className="space-y-4">
            {/* Row 1: Invite code & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Invite code</label>
                <input
                  type="text"
                  readOnly
                  value={inviteCode}
                  className="w-full rounded-xl border border-zinc-200/90 bg-zinc-100/80 px-3.5 py-2.5 text-sm font-mono font-semibold tracking-wider text-zinc-700 focus:outline-none cursor-default shadow-xs"
                />
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#1D5943] pt-0.5">
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Verified invitation code</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Email</label>
                <div className="relative flex items-center">
                  <input
                    type="email"
                    required
                    readOnly={Boolean(emailParam)}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. employee@company.com"
                    className={`w-full rounded-xl border border-zinc-200/90 px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none transition-all shadow-xs ${emailParam
                      ? 'bg-zinc-100/80 text-zinc-700 cursor-default pr-10'
                      : 'bg-white focus:border-[#1D5943] focus:ring-2 focus:ring-[#1D5943]/20'
                      }`}
                  />
                  {emailParam && (
                    <Lock className="absolute right-3.5 h-4 w-4 text-zinc-400 pointer-events-none" />
                  )}
                </div>
                <div className="text-xs text-zinc-500 pt-0.5">
                  {emailParam ? 'Set by your invite' : 'Your work email address'}
                </div>
              </div>
            </div>

            {/* Row 2: Your full name & Country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Your full name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="As on your company ID"
                  className="w-full rounded-xl border border-zinc-200/90 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#1D5943] focus:outline-none focus:ring-2 focus:ring-[#1D5943]/20 transition-all shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Country</label>
                <div className="relative flex items-center">
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full appearance-none cursor-pointer rounded-xl border border-zinc-200/90 bg-white px-3.5 pr-10 py-2.5 text-sm font-medium text-zinc-900 shadow-xs transition-all hover:border-zinc-300 focus:border-[#1D5943] focus:outline-none focus:ring-2 focus:ring-[#1D5943]/20"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.name} className="text-zinc-900 bg-white py-1">
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 h-4 w-4 text-zinc-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Row 3: Password & Confirm password */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      className="w-full rounded-xl border border-zinc-200/90 bg-white px-3.5 py-2.5 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#1D5943] focus:outline-none focus:ring-2 focus:ring-[#1D5943]/20 transition-all shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700">Confirm password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className={`w-full rounded-xl border bg-white px-3.5 py-2.5 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all shadow-xs ${confirmPassword.length > 0
                        ? confirmPassword === password
                          ? 'border-[#1D5943] focus:border-[#1D5943] focus:ring-[#1D5943]/20'
                          : 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                        : 'border-zinc-200/90 focus:border-[#1D5943] focus:ring-[#1D5943]/20'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-0.5 animate-in fade-in duration-150">
                      {confirmPassword === password ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#1D5943] stroke-[3]" />
                          <span className="text-xs font-medium text-[#1D5943]">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                          <span className="text-xs font-medium text-rose-500">Passwords do not match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Password Strength Meter & Requirement Checklist */}
              {password.length > 0 && (
                <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                  {/* 5-segment strength bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 flex-1">
                      {[1, 2, 3, 4, 5].map((level) => {
                        const check = validatePassword(password);
                        const isFilled = level <= check.score;
                        return (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                              isFilled
                                ? check.score === 5
                                  ? 'bg-[#1D5943]'
                                  : check.score >= 3
                                    ? 'bg-amber-500'
                                    : 'bg-rose-400'
                                : 'bg-zinc-200'
                            }`}
                          />
                        );
                      })}
                    </div>
                    {/* Strength Label */}
                    {(() => {
                      const check = validatePassword(password);
                      const label =
                        check.score === 5
                          ? 'Strong'
                          : check.score >= 4
                            ? 'Good'
                            : check.score >= 2
                              ? 'Fair'
                              : 'Weak';
                      return (
                        <span className="text-xs font-semibold text-[#1D5943] min-w-[42px] text-right">
                          {label}
                        </span>
                      );
                    })()}
                  </div>

                  {/* 2-Column Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    {/* Column 1 */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {password.length >= 8 ? (
                          <Check className="h-3.5 w-3.5 text-[#1D5943] stroke-[3] shrink-0" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-zinc-400 shrink-0" />
                        )}
                        <span
                          className={
                            password.length >= 8
                              ? 'text-[#1D5943] font-medium'
                              : 'text-zinc-500'
                          }
                        >
                          At least 8 characters
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/[A-Z]/.test(password) ? (
                          <Check className="h-3.5 w-3.5 text-[#1D5943] stroke-[3] shrink-0" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-zinc-400 shrink-0" />
                        )}
                        <span
                          className={
                            /[A-Z]/.test(password)
                              ? 'text-[#1D5943] font-medium'
                              : 'text-zinc-500'
                          }
                        >
                          1 capital letter (A-Z)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/[a-z]/.test(password) ? (
                          <Check className="h-3.5 w-3.5 text-[#1D5943] stroke-[3] shrink-0" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-zinc-400 shrink-0" />
                        )}
                        <span
                          className={
                            /[a-z]/.test(password)
                              ? 'text-[#1D5943] font-medium'
                              : 'text-zinc-500'
                          }
                        >
                          1 small letter (a-z)
                        </span>
                      </div>
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {/\d/.test(password) ? (
                          <Check className="h-3.5 w-3.5 text-[#1D5943] stroke-[3] shrink-0" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-zinc-400 shrink-0" />
                        )}
                        <span
                          className={
                            /\d/.test(password)
                              ? 'text-[#1D5943] font-medium'
                              : 'text-zinc-500'
                          }
                        >
                          At least one number (0-9)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/[^A-Za-z0-9]/.test(password) ? (
                          <Check className="h-3.5 w-3.5 text-[#1D5943] stroke-[3] shrink-0" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-zinc-400 shrink-0" />
                        )}
                        <span
                          className={
                            /[^A-Za-z0-9]/.test(password)
                              ? 'text-[#1D5943] font-medium'
                              : 'text-zinc-500'
                          }
                        >
                          At least one symbol (!@#$)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#164E43] hover:bg-[#123F36] active:scale-[0.99] text-white py-3.5 px-4 font-semibold text-sm transition-all duration-200 shadow-md shadow-[#164E43]/20 disabled:opacity-70 disabled:pointer-events-none cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Joining workspace...
              </>
            ) : (
              'Create account & join'
            )}
          </button>

          {/* Terms text */}
          <div className="text-center text-xs text-zinc-500">
            By creating an account you agree to Vaayath&apos;s{' '}
            <Link href="/terms" className="font-semibold text-[#1D5943] hover:underline">
              Terms
            </Link>
            {' and '}
            <Link href="/privacy" className="font-semibold text-[#1D5943] hover:underline">
              Privacy Policy
            </Link>
            .
          </div>
        </form>
      ) : (
        /* STEP 2: Company & Independent Professional Profile Details */
        <form key={`signup-step-2-profile-${registrationType}-${individualKind}`} onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-200">
          {/* Company Name Field (if company registration) or Invite Code for independent professional */}
          {registrationType === 'company' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Company name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Cipla Ltd."
                className="w-full rounded-xl border border-zinc-200/90 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#1D5943] focus:outline-none focus:ring-2 focus:ring-[#1D5943]/20 transition-all shadow-xs"
              />
            </div>
          ) : null}

          {/* Full Name & Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Country</label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-zinc-400 pointer-events-none">
                  <Globe2 className="h-4 w-4" />
                </div>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full appearance-none cursor-pointer rounded-xl border border-zinc-200/90 bg-white pl-10 pr-10 py-2.5 text-sm font-medium text-zinc-900 shadow-xs transition-all hover:border-zinc-300 focus:border-[#1D5943] focus:outline-none focus:ring-2 focus:ring-[#1D5943]/20"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.name} className="text-zinc-900 bg-white py-1">
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 text-zinc-400 pointer-events-none">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Full name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rhea Kapoor"
                className="w-full rounded-xl border border-zinc-200/90 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#1D5943] focus:outline-none focus:ring-2 focus:ring-[#1D5943]/20 transition-all shadow-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700">Work email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rhea.k@cipla.com"
              className="w-full rounded-xl border border-zinc-200/90 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#1D5943] focus:outline-none focus:ring-2 focus:ring-[#1D5943]/20 transition-all shadow-xs"
            />
          </div>

          {/* Password & Confirm Password */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full rounded-xl border border-zinc-200/90 bg-white px-3.5 py-2.5 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#1D5943] focus:outline-none focus:ring-2 focus:ring-[#1D5943]/20 transition-all shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Confirm password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className={`w-full rounded-xl border bg-white px-3.5 py-2.5 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all shadow-xs ${confirmPassword.length > 0
                      ? confirmPassword === password
                        ? 'border-[#1D5943] focus:border-[#1D5943] focus:ring-[#1D5943]/20'
                        : 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-zinc-200/90 focus:border-[#1D5943] focus:ring-[#1D5943]/20'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-0.5 animate-in fade-in duration-150">
                    {confirmPassword === password ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#1D5943] stroke-[3]" />
                        <span className="text-xs font-medium text-[#1D5943]">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                        <span className="text-xs font-medium text-rose-500">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Password Strength Meter & Requirement Checklist */}
            {password.length > 0 && (
              <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                {/* 5-segment strength bar */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 flex-1">
                    {[1, 2, 3, 4, 5].map((level) => {
                      const check = validatePassword(password);
                      const isFilled = level <= check.score;
                      return (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                            isFilled
                              ? check.score === 5
                                ? 'bg-[#1D5943]'
                                : check.score >= 3
                                  ? 'bg-amber-500'
                                  : 'bg-rose-400'
                              : 'bg-zinc-200'
                          }`}
                        />
                      );
                    })}
                  </div>
                  {/* Strength Label */}
                  {(() => {
                    const check = validatePassword(password);
                    const label =
                      check.score === 5
                        ? 'Strong'
                        : check.score >= 4
                          ? 'Good'
                          : check.score >= 2
                            ? 'Fair'
                            : 'Weak';
                    return (
                      <span className="text-xs font-semibold text-[#1D5943] min-w-[42px] text-right">
                        {label}
                      </span>
                    );
                  })()}
                </div>

                {/* 2-Column Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  {/* Column 1 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {password.length >= 8 ? (
                        <Check className="h-3.5 w-3.5 text-[#1D5943] stroke-[3] shrink-0" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border border-zinc-400 shrink-0" />
                      )}
                      <span
                        className={
                          password.length >= 8
                            ? 'text-[#1D5943] font-medium'
                            : 'text-zinc-500'
                        }
                      >
                        At least 8 characters
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/[A-Z]/.test(password) ? (
                        <Check className="h-3.5 w-3.5 text-[#1D5943] stroke-[3] shrink-0" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border border-zinc-400 shrink-0" />
                      )}
                      <span
                        className={
                          /[A-Z]/.test(password)
                            ? 'text-[#1D5943] font-medium'
                            : 'text-zinc-500'
                        }
                      >
                        1 capital letter (A-Z)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/[a-z]/.test(password) ? (
                        <Check className="h-3.5 w-3.5 text-[#1D5943] stroke-[3] shrink-0" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border border-zinc-400 shrink-0" />
                      )}
                      <span
                        className={
                          /[a-z]/.test(password)
                            ? 'text-[#1D5943] font-medium'
                            : 'text-zinc-500'
                        }
                      >
                        1 small letter (a-z)
                      </span>
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {/\d/.test(password) ? (
                        <Check className="h-3.5 w-3.5 text-[#1D5943] stroke-[3] shrink-0" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border border-zinc-400 shrink-0" />
                      )}
                      <span
                        className={
                          /\d/.test(password)
                            ? 'text-[#1D5943] font-medium'
                            : 'text-zinc-500'
                        }
                      >
                        At least one number (0-9)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/[^A-Za-z0-9]/.test(password) ? (
                        <Check className="h-3.5 w-3.5 text-[#1D5943] stroke-[3] shrink-0" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border border-zinc-400 shrink-0" />
                      )}
                      <span
                        className={
                          /[^A-Za-z0-9]/.test(password)
                            ? 'text-[#1D5943] font-medium'
                            : 'text-zinc-500'
                        }
                      >
                        At least one symbol (!@#$)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1D5943] hover:bg-[#164836] active:scale-[0.99] text-white py-3.5 px-4 font-semibold text-sm transition-all duration-200 shadow-md shadow-[#1D5943]/20 disabled:opacity-70 disabled:pointer-events-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          {/* Sign In Redirection */}
          <div className="text-center text-xs text-zinc-600">
            By creating an account you agree to Vaayath&apos;s{' '}
            <Link href="/terms" className="font-semibold text-[#1D5943] hover:underline">
              Terms
            </Link>
            {' and '}
            <Link href="/privacy" className="font-semibold text-[#1D5943] hover:underline">
              Privacy Policy
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-xl flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#1D5943]" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
