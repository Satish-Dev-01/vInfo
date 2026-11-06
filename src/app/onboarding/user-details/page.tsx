'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Upload, Loader2 } from 'lucide-react';
import { useAppStore } from '@/stores/app.store';
import { COUNTRIES } from '@/lib/constants/countries';
import { getStoredAuthToken, handleUnauthorizedSession } from '@/lib/auth-helpers';
import { UserDetailsRequest } from '@/types';

const USER_ME_DETAILS_API = '/api/users/me/details';

interface StoredUser {
  id?: string;
  email?: string;
  fullName?: string;
  name?: string;
  role?: string;
  registrationType?: string;
  organizationId?: string | null;
  organizationName?: string | null;
  department?: string | null;
  level?: string | null;
  preparer?: boolean;
  reviewer?: boolean;
  approver?: boolean;
  phone?: string;
  jobTitle?: string;
  designation?: string;
  qualification?: string;
  highestQualification?: string;
  experienceYears?: number | string;
  yearsOfExperience?: number | string;
  functions?: string[];
  productTypes?: string[];
  avatarUrl?: string;
  photoUrl?: string;
}

const QUALIFICATION_OPTIONS = [
  'M.Pharm',
  'B.Pharm',
  'Pharm.D',
  'Ph.D in Pharmaceutical Sciences',
  'M.Sc Chemistry / Microbiology',
  'B.Sc Life Sciences',
  'B.Tech / B.E. (Biotechnology / Chemical)',
  'MBBS / MD',
  'MBA (Pharma Management)',
  'Other',
];

const FUNCTION_OPTIONS = [
  'Quality Assurance',
  'Quality Control',
  'Production',
  'Regulatory Affairs',
  'Engineering',
  'R&D',
  'Pharmacovigilance',
  'Clinical Operations',
];

const PRODUCT_TYPE_OPTIONS = [
  'Oral solid dosage',
  'Sterile & injectables',
  'API',
  'Liquids & topicals',
  'Biologics',
  'Medical devices',
  'Vaccines',
];

export default function UserDetailsPage() {
  const router = useRouter();
  const addNotification = useAppStore((state) => state.addNotification);

  // User context from session / localStorage
  const [user, setUser] = useState<StoredUser | null>(null);
  const [userInitials, setUserInitials] = useState('');

  // Form State
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [country, setCountry] = useState('India');
  const [countryCode, setCountryCode] = useState('+91');
  const [mobileNumber, setMobileNumber] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [designation, setDesignation] = useState('');
  const [highestQualification, setHighestQualification] = useState('M.Pharm');
  const [yearsOfExperience, setYearsOfExperience] = useState('');

  // Multi-select pills (pre-selected to match reference design)
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([
    'Quality Assurance',
    'Regulatory Affairs',
  ]);
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([
    'Oral solid dosage',
  ]);

  const [isSaving, setIsSaving] = useState(false);

  // Sync country and countryCode
  const handleCountryChange = (countryName: string) => {
    setCountry(countryName);
    const matched = COUNTRIES.find(
      (c) => c.name.toLowerCase() === countryName.trim().toLowerCase()
    );
    if (matched) {
      setCountryCode(matched.dialCode);
    }
  };

  const handleCountryCodeChange = (dialCode: string) => {
    setCountryCode(dialCode);
    const matched = COUNTRIES.find((c) => c.dialCode === dialCode);
    if (matched) {
      setCountry(matched.name);
    }
  };

  // Check if user already reached DASHBOARD or load stored user & fetch existing details
  useEffect(() => {
    let isMounted = true;

    try {
      if (typeof window !== 'undefined') {
        const storedNextStep = localStorage.getItem('nextStep');
        if (storedNextStep === 'DASHBOARD' || storedNextStep === 'COMPLETED') {
          router.replace('/dashboard');
          return;
        }
        if (storedNextStep === 'INVITE_TEAM') {
          router.replace('/onboarding/invite');
          return;
        }

        const rawUser = localStorage.getItem('user');
        if (rawUser) {
          queueMicrotask(() => {
            if (!isMounted) return;
            try {
              const parsed: StoredUser = JSON.parse(rawUser);
              setUser(parsed);

              // Calculate user initials
              const displayName = (parsed.fullName || parsed.name || '').trim();
              if (displayName) {
                const parts = displayName.split(/\s+/);
                const inits =
                  parts.length >= 2
                    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
                    : parts[0].slice(0, 2);
                setUserInitials(inits.toUpperCase());
              }

              if (parsed.jobTitle) setJobTitle(parsed.jobTitle);
              if (parsed.designation) {
                setDesignation(parsed.designation);
                if (!parsed.jobTitle) setJobTitle(parsed.designation);
              }
              if (parsed.highestQualification || parsed.qualification) {
                setHighestQualification(parsed.highestQualification || parsed.qualification || 'M.Pharm');
              }
              if (typeof parsed.yearsOfExperience !== 'undefined') {
                setYearsOfExperience(String(parsed.yearsOfExperience));
              } else if (typeof parsed.experienceYears !== 'undefined') {
                setYearsOfExperience(String(parsed.experienceYears));
              }
              if (parsed.functions && Array.isArray(parsed.functions) && parsed.functions.length > 0) {
                setSelectedFunctions(parsed.functions);
              }
              if (parsed.productTypes && Array.isArray(parsed.productTypes) && parsed.productTypes.length > 0) {
                setSelectedProductTypes(parsed.productTypes);
              }
              if (parsed.avatarUrl || parsed.photoUrl) {
                setAvatarPreview(parsed.avatarUrl || parsed.photoUrl || null);
              }
            } catch {
              // Ignore parse errors
            }
          });
        }
      }
    } catch {
      // Ignore parse errors
    }

    // Also fetch saved user details from GET /api/users/me/details
    async function fetchExistingDetails() {
      try {
        const token = getStoredAuthToken();
        const res = await fetch(USER_ME_DETAILS_API, {
          method: 'GET',
          headers: {
            accept: '*/*',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) return;
        const resJson = await res.json().catch(() => null);
        if (!resJson?.success || !resJson?.data) return;

        const data = (resJson.data?.data || resJson.data) as Record<string, unknown>;
        if (!isMounted || !data) return;

        if (typeof data.phone === 'string' && data.phone.trim()) {
          const rawPhone = data.phone.trim();
          const matchedCountry = COUNTRIES.find((c) => rawPhone.startsWith(c.dialCode));
          if (matchedCountry) {
            setCountryCode(matchedCountry.dialCode);
            setCountry(matchedCountry.name);
            setMobileNumber(rawPhone.slice(matchedCountry.dialCode.length).trim());
          } else {
            setMobileNumber(rawPhone);
          }
        }

        if (typeof data.jobTitle === 'string' && data.jobTitle) {
          setJobTitle(data.jobTitle);
        }
        if (typeof data.designation === 'string' && data.designation) {
          setDesignation(data.designation);
        }
        if (typeof data.country === 'string' && data.country) {
          setCountry(data.country);
          const matched = COUNTRIES.find(
            (c) => c.name.toLowerCase() === (data.country as string).trim().toLowerCase()
          );
          if (matched) {
            setCountryCode(matched.dialCode);
          }
        }
        if (typeof data.highestQualification === 'string' && data.highestQualification) {
          setHighestQualification(data.highestQualification);
        }
        if (typeof data.yearsOfExperience !== 'undefined' && data.yearsOfExperience !== null) {
          setYearsOfExperience(String(data.yearsOfExperience));
        }
        if (Array.isArray(data.functions) && data.functions.length > 0) {
          setSelectedFunctions(data.functions.map(String));
        }
        if (Array.isArray(data.productTypes) && data.productTypes.length > 0) {
          setSelectedProductTypes(data.productTypes.map(String));
        }
        if (typeof data.photoUrl === 'string' && data.photoUrl) {
          setAvatarPreview(data.photoUrl);
        } else if (typeof data.avatarUrl === 'string' && data.avatarUrl) {
          setAvatarPreview(data.avatarUrl);
        }
      } catch {
        // Silently ignore GET errors
      }
    }

    fetchExistingDetails();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Compute context card values
  const displayCompany =
    user?.organizationName ||
    (user?.role === 'INDEPENDENT_PROFESSIONAL' ? 'Sunrise Pharma Pvt. Ltd.' : 'Sunrise Pharma Pvt. Ltd.');

  const displayDepartment =
    user?.department || 'Quality Assurance (QA)';

  const displayLevel =
    user?.level || 'L4 · Senior Executive';

  // Compute rights badge
  const displayRights = (() => {
    if (!user) return 'Preparer';
    const rights: string[] = [];
    if (user.preparer) rights.push('Preparer');
    if (user.reviewer) rights.push('Reviewer');
    if (user.approver) rights.push('Approver');
    return rights.length > 0 ? rights.join(', ') : 'Preparer';
  })();

  // Toggle Function pill
  const toggleFunction = (fn: string) => {
    setSelectedFunctions((prev) =>
      prev.includes(fn) ? prev.filter((item) => item !== fn) : [...prev, fn]
    );
  };

  // Toggle Product Type pill
  const toggleProductType = (pt: string) => {
    setSelectedProductTypes((prev) =>
      prev.includes(pt) ? prev.filter((item) => item !== pt) : [...prev, pt]
    );
  };

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      addNotification({
        type: 'error',
        title: 'File Too Large',
        message: 'Please select an image smaller than 2 MB.',
      });
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      addNotification({
        type: 'error',
        title: 'Unsupported Format',
        message: 'Please upload a JPG or PNG file.',
      });
      return;
    }

    setPhotoFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
      addNotification({
        type: 'success',
        title: 'Photo Uploaded',
        message: 'Your profile photo preview has been updated.',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setAvatarPreview(null);
  };

  // Build UserDetailsRequest payload matching Swagger API schema
  const buildPayload = (): UserDetailsRequest => {
    const trimmedMobile = (mobileNumber || '').trim();
    const finalPhone = trimmedMobile ? `${countryCode} ${trimmedMobile}`.trim() : '';
    const finalJobTitle = (jobTitle || designation || '').trim();
    const finalDesignation = (designation || jobTitle || '').trim();
    const expNumber = parseInt(yearsOfExperience, 10);
    const finalExperience = isNaN(expNumber) || expNumber < 0 ? 0 : expNumber;

    return {
      phone: finalPhone,
      jobTitle: finalJobTitle,
      designation: finalDesignation,
      country: (country || 'India').trim(),
      highestQualification: highestQualification || 'M.Pharm',
      yearsOfExperience: finalExperience,
      functions: selectedFunctions,
      productTypes: selectedProductTypes,
    };
  };

  // Skip profile setup: PUT /api/users/me/details?complete=false
  const handleSkip = async () => {
    try {
      const payload = buildPayload();
      const token = getStoredAuthToken();

      const queryUrl = `${USER_ME_DETAILS_API}?complete=false&formDetails=${encodeURIComponent(JSON.stringify(payload))}`;

      await fetch(queryUrl, {
        method: 'PUT',
        headers: {
          accept: '*/*',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
    } catch {
      // Ignore network errors on skip
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('nextStep', 'DASHBOARD');
      document.cookie = 'next_step=DASHBOARD; path=/; max-age=604800; SameSite=Lax';
    }

    addNotification({
      type: 'info',
      title: 'Profile Setup Skipped',
      message: 'You can complete your profile anytime in Settings.',
    });
    router.push('/dashboard');
  };

  // Save profile & continue: PUT /api/users/me/details?complete=true
  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    try {
      const payload = buildPayload();
      const token = getStoredAuthToken();

      // Multipart form-data body for photo
      const formData = new FormData();
      formData.append('formDetails', JSON.stringify(payload));

      if (photoFile) {
        formData.append('photo', photoFile, photoFile.name);
      }

      const queryUrl = `${USER_ME_DETAILS_API}?complete=true&formDetails=${encodeURIComponent(JSON.stringify(payload))}`;

      const response = await fetch(queryUrl, {
        method: 'PUT',
        headers: {
          accept: '*/*',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const resData = await response.json().catch(() => null);

      if (!response.ok || resData?.success === false) {
        if (response.status === 401) {
          handleUnauthorizedSession({ router });
          return;
        }
        const errorMsg =
          resData?.message ||
          resData?.error?.message ||
          (typeof resData?.error === 'string' ? resData.error : null) ||
          'Failed to save user details. Please try again.';
        addNotification({
          type: 'error',
          title: 'Save Failed',
          message: errorMsg,
        });
        return;
      }

      // Read nextStep from API response
      const rawNextStep =
        resData?.nextStep ||
        resData?.data?.nextStep;
      const nextStep =
        rawNextStep && rawNextStep !== 'USER_DETAILS'
          ? rawNextStep
          : 'DASHBOARD';

      // Update local storage
      if (typeof window !== 'undefined') {
        const updatedUser: StoredUser = {
          ...(user || {}),
          jobTitle: payload.jobTitle,
          designation: payload.designation,
          highestQualification: payload.highestQualification,
          qualification: payload.highestQualification,
          yearsOfExperience: payload.yearsOfExperience,
          experienceYears: payload.yearsOfExperience,
          functions: payload.functions,
          productTypes: payload.productTypes,
          avatarUrl: avatarPreview || undefined,
          photoUrl: avatarPreview || undefined,
          phone: payload.phone,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        localStorage.setItem('onboarding_step_user_details_completed', 'true');
        localStorage.setItem('nextStep', nextStep);

        if (typeof document !== 'undefined') {
          document.cookie = `next_step=${encodeURIComponent(nextStep)}; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = 'onboarding_step_user_details_completed=true; path=/; max-age=604800; SameSite=Lax';
        }
      }

      addNotification({
        type: 'success',
        title: 'Profile Saved',
        message: resData?.message || 'Your user details have been saved successfully.',
      });

      // nextStep navigation
      if (nextStep === 'INVITE_TEAM') {
        router.push('/onboarding/invite');
      } else {
        router.push('/dashboard');
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: 'Could not save profile details. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-screen h-[100dvh] bg-[#FBF9F5] text-[#1E2320] flex flex-col font-sans overflow-hidden">
      {/* ─────────────────────────────────────────────────────────────
          TOP NAVBAR
      ───────────────────────────────────────────────────────────── */}
      <header className="shrink-0 bg-[#FBF9F5]/90 backdrop-blur-md border-b border-[#EAE2D4]/80 px-4 sm:px-8 py-3.5 flex items-center justify-between z-30">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-md bg-[#0D4B39] text-[#52E098] flex items-center justify-center font-bold text-sm shadow-xs transition-transform group-hover:scale-105 select-none">
            <span className="font-serif">V</span>
          </div>
          <span className="font-serif font-bold text-xl text-[#1E2320] tracking-tight">
            Vaayath
          </span>
        </Link>

        {/* Top Right: Skip & User Avatar */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs sm:text-sm font-semibold text-[#1F6E5B] hover:text-[#164836] transition-colors cursor-pointer"
          >
            Skip for now
          </button>
          <div className="w-8 h-8 rounded-full bg-[#C98A3A] text-white flex items-center justify-center text-xs font-bold shadow-xs select-none tracking-wide">
            {userInitials || 'U'}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          MAIN SCROLLABLE CONTAINER (Scrolls ABOVE the bottom highlight)
      ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 sm:px-8 py-8 sm:py-10">
        <div className="max-w-[860px] w-full mx-auto space-y-6 pb-12 sm:pb-16">
          {/* Header Titles */}
          <div className="space-y-1.5">
            <span className="inline-block text-[11px] font-bold tracking-widest uppercase text-[#1F6E5B]">
              OPTIONAL · TAKES A MINUTE
            </span>
            <h1 className="text-3xl sm:text-[38px] font-serif font-normal text-[#1E2320] tracking-tight leading-tight">
              Complete your profile
            </h1>
            <p className="text-sm sm:text-[14.5px] text-[#5F6762] leading-relaxed max-w-2xl pt-0.5">
              Helps your team and partners know who they&apos;re working with. You can finish this later from your profile.
            </p>
          </div>

        {/* ═══════════════════════════════════════════════════════════
            CONTEXT SUMMARY STRIP (Company, Department, Level, Rights)
        ═══════════════════════════════════════════════════════════ */}
        {user?.role === 'INDEPENDENT_PROFESSIONAL' ? null : (
          <section className="bg-white/80 border border-[#EAE2D4] rounded-xl px-5 sm:px-6 py-4 shadow-2xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-[#F0EAE1]">
              <div className="pt-2 sm:pt-0 sm:pr-3">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#7C827D]">
                  COMPANY
                </span>
                <span className="block text-xs sm:text-[13px] font-bold text-[#1E2320] mt-0.5 truncate" title={displayCompany}>
                  {displayCompany}
                </span>
              </div>

              <div className="pt-2 sm:pt-0 sm:px-3">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#7C827D]">
                  DEPARTMENT
                </span>
                <span className="block text-xs sm:text-[13px] font-bold text-[#1E2320] mt-0.5 truncate" title={displayDepartment}>
                  {displayDepartment}
                </span>
              </div>

              <div className="pt-2 sm:pt-0 sm:px-3">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#7C827D]">
                  LEVEL
                </span>
                <span className="block text-xs sm:text-[13px] font-bold text-[#1E2320] mt-0.5 truncate" title={displayLevel}>
                  {displayLevel}
                </span>
              </div>

              <div className="pt-2 sm:pt-0 sm:pl-3">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#7C827D]">
                  RIGHTS
                </span>
                <span className="block text-xs sm:text-[13px] font-bold text-[#1E2320] mt-0.5 truncate" title={displayRights}>
                  {displayRights}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════
            CARD 1: ABOUT YOU
        ═══════════════════════════════════════════════════════════ */}
        <section className="bg-white border border-[#EAE2D4] rounded-2xl p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
          <div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-[#1E2320]">
              About you
            </h2>
            <p className="text-xs text-[#7C827D] mt-0.5">
              Shown on documents you prepare, review or approve.
            </p>
          </div>

          {/* Photo & Avatar Upload */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#E6EFE9] text-[#1F6E5B] flex items-center justify-center text-lg font-bold overflow-hidden select-none shrink-0 border border-[#D5E5DC]">
              {avatarPreview ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={avatarPreview} alt="User Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{userInitials || 'U'}</span>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <label className="inline-block">
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 active:scale-[0.99] text-xs font-semibold text-zinc-700 shadow-2xs transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-zinc-500" />
                    {photoFile || avatarPreview ? 'Change photo' : 'Upload photo'}
                  </span>
                </label>
                {(photoFile || avatarPreview) && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-xs text-red-600 hover:text-red-700 font-medium px-1.5 py-1 transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-[11px] text-[#7C827D]">
                JPG or PNG, up to 2 MB
              </p>
            </div>
          </div>

          {/* Form Fields: 2 Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {/* Country */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Country</label>
              <div className="relative">
                <select
                  value={country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-zinc-200/90 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 shadow-2xs focus:border-[#1F6E5B] focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 transition-all cursor-pointer pr-10"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {/* Mobile number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Mobile number</label>
              <div className="flex rounded-xl border border-zinc-200/90 bg-white shadow-2xs focus-within:border-[#1F6E5B] focus-within:ring-2 focus-within:ring-[#1F6E5B]/20 transition-all">
                <div className="relative flex items-center shrink-0">
                  {/* Selected Display: ONLY shows country dial code (e.g. +91) and chevron */}
                  <div className="flex items-center pl-3.5 pr-2 py-2.5 pointer-events-none select-none">
                    <span className="text-xs sm:text-sm font-medium text-zinc-800 tabular-nums">
                      {countryCode || '+91'}
                    </span>
                    <ChevronDown className="ml-1.5 w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  </div>

                  {/* Native select overlay: opens dropdown with full country name and dial code */}
                  <select
                    value={countryCode}
                    onChange={(e) => handleCountryCodeChange(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Select country dial code"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.dialCode} className="text-zinc-900 bg-white">
                        {c.name} ({c.dialCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-[1px] bg-zinc-200 my-2" />
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="98765 43210"
                  className="w-full bg-transparent px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Job title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Job title</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Quality Assurance Manager"
                className="w-full rounded-xl border border-zinc-200/90 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 shadow-2xs focus:border-[#1F6E5B] focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 transition-all"
              />
            </div>

            {/* Designation */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Designation</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Enter your designation"
                className="w-full rounded-xl border border-zinc-200/90 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 shadow-2xs focus:border-[#1F6E5B] focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 transition-all"
              />
            </div>

            {/* Highest qualification */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Highest qualification</label>
              <div className="relative">
                <select
                  value={highestQualification}
                  onChange={(e) => setHighestQualification(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-zinc-200/90 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 shadow-2xs focus:border-[#1F6E5B] focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 transition-all cursor-pointer pr-10"
                >
                  {QUALIFICATION_OPTIONS.map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {/* Years of experience */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Years of experience</label>
              <input
                type="number"
                min="0"
                step="1"
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(e.target.value)}
                placeholder="e.g. 6"
                className="w-full rounded-xl border border-zinc-200/90 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 shadow-2xs focus:border-[#1F6E5B] focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 transition-all"
              />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            CARD 2: AREAS OF EXPERTISE
        ═══════════════════════════════════════════════════════════ */}
        <section className="bg-white border border-[#EAE2D4] rounded-2xl p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
          <div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-[#1E2320]">
              Areas of expertise
            </h2>
            <p className="text-xs text-[#7C827D] mt-0.5">
              Pick all that apply. Helps Vaayath suggest the right tools and teammates.
            </p>
          </div>

          {/* Functions Pills */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-zinc-700 block">Functions</span>
            <div className="flex flex-wrap gap-2.5">
              {FUNCTION_OPTIONS.map((item) => {
                const isSelected = selectedFunctions.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleFunction(item)}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#0D4B39] text-white shadow-xs hover:bg-[#0B3F30]'
                        : 'bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Types Pills */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-semibold text-zinc-700 block">Product types</span>
            <div className="flex flex-wrap gap-2.5">
              {PRODUCT_TYPE_OPTIONS.map((item) => {
                const isSelected = selectedProductTypes.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleProductType(item)}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#0D4B39] text-white shadow-xs hover:bg-[#0B3F30]'
                        : 'bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          BOTTOM ACTION BAR (Docked highlight bar at bottom)
      ───────────────────────────────────────────────────────────── */}
      <footer className="shrink-0 z-40 bg-white border-t border-[#EAE2D4] shadow-[0_-4px_16px_rgba(0,0,0,0.03)]">
        <div className="w-full mx-auto px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between">
          <span className="text-xs sm:text-[13px] text-[#7C827D]">
            Everything here is optional.
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSkip}
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 active:scale-[0.99] text-xs sm:text-sm font-semibold text-zinc-700 shadow-2xs transition-colors cursor-pointer"
            >
              Skip for now
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveAndContinue}
              className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg bg-[#0B5441] hover:bg-[#074736] active:scale-[0.99] text-xs sm:text-sm font-semibold text-white shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save &amp; continue</span>
              )}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
