'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Trash2,
  Check,
  Info,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '@/stores/app.store';
import { getStoredAuthToken, handleUnauthorizedSession } from '@/lib/auth-helpers';
import { DepartmentsAndLevelsResponse, OrgInvitationsRequest } from '@/types';

// ==========================================
// Types & Interfaces
// ==========================================

export interface DepartmentHeadItem {
  id: string;
  department: string;
  email: string;
  level: string;
  employmentStatus: 'Permanent' | 'Contractual' | '';
}

export interface TeamMemberItem {
  id: string;
  email: string;
  department: string;
  level: string;
  employmentStatus: 'Permanent' | 'Contractual' | '';
}

export interface LevelOption {
  code: string;
  name: string;
  label: string;
}

// ==========================================
// Initial & Default Configurations
// ==========================================

const DEFAULT_DEPARTMENTS_LIST = [
  'Quality Assurance (QA)',
  'Production',
  'Quality Control (QC)',
  'Warehouse',
  'Engineering',
  'Regulatory Affairs',
  'HR / Administration',
  'EHS / Safety',
  'IT',
  'Microbiology',
];

const DEFAULT_LEVELS_LIST: LevelOption[] = [
  { code: 'L1', name: 'Head of Department', label: 'L1 · Head of Department' },
  { code: 'L2', name: 'Manager', label: 'L2 · Manager' },
  { code: 'L3', name: 'Asst. Manager', label: 'L3 · Asst. Manager' },
  { code: 'L4', name: 'Senior Executive', label: 'L4 · Senior Executive' },
  { code: 'L5', name: 'Executive', label: 'L5 · Executive' },
];

const EMPLOYMENT_STATUS_OPTIONS: Array<'Permanent' | 'Contractual'> = [
  'Permanent',
  'Contractual',
];

// Initial prefill exactly as shown in the design
const INITIAL_DEPT_HEADS: DepartmentHeadItem[] = [
  { 
    id: 'dh-1',
    department: 'Quality Assurance (QA)',
    email: '',
    level: 'L1 · Head of Department',
    employmentStatus: 'Permanent',
  },
  {
    id: 'dh-2',
    department: 'Production',
    email: '',
    level: 'L1 · Head of Department',
    employmentStatus: 'Permanent',
  },
  {
    id: 'dh-3',
    department: 'Quality Control (QC)',
    email: '',
    level: 'L1 · Head of Department',
    employmentStatus: 'Permanent',
  },
  {
    id: 'dh-4',
    department: 'Warehouse',
    email: '',
    level: 'L1 · Head of Department',
    employmentStatus: 'Contractual',
  },
  {
    id: 'dh-5',
    department: 'Engineering',
    email: '',
    level: 'L1 · Head of Department',
    employmentStatus: '',
  },
  {
    id: 'dh-6',
    department: 'Regulatory Affairs',
    email: '',
    level: 'L1 · Head of Department',
    employmentStatus: '',
  },
  {
    id: 'dh-7',
    department: 'HR / Administration',
    email: '',
    level: 'L1 · Head of Department',
    employmentStatus: '',
  },
  {
    id: 'dh-8',
    department: 'EHS / Safety',
    email: '',
    level: 'L1 · Head of Department',
    employmentStatus: '',
  },
  {
    id: 'dh-9',
    department: 'IT',
    email: '',
    level: 'L1 · Head of Department',
    employmentStatus: '',
  },
  {
    id: 'dh-10',
    department: 'Microbiology',
    email: '',
    level: 'L1 · Head of Department',
    employmentStatus: '',
  },
];

const INITIAL_TEAM_MEMBERS: TeamMemberItem[] = [
  {
    id: 'tm-1',
    email: '',
    department: '',
    level: '',
    employmentStatus: '',
  },
];

// Email validation regex helper
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const isDeptHeadComplete = (dh: DepartmentHeadItem) =>
  dh.email.trim() !== '' &&
  isValidEmail(dh.email) &&
  dh.level.trim() !== '' &&
  dh.employmentStatus.trim() !== '';

const isTeamMemberFilled = (m: TeamMemberItem) =>
  m.email.trim() !== '' ||
  m.department.trim() !== '' ||
  m.level.trim() !== '' ||
  m.employmentStatus.trim() !== '';

const isTeamMemberComplete = (m: TeamMemberItem) =>
  m.email.trim() !== '' &&
  isValidEmail(m.email) &&
  m.department.trim() !== '' &&
  m.level.trim() !== '' &&
  m.employmentStatus.trim() !== '';

export default function OnboardingInvitePage() {
  const router = useRouter();
  const addNotification = useAppStore((state) => state.addNotification);

  const [deptHeads, setDeptHeads] = useState<DepartmentHeadItem[]>(INITIAL_DEPT_HEADS);
  const [teamMembers, setTeamMembers] = useState<TeamMemberItem[]>(INITIAL_TEAM_MEMBERS);
  const [departmentList, setDepartmentList] = useState<string[]>(DEFAULT_DEPARTMENTS_LIST);
  const [levelOptions, setLevelOptions] = useState<LevelOption[]>(DEFAULT_LEVELS_LIST);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [userInitials, setUserInitials] = useState('RM');

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (target && !target.closest('[data-dropdown]')) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch departments & level-rights if available from backend
  useEffect(() => {
    let isMounted = true;

    const fetchConfig = async () => {
      try {
        const token = getStoredAuthToken();
        if (!token) {
          handleUnauthorizedSession({
            router,
            redirectUrl: '/login?redirect=/onboarding/invite',
            message: 'You must be logged in with a valid access token to access team invitations.',
          });
          return;
        }

        const storedNextStep = typeof window !== 'undefined' ? localStorage.getItem('nextStep') : null;
        if (storedNextStep === 'DASHBOARD' || storedNextStep === 'COMPLETED') {
          router.replace('/dashboard');
          return;
        }

        const headers = {
          accept: '*/*',
          Authorization: `Bearer ${token}`,
        };

        // Fetch departments and levels in a single request
        const res = await fetch('/api/org/departments-and-levels', {
          method: 'GET',
          headers,
        });

        if (res.ok && isMounted) {
          const resData = await res.json();
          const payload: DepartmentsAndLevelsResponse = resData?.data || resData;

          // 1. Process departments: combine predefined departments and custom departments
          const preNames: string[] =
            Array.isArray(payload?.predefinedDepartments) && payload.predefinedDepartments.length > 0
              ? payload.predefinedDepartments
              : DEFAULT_DEPARTMENTS_LIST;

          const customNames: string[] =
            Array.isArray(payload?.departments)
              ? payload.departments.map((d: unknown) => {
                const item = d as Record<string, unknown> | string;
                return typeof item === 'string' ? item : String(item.name || '');
              })
              : [];

          const merged = Array.from(new Set([...preNames, ...customNames]));
          if (merged.length > 0) {
            setDepartmentList(merged);

            // Ensure dept heads have all departments
            setDeptHeads((prev) => {
              const existingMap = new Map(prev.map((h) => [h.department, h]));
              return merged.map((deptName, idx) => {
                if (existingMap.has(deptName)) {
                  const existing = existingMap.get(deptName)!;
                  return {
                    ...existing,
                    level: existing.level || 'L1 · Head of Department',
                  };
                }
                return {
                  id: `dh-${idx + 1}-${Date.now()}`,
                  department: deptName,
                  email: '',
                  level: 'L1 · Head of Department',
                  employmentStatus: '',
                };
              });
            });
          }

          // 2. Process levels
          const levelsList =
            Array.isArray(payload?.levels) && payload.levels.length > 0
              ? payload.levels
              : Array.isArray(payload?.predefinedLevels) && payload.predefinedLevels.length > 0
                ? payload.predefinedLevels
                : [];

          if (levelsList.length > 0) {
            const sorted = [...levelsList].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
            const mapped: LevelOption[] = sorted.map((lvl) => ({
              code: lvl.levelCode,
              name: lvl.levelName,
              label: `${lvl.levelCode} · ${lvl.levelName}`,
            }));
            setLevelOptions(mapped);
          }
        }
      } catch {
        // keep defaults
      }
    };

    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, [router]);

  // Load user initials
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        if (userStr) {
          const u = JSON.parse(userStr);
          const nameOrEmail = u.fullName || u.name || u.email || '';
          if (nameOrEmail) {
            const parts = nameOrEmail.trim().split(/\s+/);
            const inits =
              parts.length >= 2
                ? `${parts[0][0]}${parts[1][0]}`
                : parts[0].slice(0, 2);
            setUserInitials(inits.toUpperCase());
          }
        }
      } catch {
        // ignore
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Department heads metrics
  const completedHeadsCount = useMemo(() => {
    return deptHeads.filter(isDeptHeadComplete).length;
  }, [deptHeads]);

  // Team members metrics
  const touchedTeamMembers = useMemo(() => {
    return teamMembers.filter(isTeamMemberFilled);
  }, [teamMembers]);

  const readyTeamMembers = useMemo(() => {
    return teamMembers.filter(isTeamMemberComplete);
  }, [teamMembers]);

  const readyTeamCount = readyTeamMembers.length;
  const incompleteTouchedTeamCount = touchedTeamMembers.length - readyTeamCount;

  // Total ready invites across both sections
  const totalReady = completedHeadsCount + readyTeamCount;

  // Handlers for Department Heads
  const handleUpdateDeptHeadEmail = (id: string, email: string) => {
    setDeptHeads((prev) =>
      prev.map((dh) => (dh.id === id ? { ...dh, email } : dh))
    );
  };

  const handleUpdateDeptHeadLevel = (id: string, level: string) => {
    setDeptHeads((prev) =>
      prev.map((dh) => (dh.id === id ? { ...dh, level } : dh))
    );
    setActiveDropdown(null);
  };

  const handleUpdateDeptHeadStatus = (
    id: string,
    employmentStatus: 'Permanent' | 'Contractual' | ''
  ) => {
    setDeptHeads((prev) =>
      prev.map((dh) => (dh.id === id ? { ...dh, employmentStatus } : dh))
    );
    setActiveDropdown(null);
  };

  // Handlers for Team Members
  const handleAddTeamMember = () => {
    const newId = `tm-${Date.now()}`;
    setTeamMembers((prev) => [
      ...prev,
      {
        id: newId,
        email: '',
        department: '',
        level: '',
        employmentStatus: '',
      },
    ]);
  };

  const handleRemoveTeamMember = (id: string) => {
    if (teamMembers.length <= 1) {
      setTeamMembers([
        {
          id: `tm-${Date.now()}`,
          email: '',
          department: '',
          level: '',
          employmentStatus: '',
        },
      ]);
      return;
    }
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleUpdateTeamMemberField = (
    id: string,
    field: keyof TeamMemberItem,
    value: string
  ) => {
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleFinish = async () => {
    setHasAttemptedSubmit(true);

    // 1. Mandatory validation: Every department head must have email, level, and employment status
    const incompleteDeptHead = deptHeads.find((dh) => !isDeptHeadComplete(dh));
    if (incompleteDeptHead) {
      let missingMsg = '';
      if (!incompleteDeptHead.email.trim()) {
        missingMsg = 'email address is required';
      } else if (!isValidEmail(incompleteDeptHead.email)) {
        missingMsg = 'a valid email address format is required';
      } else if (!incompleteDeptHead.level.trim()) {
        missingMsg = 'level is required';
      } else if (!incompleteDeptHead.employmentStatus.trim()) {
        missingMsg = 'employment status is required';
      }

      addNotification({
        type: 'error',
        title: 'Department Head Details Required',
        message: `Please fill in every email, level, and employment status in the Department Heads section (${deptHeads.length - completedHeadsCount} remaining). For ${incompleteDeptHead.department}, ${missingMsg}.`,
      });
      return;
    }

    // 1b. Duplicate email check among department heads
    const headEmailMap = new Map<string, string>();
    for (const dh of deptHeads) {
      const emailLower = dh.email.trim().toLowerCase();
      if (headEmailMap.has(emailLower)) {
        addNotification({
          type: 'error',
          title: 'Duplicate Email',
          message: `Email "${dh.email}" is assigned to both "${headEmailMap.get(emailLower)}" and "${dh.department}". Each department head must have a unique email address.`,
        });
        return;
      }
      headEmailMap.set(emailLower, dh.department);
    }

    // 2. Validate team members: Team members are completely optional ("rest team will be empty or filled not issue")
    // Completely empty rows are ignored. Partially entered rows must be completed.
    const touchedMembers = teamMembers.filter(isTeamMemberFilled);
    const invalidMember = touchedMembers.find((m) => !isTeamMemberComplete(m));

    if (invalidMember) {
      addNotification({
        type: 'error',
        title: 'Incomplete Team Member',
        message:
          'Please complete all details (email, department, level, employment status) for partially entered team members, or remove the incomplete row.',
      });
      return;
    }

    setIsFinishing(true);

    try {
      const token = getStoredAuthToken();
      if (!token) {
        handleUnauthorizedSession({
          router,
          redirectUrl: '/login?redirect=/onboarding/invite',
          message: 'Your session has expired. Please log in again to send invitations.',
        });
        setIsFinishing(false);
        return;
      }

      const deptHeadsPayload = deptHeads.map((dh) => ({
        department: dh.department.trim(),
        email: dh.email.trim(),
        level: dh.level.trim() || 'L1 · Head of Department',
        employmentStatus: dh.employmentStatus.trim() || 'Permanent',
      }));

      const membersPayload = touchedMembers.map((m) => ({
        email: m.email.trim(),
        department: m.department.trim(),
        level: m.level.trim(),
        employmentStatus: m.employmentStatus.trim() || 'Permanent',
      }));

      const payload: OrgInvitationsRequest = {
        departmentHeads: deptHeadsPayload,
        members: membersPayload,
        complete: true,
      };

      const res = await fetch('/api/org/invitations', {
        method: 'POST',
        headers: {
          accept: '*/*',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const resData = await res.json().catch(() => null);
        const nextStep =
          resData?.nextStep ||
          resData?.data?.nextStep ||
          resData?.data?.data?.nextStep ||
          'DASHBOARD';

        if (typeof document !== 'undefined') {
          document.cookie = `next_step=${nextStep}; path=/; max-age=604800; SameSite=Lax`;
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('onboarding_step_3_completed', 'true');
          localStorage.setItem('nextStep', nextStep);
        }
        setShowSuccessModal(true);
        addNotification({
          type: 'success',
          title: totalReady > 0 ? 'Invitations Sent' : 'Setup Complete',
          message:
            totalReady > 0
              ? `${totalReady} teammate${totalReady === 1 ? '' : 's'} invited successfully!`
              : 'Workspace onboarding completed successfully.',
        });
      } else {
        if (res.status === 401) {
          handleUnauthorizedSession({
            router,
            redirectUrl: '/login?redirect=/onboarding/invite',
            message: 'Your session has expired. Please log in again to send invitations.',
          });
          return;
        }

        const data = await res.json().catch(() => null);
        const errMsg =
          data?.message ||
          data?.error ||
          (typeof data === 'string' ? data : null) ||
          'Failed to process team invitations.';
        addNotification({
          type: 'error',
          title: 'Invitation Failed',
          message: errMsg,
        });
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Connection Error',
        message: 'Could not connect to the server to send invitations. Please check your connection and try again.',
      });
    } finally {
      setIsFinishing(false);
    }
  };

  const handleSkip = async () => {
    try {
      const token = getStoredAuthToken();
      if (token) {
        await fetch('/api/org/invitations', {
          method: 'POST',
          headers: {
            accept: '*/*',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            departmentHeads: [],
            members: [],
            complete: true,
          }),
        }).catch(() => {
          // ignore
        });
      }
    } catch {
      // ignore
    }

    if (typeof document !== 'undefined') {
      document.cookie = 'next_step=DASHBOARD; path=/; max-age=604800; SameSite=Lax';
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboarding_step_3_completed', 'true');
      localStorage.setItem('nextStep', 'DASHBOARD');
    }
    router.push('/dashboard');
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#FAF6EF] text-[#29251F] font-sans antialiased flex flex-col selection:bg-[#1F6E5B] selection:text-white"
    >
      {/* ─────────────────────────────────────────────────────────────
          TOP NAVBAR WITH STEPPER
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#EAE2D4] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-[0_1px_2px_rgba(41,37,31,0.02)]">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-[#14281F] flex items-center justify-center text-white shadow-xs transition-transform group-hover:scale-105">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 5c0 6.5 5 13 5 13s5-6.5 5-13" />
              <path d="M12 18V8" />
            </svg>
          </div>
          <span className="font-serif font-bold text-lg text-[#14281F] tracking-tight">
            Vaayath
          </span>
        </Link>

        {/* Stepper (Center) */}
        <nav
          className="hidden md:flex items-center gap-3"
          aria-label="Onboarding Progress"
        >
          {/* Step 1: Done (non-clickable) */}
          <div className="flex items-center gap-2 select-none cursor-default">
            <span className="w-5 h-5 rounded-full bg-[#1F6E5B] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </span>
            <span className="text-xs font-semibold text-[#29251F]">
              Organisation &amp; billing
            </span>
          </div>

          <span className="w-8 h-[2px] bg-[#1F6E5B]" />

          {/* Step 2: Done (non-clickable) */}
          <div className="flex items-center gap-2 select-none cursor-default">
            <span className="w-5 h-5 rounded-full bg-[#1F6E5B] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </span>
            <span className="text-xs font-semibold text-[#29251F]">
              Departments &amp; levels
            </span>
          </div>

          <span className="w-8 h-[2px] bg-[#1F6E5B]" />

          {/* Step 3: Active */}
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full border-[1.5px] border-[#1F6E5B] bg-white text-[#1F6E5B] flex items-center justify-center text-[11px] font-bold">
              3
            </span>
            <span className="text-xs font-bold text-[#14281F]">
              Invite team
            </span>
          </div>
        </nav>

        {/* Top Right: Skip & User Initial Badge */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-semibold text-[#1F6E5B] hover:text-[#164A3D] transition-colors cursor-pointer"
          >
            Skip setup
          </button>
          <div className="w-8 h-8 rounded-full bg-[#D48D3B] text-white flex items-center justify-center text-xs font-bold shadow-xs tracking-wide">
            {userInitials}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          MAIN CONTENT AREA
      ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-[940px] w-full mx-auto px-4 sm:px-8 py-8 pb-32">
        <div className="space-y-6">
          {/* Lead Title Section */}
          <div className="space-y-1.5">
            <span className="inline-block text-[11px] font-bold tracking-widest uppercase text-[#1F6E5B]">
              STEP 3 OF 3 • TEAM INVITATIONS
            </span>
            <h1 className="text-3xl sm:text-[36px] font-serif font-bold text-[#1F2421] tracking-tight leading-tight">
              Invite your team
            </h1>
            <p className="text-sm sm:text-[14.5px] text-[#726A5D] leading-relaxed max-w-2xl">
              Start with the head of each department, then add everyone else.
              Each person gets an email with a link that fills in their invite code.
            </p>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              CARD 1: DEPARTMENT HEADS
          ═══════════════════════════════════════════════════════════ */}
          <section className="bg-white border border-[#EAE2D4] rounded-2xl p-6 sm:p-7 shadow-[0_1px_3px_rgba(41,37,31,0.03)] space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#1F2421]">
                    Department heads
                  </h2>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FAF3E8] text-[#7A5514] border border-[#ECDDC0]">
                    Required
                  </span>
                </div>
                <p className="text-xs text-[#726A5D] mt-1">
                  Every department head must have a valid email, level, and employment status.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 pt-0.5">
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold transition-colors ${
                    completedHeadsCount === deptHeads.length
                      ? 'bg-[#EAF3EE] text-[#1F6E5B]'
                      : 'bg-[#F2ECE1] text-[#726A5D]'
                  }`}
                >
                  {completedHeadsCount} of {deptHeads.length} completed
                </span>
                {completedHeadsCount === deptHeads.length && (
                  <span className="flex items-center gap-1 text-xs text-[#1F6E5B] font-semibold">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
              </div>
            </div>

            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-[200px_1fr_195px_160px] gap-2.5 text-[11px] font-bold text-[#726A5D] uppercase tracking-wider px-1">
              <div>DEPARTMENT</div>
              <div className="flex items-center gap-1">
                <span>HEAD&apos;S EMAIL</span>
                <span className="text-red-500">*</span>
              </div>
              <div className="flex items-center gap-1">
                <span>LEVEL</span>
                <span className="text-red-500">*</span>
              </div>
              <div className="flex items-center gap-1">
                <span>EMPLOYMENT STATUS</span>
                <span className="text-red-500">*</span>
              </div>
            </div>

            {/* Rows List */}
            <div className="space-y-2.5">
              {deptHeads.map((head) => {
                const isLevelOpen = activeDropdown === `dh-${head.id}-level`;
                const isStatusOpen = activeDropdown === `dh-${head.id}-status`;
                const hasActiveDropdown = isLevelOpen || isStatusOpen;

                const isEmailError =
                  hasAttemptedSubmit &&
                  (!head.email.trim() || !isValidEmail(head.email));
                const isLevelError =
                  hasAttemptedSubmit && !head.level.trim();
                const isStatusError =
                  hasAttemptedSubmit && !head.employmentStatus.trim();
                const isHeadComplete = isDeptHeadComplete(head);

                return (
                  <div
                    key={head.id}
                    className={`grid grid-cols-1 md:grid-cols-[200px_1fr_195px_160px] gap-2.5 items-start relative ${
                      hasActiveDropdown ? 'z-30' : 'z-0'
                    }`}
                  >
                    {/* Department Name */}
                    <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1F2421] pt-2 truncate">
                      {isHeadComplete && (
                        <span className="w-4 h-4 rounded-full bg-[#EAF3EE] text-[#1F6E5B] flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                      <span className="truncate">{head.department}</span>
                    </div>

                    {/* Head's Email Input */}
                    <div>
                      <input
                        type="email"
                        value={head.email}
                        onChange={(e) =>
                          handleUpdateDeptHeadEmail(head.id, e.target.value)
                        }
                        placeholder="head@company.com"
                        className={`w-full rounded-xl px-3.5 py-2 text-[13px] placeholder:text-[#9A9184] focus:outline-none transition-all ${
                          isEmailError
                            ? 'border border-red-400 bg-red-50/20 text-[#1F2421] focus:ring-1 focus:ring-red-400 focus:border-red-400'
                            : 'border border-[#EAE2D4] bg-white text-[#1F2421] focus:ring-1 focus:ring-[#1F6E5B] focus:border-[#1F6E5B]'
                        }`}
                      />
                      {isEmailError && (
                        <p className="text-[11px] text-red-500 mt-1 pl-1">
                          {!head.email.trim()
                            ? 'Email is required'
                            : 'Invalid email address'}
                        </p>
                      )}
                    </div>

                    {/* Level Dropdown */}
                    <div className="relative" data-dropdown>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveDropdown(
                            isLevelOpen ? null : `dh-${head.id}-level`
                          )
                        }
                        className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2 text-[13px] transition-all cursor-pointer text-left ${
                          isLevelOpen
                            ? 'border-[1.5px] border-[#1F6E5B] bg-white'
                            : isLevelError
                            ? 'border border-red-400 bg-red-50/20 text-red-900'
                            : 'border border-[#EAE2D4] bg-white hover:border-[#1F6E5B]/60'
                        } ${
                          head.level
                            ? 'text-[#1F2421] font-medium'
                            : 'text-[#9A9184]'
                        }`}
                      >
                        <span className="truncate">
                          {head.level || 'Select role *'}
                        </span>
                        {isLevelOpen ? (
                          <ChevronUp className="w-4 h-4 text-[#1F6E5B] shrink-0 ml-1.5 stroke-[2.2]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#9A9184] shrink-0 ml-1.5 stroke-[2]" />
                        )}
                      </button>
                      {isLevelError && (
                        <p className="text-[11px] text-red-500 mt-1 pl-1">
                          Level is required
                        </p>
                      )}

                      {/* Level Popover Menu */}
                      {isLevelOpen && (
                        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[200px] z-50 rounded-xl bg-white border border-[#EAE2D4] shadow-[0_12px_28px_rgba(41,37,31,0.09),0_2px_8px_rgba(41,37,31,0.04)] p-1.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-98 duration-100">
                          <div className="space-y-0.5">
                            {levelOptions.map((lvl) => {
                              const isSelected =
                                head.level === lvl.label ||
                                head.level === lvl.name;
                              return (
                                <button
                                  key={lvl.code}
                                  type="button"
                                  onClick={() =>
                                    handleUpdateDeptHeadLevel(
                                      head.id,
                                      lvl.label
                                    )
                                  }
                                  className={`w-full flex items-center justify-between px-3 py-2 text-[13px] text-left rounded-lg transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#EAF3EE] text-[#124A3D] font-semibold'
                                      : 'text-[#1F2421] font-normal hover:bg-[#FAF8F5]'
                                  }`}
                                >
                                  <span className="whitespace-nowrap">
                                    {lvl.label}
                                  </span>
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-[#1F6E5B] stroke-[2.8] shrink-0 ml-2" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Employment Status Dropdown */}
                    <div className="relative" data-dropdown>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveDropdown(
                            isStatusOpen ? null : `dh-${head.id}-status`
                          )
                        }
                        className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2 text-[13px] transition-all cursor-pointer text-left ${
                          isStatusOpen
                            ? 'border-[1.5px] border-[#1F6E5B] bg-white'
                            : isStatusError
                            ? 'border border-red-400 bg-red-50/20 text-red-900'
                            : 'border border-[#EAE2D4] bg-white hover:border-[#1F6E5B]/60'
                        } ${
                          head.employmentStatus
                            ? 'text-[#1F2421] font-medium'
                            : 'text-[#9A9184]'
                        }`}
                      >
                        <span className="truncate">
                          {head.employmentStatus || 'Select status *'}
                        </span>
                        {isStatusOpen ? (
                          <ChevronUp className="w-4 h-4 text-[#1F6E5B] shrink-0 ml-1.5 stroke-[2.2]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#9A9184] shrink-0 ml-1.5 stroke-[2]" />
                        )}
                      </button>
                      {isStatusError && (
                        <p className="text-[11px] text-red-500 mt-1 pl-1">
                          Status is required
                        </p>
                      )}

                      {/* Dropdown Popover */}
                      {isStatusOpen && (
                        <div className="absolute right-0 top-full mt-1.5 w-full min-w-[160px] z-50 rounded-xl bg-white border border-[#EAE2D4] shadow-[0_12px_28px_rgba(41,37,31,0.09),0_2px_8px_rgba(41,37,31,0.04)] p-1.5 animate-in fade-in zoom-in-98 duration-100">
                          <div className="space-y-0.5">
                            {EMPLOYMENT_STATUS_OPTIONS.map((status) => {
                              const isSelected = head.employmentStatus === status;
                              return (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() =>
                                    handleUpdateDeptHeadStatus(head.id, status)
                                  }
                                  className={`w-full flex items-center justify-between px-3 py-2 text-[13px] text-left rounded-lg transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#EAF3EE] text-[#124A3D] font-semibold'
                                      : 'text-[#1F2421] font-normal hover:bg-[#FAF8F5]'
                                  }`}
                                >
                                  <span>{status}</span>
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-[#1F6E5B] stroke-[2.8] shrink-0 ml-2" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              CARD 2: REST OF THE TEAM
          ═══════════════════════════════════════════════════════════ */}
          <section className="bg-white border border-[#EAE2D4] rounded-2xl p-6 sm:p-7 shadow-[0_1px_3px_rgba(41,37,31,0.03)] space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#1F2421]">
                    Rest of the team
                  </h2>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F2ECE1] text-[#726A5D]">
                    Optional
                  </span>
                </div>
                <p className="text-xs text-[#726A5D] mt-1">
                  Everyone else who should use Vaayath. Empty rows will be ignored.
                </p>
              </div>
              <span className="text-xs text-[#726A5D] font-normal shrink-0 pt-0.5">
                {readyTeamCount > 0 ? `${readyTeamCount} ready` : 'Optional'}
                {incompleteTouchedTeamCount > 0 && ` • ${incompleteTouchedTeamCount} incomplete`}
              </span>
            </div>

            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-[1fr_175px_195px_155px_32px] gap-2.5 text-[11px] font-bold text-[#726A5D] uppercase tracking-wider px-1">
              <div>EMAIL ADDRESS</div>
              <div>DEPARTMENT</div>
              <div>LEVEL</div>
              <div>EMPLOYMENT STATUS</div>
              <div />
            </div>

            {/* Rows List */}
            <div className="space-y-2.5">
              {teamMembers.map((member) => {
                const isDeptOpen = activeDropdown === `tm-${member.id}-dept`;
                const isLevelOpen = activeDropdown === `tm-${member.id}-level`;
                const isStatusOpen = activeDropdown === `tm-${member.id}-status`;
                const hasActiveDropdown =
                  isDeptOpen || isLevelOpen || isStatusOpen;

                return (
                  <div
                    key={member.id}
                    className={`grid grid-cols-1 md:grid-cols-[1fr_175px_195px_155px_32px] gap-2.5 items-center relative ${hasActiveDropdown ? 'z-30' : 'z-0'
                      }`}
                  >
                    {/* Email Input */}
                    <div>
                      <input
                        type="email"
                        value={member.email}
                        onChange={(e) =>
                          handleUpdateTeamMemberField(
                            member.id,
                            'email',
                            e.target.value
                          )
                        }
                        placeholder="colleague@company.com"
                        className="w-full rounded-xl border border-[#EAE2D4] bg-white px-3.5 py-2 text-[13px] text-[#1F2421] placeholder:text-[#9A9184] focus:outline-none focus:ring-1 focus:ring-[#1F6E5B] focus:border-[#1F6E5B] transition-all"
                      />
                    </div>

                    {/* Department Dropdown */}
                    <div className="relative" data-dropdown>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveDropdown(
                            isDeptOpen ? null : `tm-${member.id}-dept`
                          )
                        }
                        className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2 text-[13px] transition-all cursor-pointer text-left bg-white ${isDeptOpen
                          ? 'border-[1.5px] border-[#1F6E5B]'
                          : 'border border-[#EAE2D4] hover:border-[#1F6E5B]/60'
                          } ${member.department
                            ? 'text-[#1F2421] font-medium'
                            : 'text-[#9A9184]'
                          }`}
                      >
                        <span className="truncate">
                          {member.department || 'Select department'}
                        </span>
                        {isDeptOpen ? (
                          <ChevronUp className="w-4 h-4 text-[#1F6E5B] shrink-0 ml-1.5 stroke-[2.2]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#9A9184] shrink-0 ml-1.5 stroke-[2]" />
                        )}
                      </button>

                      {/* Department Popover Menu */}
                      {isDeptOpen && (
                        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[210px] z-50 rounded-xl bg-white border border-[#EAE2D4] shadow-[0_12px_28px_rgba(41,37,31,0.09),0_2px_8px_rgba(41,37,31,0.04)] p-1.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-98 duration-100">
                          <div className="space-y-0.5">
                            {departmentList.map((dept) => {
                              const isSelected = member.department === dept;
                              return (
                                <button
                                  key={dept}
                                  type="button"
                                  onClick={() => {
                                    handleUpdateTeamMemberField(
                                      member.id,
                                      'department',
                                      dept
                                    );
                                    setActiveDropdown(null);
                                  }}
                                  className={`w-full flex items-center justify-between px-3 py-2 text-[13px] text-left rounded-lg transition-colors cursor-pointer ${isSelected
                                    ? 'bg-[#EAF3EE] text-[#124A3D] font-semibold'
                                    : 'text-[#1F2421] font-normal hover:bg-[#FAF8F5]'
                                    }`}
                                >
                                  <span className="truncate">{dept}</span>
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-[#1F6E5B] stroke-[2.8] shrink-0 ml-2" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Level Dropdown */}
                    <div className="relative" data-dropdown>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveDropdown(
                            isLevelOpen ? null : `tm-${member.id}-level`
                          )
                        }
                        className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2 text-[13px] transition-all cursor-pointer text-left bg-white ${isLevelOpen
                          ? 'border-[1.5px] border-[#1F6E5B]'
                          : 'border border-[#EAE2D4] hover:border-[#1F6E5B]/60'
                          } ${member.level
                            ? 'text-[#1F2421] font-medium'
                            : 'text-[#9A9184]'
                          }`}
                      >
                        <span className="truncate">
                          {member.level || 'Select role'}
                        </span>
                        {isLevelOpen ? (
                          <ChevronUp className="w-4 h-4 text-[#1F6E5B] shrink-0 ml-1.5 stroke-[2.2]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#9A9184] shrink-0 ml-1.5 stroke-[2]" />
                        )}
                      </button>

                      {/* Level Popover Menu */}
                      {isLevelOpen && (
                        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[200px] z-50 rounded-xl bg-white border border-[#EAE2D4] shadow-[0_12px_28px_rgba(41,37,31,0.09),0_2px_8px_rgba(41,37,31,0.04)] p-1.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-98 duration-100">
                          <div className="space-y-0.5">
                            {levelOptions.map((lvl) => {
                              const isSelected =
                                member.level === lvl.label ||
                                member.level === lvl.name;
                              return (
                                <button
                                  key={lvl.code}
                                  type="button"
                                  onClick={() => {
                                    handleUpdateTeamMemberField(
                                      member.id,
                                      'level',
                                      lvl.label
                                    );
                                    setActiveDropdown(null);
                                  }}
                                  className={`w-full flex items-center justify-between px-3 py-2 text-[13px] text-left rounded-lg transition-colors cursor-pointer ${isSelected
                                    ? 'bg-[#EAF3EE] text-[#124A3D] font-semibold'
                                    : 'text-[#1F2421] font-normal hover:bg-[#FAF8F5]'
                                    }`}
                                >
                                  <span className="whitespace-nowrap">
                                    {lvl.label}
                                  </span>
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-[#1F6E5B] stroke-[2.8] shrink-0 ml-2" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Employment Status Dropdown */}
                    <div className="relative" data-dropdown>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveDropdown(
                            isStatusOpen ? null : `tm-${member.id}-status`
                          )
                        }
                        className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2 text-[13px] transition-all cursor-pointer text-left bg-white ${isStatusOpen
                          ? 'border-[1.5px] border-[#1F6E5B]'
                          : 'border border-[#EAE2D4] hover:border-[#1F6E5B]/60'
                          } ${member.employmentStatus
                            ? 'text-[#1F2421] font-medium'
                            : 'text-[#9A9184]'
                          }`}
                      >
                        <span className="truncate">
                          {member.employmentStatus || 'Select status'}
                        </span>
                        {isStatusOpen ? (
                          <ChevronUp className="w-4 h-4 text-[#1F6E5B] shrink-0 ml-1.5 stroke-[2.2]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#9A9184] shrink-0 ml-1.5 stroke-[2]" />
                        )}
                      </button>

                      {/* Employment Status Popover Menu */}
                      {isStatusOpen && (
                        <div className="absolute right-0 top-full mt-1.5 w-full min-w-[155px] z-50 rounded-xl bg-white border border-[#EAE2D4] shadow-[0_12px_28px_rgba(41,37,31,0.09),0_2px_8px_rgba(41,37,31,0.04)] p-1.5 animate-in fade-in zoom-in-98 duration-100">
                          <div className="space-y-0.5">
                            {EMPLOYMENT_STATUS_OPTIONS.map((status) => {
                              const isSelected =
                                member.employmentStatus === status;
                              return (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => {
                                    handleUpdateTeamMemberField(
                                      member.id,
                                      'employmentStatus',
                                      status
                                    );
                                    setActiveDropdown(null);
                                  }}
                                  className={`w-full flex items-center justify-between px-3 py-2 text-[13px] text-left rounded-lg transition-colors cursor-pointer ${isSelected
                                    ? 'bg-[#EAF3EE] text-[#124A3D] font-semibold'
                                    : 'text-[#1F2421] font-normal hover:bg-[#FAF8F5]'
                                    }`}
                                >
                                  <span>{status}</span>
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-[#1F6E5B] stroke-[2.8] shrink-0 ml-2" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Remove Action Button */}
                    <div className="flex justify-center items-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveTeamMember(member.id)}
                        className="p-1.5 text-[#9A9184] hover:text-red-500 transition-colors cursor-pointer rounded-lg hover:bg-[#FAF8F5]"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4 stroke-[1.8]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Another Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleAddTeamMember}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#EAE2D4] bg-white hover:bg-[#FAF8F5] text-xs font-bold text-[#1F2421] transition-all cursor-pointer shadow-2xs hover:border-[#1F6E5B]"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.8]" />
                <span>Add another</span>
              </button>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              CALLOUT BANNER: EMPLOYMENT STATUS NOTICE
          ═══════════════════════════════════════════════════════════ */}
          <div className="bg-[#FAF3E8] border border-[#ECDDC0] rounded-xl p-3.5 sm:p-4 flex items-center gap-3 text-[#7A5514]">
            <Info className="w-4 h-4 text-[#7A5514] shrink-0" />
            <p className="text-[12.5px] sm:text-xs leading-relaxed text-[#7A5514]">
              Employment status decides which mandatory trainings and requirements apply to each person — for example, ones meant only for permanent staff.
            </p>
          </div>
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          STICKY BOTTOM ACTION BAR
      ───────────────────────────────────────────────────────────── */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EAE2D4] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <div>
          <span className="text-xs font-medium text-[#726A5D]">
            Step 3 of 3
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSkip}
            className="px-4 py-2 text-xs font-semibold text-[#29251F] bg-white border border-[#EAE2D4] rounded-xl hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          >
            Skip for now
          </button>

          <button
            type="button"
            onClick={handleFinish}
            disabled={isFinishing}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#1F6E5B] hover:bg-[#164A3D] rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.99] cursor-pointer disabled:opacity-75"
          >
            {isFinishing ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </span>
            ) : totalReady > 0 ? (
              <span>
                Send {totalReady} invite{totalReady === 1 ? '' : 's'} &amp; finish
              </span>
            ) : (
              <span>Finish setup</span>
            )}
          </button>
        </div>
      </footer>

      {/* ─────────────────────────────────────────────────────────────
          SUCCESS FINISH MODAL
      ───────────────────────────────────────────────────────────── */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 border border-[#EAE2D4] shadow-2xl text-center space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-[#E6EFE9] text-[#1F6E5B] flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-bold text-[#29251F]">
                Workspace setup complete!
              </h2>
              <p className="text-xs sm:text-sm text-[#726A5D] leading-relaxed">
                Your organisation, departments, and team invites have been successfully configured. You are ready to start your first audit.
              </p>
            </div>

            <div className="bg-[#FAF6EF] rounded-2xl p-4 text-left border border-[#EAE2D4] space-y-2 text-xs text-[#29251F]">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#3E9B5F] stroke-[3]" />
                <span>Organisation details saved</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#3E9B5F] stroke-[3]" />
                <span>Department hierarchy configured</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#3E9B5F] stroke-[3]" />
                <span>
                  {totalReady} invitation email{totalReady === 1 ? '' : 's'} dispatched
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (typeof document !== 'undefined') {
                  document.cookie = 'next_step=DASHBOARD; path=/; max-age=604800; SameSite=Lax';
                }
                if (typeof window !== 'undefined') {
                  localStorage.setItem('nextStep', 'DASHBOARD');
                }
                router.push('/dashboard');
              }}
              className="w-full py-3 px-5 text-sm font-bold text-white bg-[#1F6E5B] hover:bg-[#164A3D] rounded-xl shadow-md transition-all cursor-pointer"
            >
              Enter Workspace Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
