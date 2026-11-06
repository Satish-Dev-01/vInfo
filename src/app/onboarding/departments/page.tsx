'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Trash2,
  Check,
  FlaskConical,
  X,
  ArrowRight,
  RotateCcw,
  Loader2,
  Lock,
} from 'lucide-react';
import { useAppStore } from '@/stores/app.store';
import {
  DepartmentsAndLevelsResponse,
  DepartmentsAndLevelsUpdateRequest,
  PredefinedLevelDto,
} from '@/types';
import { handleUnauthorizedSession, getStoredAuthToken } from '@/lib/auth-helpers';

interface DepartmentItem {
  id: string;
  name: string;
  isCustom?: boolean;
  isActive?: boolean;
}

interface LevelItem {
  id: string;
  code: string;
  name: string;
  preparer: boolean;
  reviewer: boolean;
  approver: boolean;
  isCustom?: boolean;
}

const DEFAULT_DEPARTMENTS: DepartmentItem[] = [
  { id: 'dept-1', name: 'Quality Assurance (QA)', isCustom: false, isActive: true },
  { id: 'dept-2', name: 'Production', isCustom: false, isActive: true },
  { id: 'dept-3', name: 'Quality Control (QC)', isCustom: false, isActive: true },
  { id: 'dept-4', name: 'Warehouse', isCustom: false, isActive: true },
  { id: 'dept-5', name: 'Engineering', isCustom: false, isActive: true },
  { id: 'dept-6', name: 'Regulatory Affairs', isCustom: false, isActive: true },
  { id: 'dept-7', name: 'HR / Administration', isCustom: false, isActive: true },
  { id: 'dept-8', name: 'EHS / Safety', isCustom: false, isActive: true },
  { id: 'dept-9', name: 'IT', isCustom: false, isActive: true },
];

const DEFAULT_LEVELS: LevelItem[] = [
  { id: 'lvl-1', code: 'L1', name: 'Head of Department', preparer: true, reviewer: true, approver: true, isCustom: false },
];

export default function OnboardingDepartmentsPage() {
  const router = useRouter();
  const addNotification = useAppStore((state) => state.addNotification);

  const deptInputRef = useRef<HTMLInputElement | null>(null);
  const predefinedDefaultsRef = useRef<{
    departments: DepartmentItem[];
    levels: LevelItem[];
  }>({
    departments: DEFAULT_DEPARTMENTS,
    levels: DEFAULT_LEVELS,
  });

  // Predefined lists from backend
  const [predefinedLevels, setPredefinedLevels] = useState<PredefinedLevelDto[]>([
    {
      levelCode: 'L1',
      levelName: 'Head of Department',
      preparer: true,
      reviewer: true,
      approver: true,
      sortOrder: 1,
    },
  ]);

  // Departments state
  const [departments, setDepartments] = useState<DepartmentItem[]>(DEFAULT_DEPARTMENTS);
  const [newDeptName, setNewDeptName] = useState('');
  const [isLoadingDepts, setIsLoadingDepts] = useState(false);
  const [isAddingDept, setIsAddingDept] = useState(false);

  // Levels state
  const [levels, setLevels] = useState<LevelItem[]>(DEFAULT_LEVELS);
  const [isSaving, setIsSaving] = useState(false);
  const [userInitials, setUserInitials] = useState('U');
  const [isStep2Completed, setIsStep2Completed] = useState(false);
  const isLocked = false;
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Route guard: Access token is required, and Step 1 must be completed
  useEffect(() => {
    const checkAuthAndStep1 = async () => {
      try {
        if (typeof window !== 'undefined') {
          const token = getStoredAuthToken();
          if (!token) {
            handleUnauthorizedSession({
              router,
              redirectUrl: '/login?redirect=/onboarding/departments',
              message: 'You must be logged in with a valid access token to access departments.',
            });
            return;
          }

          const storedNextStep = localStorage.getItem('nextStep');
          const step1Done =
            localStorage.getItem('onboarding_step_1_completed') === 'true' ||
            storedNextStep === 'DEPARTMENTS_AND_LEVELS' ||
            storedNextStep === 'INVITE_TEAM' ||
            storedNextStep === 'USER_DETAILS' ||
            storedNextStep === 'DASHBOARD' ||
            storedNextStep === 'COMPLETED';
          if (!step1Done) {
            addNotification({
              type: 'warning',
              title: 'Organisation Setup Required',
              message: 'Please complete and save organisation details before configuring departments.',
            });
            router.replace('/onboarding');
            return;
          }

          const cookieNextStep =
            typeof document !== 'undefined'
              ? document.cookie
                .split('; ')
                .find((row) => row.startsWith('next_step='))
                ?.split('=')[1]
              : null;

          const cookieStep2 =
            typeof document !== 'undefined'
              ? document.cookie
                .split('; ')
                .find((row) => row.startsWith('onboarding_step_2_completed='))
                ?.split('=')[1]
              : null;

          const cookieStep3 =
            typeof document !== 'undefined'
              ? document.cookie
                .split('; ')
                .find((row) => row.startsWith('onboarding_step_3_completed='))
                ?.split('=')[1]
              : null;

          const step2Done =
            localStorage.getItem('onboarding_step_2_completed') === 'true' ||
            localStorage.getItem('onboarding_step_3_completed') === 'true' ||
            cookieStep2 === 'true' ||
            cookieStep3 === 'true' ||
            storedNextStep === 'INVITE_TEAM' ||
            storedNextStep === 'USER_DETAILS' ||
            storedNextStep === 'DASHBOARD' ||
            storedNextStep === 'COMPLETED' ||
            cookieNextStep === 'INVITE_TEAM' ||
            cookieNextStep === 'USER_DETAILS' ||
            cookieNextStep === 'DASHBOARD' ||
            cookieNextStep === 'COMPLETED';

          setIsStep2Completed(step2Done);
        }
      } catch {
        // ignore
      }
    };
    checkAuthAndStep1();
  }, [router, addNotification]);

  useEffect(() => {
    const loadUser = async () => {
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
    };
    loadUser();
  }, []);

  // Fetch live departments and levels from backend
  useEffect(() => {
    let isMounted = true;
    const fetchDepartmentsAndLevels = async () => {
      try {
        setIsLoadingDepts(true);
        const token = getStoredAuthToken();
        const res = await fetch('/api/org/departments-and-levels', {
          method: 'GET',
          headers: {
            accept: '*/*',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (res.status === 401) {
          handleUnauthorizedSession({ router });
          return;
        }

        if (res.ok && isMounted) {
          const resData = await res.json();
          const payload: DepartmentsAndLevelsResponse = resData?.data || resData;

          // 1. Process Departments: predefined standard + custom added departments
          const preDeptNames: string[] =
            Array.isArray(payload?.predefinedDepartments) && payload.predefinedDepartments.length > 0
              ? payload.predefinedDepartments
              : DEFAULT_DEPARTMENTS.filter((d) => !d.isCustom).map((d) => d.name);

          const preDepts: DepartmentItem[] = preDeptNames.map((name, idx) => ({
            id: `pre-dept-${idx + 1}`,
            name,
            isCustom: false,
            isActive: true,
          }));

          // Standard default departments not in preDeptNames can be loaded as inactive
          const preDeptNamesSet = new Set(preDeptNames.map((n) => n.trim().toLowerCase()));
          const omittedDefaultDepts: DepartmentItem[] = DEFAULT_DEPARTMENTS
            .filter((d) => !d.isCustom && !preDeptNamesSet.has(d.name.trim().toLowerCase()))
            .map((d, idx) => ({
              id: `pre-dept-inactive-${idx + 1}`,
              name: d.name,
              isCustom: false,
              isActive: false,
            }));

          const customDepts: DepartmentItem[] = (
            Array.isArray(payload?.departments) ? payload.departments : []
          ).map((d: unknown, idx: number) => {
            const item = d as Record<string, unknown> | string;
            return {
              id: typeof item === 'string' ? `custom-dept-${idx + 1}` : String(item.id || `custom-dept-${idx + 1}`),
              name: typeof item === 'string' ? item : String(item.name || ''),
              isCustom: true,
              isActive: true,
            };
          });

          // Merge without duplicate names, keeping predefined first then custom
          const existingNames = new Set<string>();
          const allDepts: DepartmentItem[] = [];

          for (const d of [...preDepts, ...omittedDefaultDepts, ...customDepts]) {
            const key = d.name.trim().toLowerCase();
            if (!existingNames.has(key)) {
              existingNames.add(key);
              allDepts.push(d);
            }
          }

          if (allDepts.length > 0) {
            setDepartments(allDepts);
            predefinedDefaultsRef.current.departments = preDepts;
          }

          // 2. Process Levels
          if (Array.isArray(payload?.predefinedLevels) && payload.predefinedLevels.length > 0) {
            setPredefinedLevels(payload.predefinedLevels);
          }

          let parsedLevels: LevelItem[] = [];
          if (Array.isArray(payload?.levels) && payload.levels.length > 0) {
            const sorted = [...payload.levels].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
            parsedLevels = sorted.map((item) => ({
              id: String(item.id ?? `lvl-${item.levelCode}`),
              code: item.levelCode,
              name: item.levelName,
              preparer: Boolean(item.preparer),
              reviewer: Boolean(item.reviewer),
              approver: Boolean(item.approver),
              isCustom: Boolean(item.isCustom),
            }));
          } else if (
            Array.isArray(payload?.predefinedLevels) &&
            payload.predefinedLevels.length > 0
          ) {
            const sorted = [...payload.predefinedLevels].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
            parsedLevels = sorted.map((item, idx) => ({
              id: `lvl-${item.levelCode || idx + 1}`,
              code: item.levelCode,
              name: item.levelName,
              preparer: Boolean(item.preparer),
              reviewer: Boolean(item.reviewer),
              approver: Boolean(item.approver),
              isCustom: false,
            }));
          }

          if (parsedLevels.length > 0) {
            setLevels(parsedLevels);
            predefinedDefaultsRef.current.levels = parsedLevels;
          }

          if (
            (payload as Record<string, unknown>)?.complete === true ||
            (resData as Record<string, unknown>)?.complete === true
          ) {
            setIsStep2Completed(true);
          }
        }
      } catch {
        // keep fallback departments and levels on error
      } finally {
        if (isMounted) setIsLoadingDepts(false);
      }
    };

    fetchDepartmentsAndLevels();
    return () => {
      isMounted = false;
    };
  }, [router]);

  // Department counts
  const defaultCount = departments.filter((d) => !d.isCustom && d.isActive !== false).length;
  const totalDefault = departments.filter((d) => !d.isCustom).length;
  const customCount = departments.filter((d) => d.isCustom).length;

  // Department handlers
  const handleToggleDepartment = (id: string) => {
    if (isLocked) return;
    setDepartments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isActive: d.isActive === false } : d))
    );
  };

  const handleAddDepartment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLocked) return;
    const trimmed = newDeptName.trim();
    if (!trimmed) {
      addNotification({
        type: 'warning',
        title: 'Department Name Required',
        message: 'Please enter a department name before clicking add.',
      });
      deptInputRef.current?.focus();
      return;
    }

    setIsAddingDept(true);
    try {
      // Check duplicate or previously disabled department
      const existing = departments.find(
        (d) => d.name.trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (existing) {
        if (existing.isActive === false) {
          setDepartments((prev) =>
            prev.map((d) => (d.id === existing.id ? { ...d, isActive: true } : d))
          );
          setNewDeptName('');
          addNotification({
            type: 'success',
            title: 'Department Re-enabled',
            message: `"${existing.name}" was re-activated in your department list.`,
          });
          return;
        }
        addNotification({
          type: 'warning',
          title: 'Department Already Exists',
          message: `"${trimmed}" is already active in your department list.`,
        });
        deptInputRef.current?.focus();
        return;
      }

      if (customCount >= 10) {
        addNotification({
          type: 'warning',
          title: 'Custom Limit Reached',
          message: 'You can add up to 10 custom departments.',
        });
        return;
      }

      const newDept: DepartmentItem = {
        id: `dept-${Date.now()}`,
        name: trimmed,
        isCustom: true,
        isActive: true,
      };
      setDepartments((prev) => [...prev, newDept]);
      setNewDeptName('');
      addNotification({
        type: 'success',
        title: 'Department Added',
        message: `Added "${trimmed}" to departments list. Click "Save & Continue" when ready to persist.`,
      });
    } finally {
      setIsAddingDept(false);
    }
  };

  const handleRemoveDepartment = (id: string) => {
    if (isLocked) return;
    setDepartments((prev) => prev.filter((d) => d.id !== id));
  };

  // Level handlers
  const handleUpdateLevelName = (id: string, name: string) => {
    if (isLocked) return;
    setLevels(levels.map((lvl) => (lvl.id === id ? { ...lvl, name } : lvl)));
  };

  const handleToggleRight = (id: string, field: 'preparer' | 'reviewer' | 'approver') => {
    if (isLocked) return;
    setLevels(
      levels.map((lvl) => (lvl.id === id ? { ...lvl, [field]: !lvl[field] } : lvl))
    );
  };

  const handleAddLevel = () => {
    if (isLocked) return;
    if (levels.length >= 20) {
      addNotification({
        type: 'warning',
        title: 'Level Limit Reached',
        message: 'You can have up to 20 levels.',
      });
      return;
    }

    const nextNumber = levels.length + 1;
    const newLvl: LevelItem = {
      id: `lvl-${Date.now()}`,
      code: `L${nextNumber}`,
      name: `Level ${nextNumber}`,
      preparer: true,
      reviewer: false,
      approver: false,
      isCustom: true,
    };

    setLevels([...levels, newLvl]);
    addNotification({
      type: 'info',
      title: 'Level Added',
      message: `Added Level L${nextNumber}.`,
    });
  };

  const handleRemoveLevel = (id: string) => {
    if (isLocked) return;
    if (levels.length <= 1) {
      addNotification({
        type: 'warning',
        title: 'Cannot Remove',
        message: 'You must have at least one level.',
      });
      return;
    }

    const filtered = levels.filter((lvl) => lvl.id !== id);
    // Renumber codes cleanly L1, L2, ...
    const renumbered = filtered.map((lvl, idx) => ({
      ...lvl,
      code: `L${idx + 1}`,
    }));
    setLevels(renumbered);
  };

  const handleResetDefaults = () => {
    if (isLocked) return;
    setLevels(predefinedDefaultsRef.current.levels.length > 0 ? predefinedDefaultsRef.current.levels : DEFAULT_LEVELS);
    setDepartments(predefinedDefaultsRef.current.departments.length > 0 ? predefinedDefaultsRef.current.departments : DEFAULT_DEPARTMENTS);
    addNotification({
      type: 'info',
      title: 'Reset Completed',
      message: 'Departments and levels have been reset to defaults.',
    });
  };

  // Save & Continue Action (triggers confirmation modal)
  const handleSaveAndContinue = () => {
    const activeDepts = departments.filter((d) => d.isActive !== false);
    if (activeDepts.length === 0) {
      addNotification({
        type: 'warning',
        title: 'Department Required',
        message: 'Please have at least one active department configured before continuing.',
      });
      return;
    }

    if (levels.length === 0) {
      addNotification({
        type: 'warning',
        title: 'Approval Level Required',
        message: 'Please have at least one approval level configured before continuing.',
      });
      return;
    }

    setShowConfirmModal(true);
  };

  // Execute API submission upon user confirmation in modal
  const executeSaveAndContinue = async () => {
    setIsSaving(true);
    try {
      const token = getStoredAuthToken();
      if (!token) {
        setShowConfirmModal(false);
        handleUnauthorizedSession({
          router,
          message: 'Your session has expired. Please log in again to save departments and levels.',
        });
        return;
      }

      const isNumeric = (str?: string | number) =>
        str !== undefined && str !== null && /^\d+$/.test(String(str));

      // Only active custom departments added by the user are sent in 'departments'
      const customDeptNames = departments
        .filter((d) => d.isCustom && d.isActive !== false)
        .map((d) => d.name);
      // Predefined departments configured/kept by user (active only)
      const preDeptNames = departments
        .filter((d) => !d.isCustom && d.isActive !== false)
        .map((d) => d.name);

      const updatePayload: DepartmentsAndLevelsUpdateRequest = {
        predefinedDepartments: preDeptNames,
        departments: customDeptNames,
        predefinedLevels:
          predefinedLevels.length > 0
            ? predefinedLevels
            : [
              {
                levelCode: 'L1',
                levelName: 'Head of Department',
                preparer: true,
                reviewer: true,
                approver: true,
                sortOrder: 1,
              },
            ],
        levels: levels.map((lvl, index) => ({
          id: isNumeric(lvl.id) ? Number(lvl.id) : 0,
          levelCode: lvl.code,
          levelName: lvl.name,
          preparer: Boolean(lvl.preparer),
          reviewer: Boolean(lvl.reviewer),
          approver: Boolean(lvl.approver),
          sortOrder: index + 1,
          isCustom: Boolean(lvl.isCustom),
        })),
        complete: true,
      };

      let res = await fetch('/api/org/departments-and-levels', {
        method: 'PUT',
        headers: {
          accept: '*/*',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });

      if (res.status === 404 || res.status === 405) {
        res = await fetch('/api/org/level-rights', {
          method: 'PUT',
          headers: {
            accept: '*/*',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ levels: updatePayload.levels }),
        });
      }

      interface SaveDeptResponse {
        success?: boolean;
        nextStep?: string;
        message?: string;
        error?: { message?: string } | string;
        data?: { nextStep?: string };
      }
      let data: SaveDeptResponse | null = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (res.ok && data?.success !== false) {
        const nextStep = data?.nextStep || data?.data?.nextStep || 'INVITE_TEAM';
        if (typeof window !== 'undefined') {
          localStorage.setItem('onboarding_step_2_completed', 'true');
          localStorage.setItem('nextStep', nextStep);
        }
        if (typeof document !== 'undefined') {
          document.cookie = `next_step=${encodeURIComponent(nextStep)}; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = 'onboarding_step_2_completed=true; path=/; max-age=604800; SameSite=Lax';
        }
        setIsStep2Completed(true);
        setShowConfirmModal(false);
        addNotification({
          type: 'success',
          title: 'Departments & Levels Saved',
          message: typeof data?.message === 'string' ? data.message : 'Hierarchy configuration saved successfully.',
        });
        if (nextStep === 'DASHBOARD' || nextStep === 'COMPLETED') {
          router.push('/dashboard');
        } else if (nextStep === 'USER_DETAILS') {
          router.push('/onboarding/user-details');
        } else {
          router.push('/onboarding/invite');
        }
      } else {
        setShowConfirmModal(false);
        if (res.status === 401) {
          handleUnauthorizedSession({
            router,
            message: 'Your session has expired. Please log in again to save changes.',
          });
          return;
        }
        const errorMsg =
          data?.message ||
          (typeof data?.error === 'object' && data?.error !== null ? data.error.message : null) ||
          (typeof data?.error === 'string' ? data.error : null) ||
          'Failed to save departments and levels. Please check your data and try again.';
        addNotification({
          type: 'error',
          title: 'Save Failed',
          message: errorMsg,
        });
        // User cannot move to next step without successful API call
      }
    } catch {
      setShowConfirmModal(false);
      addNotification({
        type: 'error',
        title: 'Connection Error',
        message: 'Could not connect to the server to save departments and levels. Please check your connection and try again.',
      });
      // User cannot move to next step without successful API call
    } finally {
      setIsSaving(false);
    }
  };

  // User explicitly skips this step to proceed to invite team
  const handleSkipStep = () => {
    if (typeof document !== 'undefined') {
      document.cookie = 'next_step=INVITE_TEAM; path=/; max-age=604800; SameSite=Lax';
      document.cookie = 'onboarding_step_2_completed=true; path=/; max-age=604800; SameSite=Lax';
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('nextStep', 'INVITE_TEAM');
      localStorage.setItem('onboarding_step_2_completed', 'true');
    }
    addNotification({
      type: 'info',
      title: 'Step Skipped',
      message: 'Departments & levels skipped. Proceeding to invite team.',
    });
    router.push('/onboarding/invite');
  };

  // User explicitly skips entire onboarding setup to dashboard
  const handleSkipSetup = () => {
    if (typeof document !== 'undefined') {
      document.cookie = 'next_step=DASHBOARD; path=/; max-age=604800; SameSite=Lax';
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('nextStep', 'DASHBOARD');
    }
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF] text-[#29251F] font-sans antialiased flex flex-col selection:bg-[#1F6E5B] selection:text-white">
      {/* ─────────────────────────────────────────────────────────────
          TOP NAVBAR WITH STEPPER
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#EAE2D4] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-[0_1px_2px_rgba(41,37,31,0.03)]">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2f8e75] to-[#1f6e5b] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <FlaskConical className="w-4 h-4 stroke-[2.3]" />
          </div>
          <span className="font-serif font-bold text-lg text-[#124a3d] tracking-tight">
            Vaayath
          </span>
        </Link>

        {/* Stepper (Center) */}
        <nav className="hidden md:flex items-center gap-3" aria-label="Onboarding Progress">
          {/* Step 1: Done (non-clickable) */}
          <div className="flex items-center gap-2 select-none cursor-default">
            <span className="w-6 h-6 rounded-full bg-[#1F6E5B] text-white flex items-center justify-center text-xs font-bold shadow-xs">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </span>
            <span className="text-xs font-semibold text-[#29251F]">
              Organisation &amp; billing
            </span>
          </div>

          <span className="w-10 h-0.5 bg-[#1F6E5B]" />

          {/* Step 2: Active */}
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#1F6E5B] text-white flex items-center justify-center text-xs font-bold ring-4 ring-[#E6EFE9]">
              2
            </span>
            <span className="text-xs font-bold text-[#1F6E5B]">
              Departments &amp; levels
            </span>
          </div>

          <span className="w-10 h-0.5 bg-[#EAE2D4]" />

          {/* Step 3: Next */}
          {isStep2Completed ? (
            <Link href="/onboarding/invite" className="flex items-center gap-2 group cursor-pointer">
              <span className="w-6 h-6 rounded-full bg-[#F2ECE1] text-[#9A9184] group-hover:bg-[#E6EFE9] group-hover:text-[#1F6E5B] flex items-center justify-center text-xs font-bold transition-colors">
                3
              </span>
              <span className="text-xs font-medium text-[#726A5D] group-hover:text-[#1F6E5B] transition-colors">
                Invite team
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-2 opacity-40 cursor-not-allowed select-none" title="Save departments and levels to unlock">
              <span className="w-6 h-6 rounded-full bg-[#F2ECE1] text-[#9A9184] flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span className="text-xs font-medium text-[#9A9184]">
                Invite team
              </span>
            </div>
          )}
        </nav>

        {/* Top Right: Skip & User Initial Badge */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleSkipSetup}
            className="text-xs font-semibold text-[#726A5D] hover:text-[#29251F] transition-colors cursor-pointer"
          >
            Skip setup
          </button>
          <div className="w-8 h-8 rounded-full bg-[#C98A3A] text-white flex items-center justify-center text-xs font-bold shadow-sm tracking-wide">
            {userInitials}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          MAIN CONTENT AREA
      ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-[920px] w-full mx-auto px-4 sm:px-8 py-8 pb-32">
        <div className="space-y-6">

          {/* Lead Title */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-block text-[11px] font-bold tracking-widest uppercase text-[#1F6E5B]">
                STEP 2 OF 3 • OPTIONAL
              </span>
            </div>
            <h1 className="text-3xl sm:text-[34px] font-serif font-bold text-[#29251F] tracking-tight leading-tight">
              Departments &amp; level rights
            </h1>
            <p className="text-sm sm:text-[14.5px] text-[#726A5D] leading-relaxed max-w-2xl">
              Mirror how your organisation works. You&apos;ll pick a department and a level for every teammate you invite.
            </p>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              CARD 1: DEPARTMENTS
          ═══════════════════════════════════════════════════════════ */}
          <section className="bg-white border border-[#EAE2D4] rounded-2xl p-6 sm:p-7 shadow-[0_1px_2px_rgba(41,37,31,0.04),0_10px_30px_rgba(41,37,31,0.04)] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-[#F2ECE1]">
              <div>
                <h2 className="text-base font-serif font-bold text-[#29251F]">
                  Departments
                </h2>
                <p className="text-xs text-[#726A5D] mt-0.5">
                  We&apos;ve added common pharma departments. Click any to exclude or restore, or add up to 10 of your own.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                <span className="text-xs text-[#9A9184] font-medium">
                  {defaultCount < totalDefault ? `${defaultCount} of ${totalDefault}` : defaultCount} default · {customCount} of 10 custom
                </span>
              </div>
            </div>

            {/* Department Tag Pills Grid / Flow */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              {isLoadingDepts && departments.length === 0 ? (
                <div className="py-3 text-xs text-[#9A9184] italic">
                  Loading departments from server...
                </div>
              ) : (
                departments.map((dept) => {
                  const isActive = dept.isActive !== false;
                  if (!dept.isCustom) {
                    // Predefined / API department: toggles between active and greyed-out on click
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => handleToggleDepartment(dept.id)}
                        className={`group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${isActive
                          ? 'bg-[#EAF3EE] text-[#14281F] border border-[#D5E5DC] hover:border-[#B7D4C3] hover:bg-[#E2EDE6]'
                          : 'bg-[#EDE8DE]/60 text-[#9A9184] border border-[#DDD6C8] opacity-65 hover:opacity-95 hover:bg-[#E6E0D3]'
                          }`}
                        title={
                          isActive
                            ? `Click to disable ${dept.name} (grey out)`
                            : `Click to restore ${dept.name}`
                        }
                      >
                        <span className={!isActive ? 'opacity-85' : ''}>{dept.name}</span>
                        {isActive ? (
                          <span className="p-0.5 rounded-full group-hover:bg-black/10 text-[#726A5D] group-hover:text-[#29251F] transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="p-0.5 rounded-full group-hover:bg-black/10 text-[#9A9184] group-hover:text-[#29251F] transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </button>
                    );
                  }

                  // Custom department added by user
                  return (
                    <div
                      key={dept.id}
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${isActive
                        ? 'bg-[#FAF2E3] text-[#7A5514] border border-[#E9DECA]'
                        : 'bg-[#EDE8DE]/60 text-[#9A9184] border border-[#DDD6C8] opacity-65 hover:opacity-95'
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleDepartment(dept.id)}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        title={isActive ? `Click to disable ${dept.name}` : `Click to restore ${dept.name}`}
                      >
                        <span>{dept.name}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveDepartment(dept.id);
                        }}
                        className="p-0.5 rounded-full hover:bg-black/10 text-[#726A5D] hover:text-[#29251F] transition-colors cursor-pointer"
                        title={`Delete ${dept.name}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Department Input Row */}
            {!isLocked && (
              <form onSubmit={handleAddDepartment} className="flex flex-col sm:flex-row items-stretch gap-2.5 pt-2">
                <input
                  ref={deptInputRef}
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="Enter department name"
                  disabled={isAddingDept}
                  className="flex-1 rounded-xl border border-[#EAE2D4] bg-[#FDFCF9] px-3.5 py-2.5 text-sm text-[#29251F] focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 focus:border-[#1F6E5B] transition-all disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={isAddingDept}
                  className="px-4 py-2.5 border border-[#EAE2D4] rounded-xl bg-[#FAF8F5] hover:bg-[#F2ECE1] text-[#1F6E5B] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isAddingDept ? 'Adding...' : 'Add department'}</span>
                </button>
              </form>
            )}
          </section>

          {/* ═══════════════════════════════════════════════════════════
              CARD 2: LEVELS & RIGHTS
          ═══════════════════════════════════════════════════════════ */}
          <section className="bg-white border border-[#EAE2D4] rounded-2xl p-6 sm:p-7 shadow-[0_1px_2px_rgba(41,37,31,0.04),0_10px_30px_rgba(41,37,31,0.04)] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-[#F2ECE1]">
              <div>
                <h2 className="text-base font-serif font-bold text-[#29251F]">
                  Levels &amp; rights
                </h2>
                <p className="text-xs text-[#726A5D] mt-0.5">
                  {isLocked
                    ? 'Finalized hierarchy and approval permissions configured for your organisation.'
                    : 'Levels decide who can prepare, review and approve work across Vaayath tools. L1 is the most senior — rename levels to match your hierarchy.'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                <span className="text-xs text-[#9A9184] font-medium">
                  {levels.length} of 20 levels
                </span>
                {isLocked && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF3E8] text-[#7A5514] border border-[#ECDDC0]">
                    <Lock className="w-2.5 h-2.5" /> Read-only
                  </span>
                )}
              </div>
            </div>

            {/* Table Header & Rows */}
            <div className="border border-[#EAE2D4] rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="max-h-[380px] sm:max-h-[440px] overflow-auto custom-scrollbar">
                <div className="min-w-[540px]">
                  {/* Header */}
                  <div
                    className={`sticky top-0 z-10 grid items-center bg-[#FBF9F4] px-4 py-2.5 text-[11px] font-bold text-[#726A5D] uppercase tracking-wider border-b border-[#EAE2D4] shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${isLocked
                      ? 'grid-cols-[56px_1fr_90px_90px_90px]'
                      : 'grid-cols-[56px_1fr_84px_84px_84px_40px]'
                      }`}
                  >
                    <div>LEVEL</div>
                    <div>LEVEL NAME</div>
                    <div className="text-center">PREPARER</div>
                    <div className="text-center">REVIEWER</div>
                    <div className="text-center">APPROVER</div>
                    {!isLocked && <div />}
                  </div>

                  {/* Rows */}
                  <div className="divide-y divide-[#F2ECE1]">
                    {levels.map((lvl) => (
                      <div
                        key={lvl.id}
                        className={`grid items-center px-4 py-3 hover:bg-[#FDFCF9] transition-colors ${isLocked
                          ? 'grid-cols-[56px_1fr_90px_90px_90px]'
                          : 'grid-cols-[56px_1fr_84px_84px_84px_40px]'
                          }`}
                      >
                        {/* Level Code Badge */}
                        <div>
                          <span className="inline-flex items-center justify-center w-8 h-7 rounded-lg bg-[#E6EFE9] text-[#124A3D] font-serif font-extrabold text-xs">
                            {lvl.code}
                          </span>
                        </div>

                        {/* Level Name */}
                        <div className="pr-3">
                          {isLocked ? (
                            <div className="text-sm text-[#29251F] font-semibold select-none truncate py-1">
                              {lvl.name}
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={lvl.name}
                              onChange={(e) => handleUpdateLevelName(lvl.id, e.target.value)}
                              className="w-full rounded-xl border border-[#EAE2D4] bg-[#FDFCF9] px-3.5 py-2 text-sm text-[#29251F] font-medium focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 focus:border-[#1F6E5B] transition-all"
                            />
                          )}
                        </div>

                        {/* Preparer Checkbox */}
                        <div className="flex justify-center">
                          {isLocked ? (
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center select-none ${lvl.preparer
                                ? 'bg-[#1F6E5B] text-white shadow-2xs'
                                : 'border border-[#D1C7B7] bg-[#FAF8F5] opacity-40'
                                }`}
                            >
                              {lvl.preparer && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleRight(lvl.id, 'preparer')}
                              className={`w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer ${lvl.preparer
                                ? 'bg-[#1F6E5B] text-white shadow-2xs'
                                : 'border-1 border-[#D1C7B7] bg-white-500 hover:border-[#1F6E5B]'
                                }`}
                            >
                              {lvl.preparer && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                          )}
                        </div>

                        {/* Reviewer Checkbox */}
                        <div className="flex justify-center">
                          {isLocked ? (
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center select-none ${lvl.reviewer
                                ? 'bg-[#1F6E5B] text-white shadow-2xs'
                                : 'border border-[#D1C7B7] bg-[#FAF8F5] opacity-40'
                                }`}
                            >
                              {lvl.reviewer && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleRight(lvl.id, 'reviewer')}
                              className={`w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer ${lvl.reviewer
                                ? 'border-1.5 border-[#D1C7B7] bg-[#1F6E5B] text-white shadow-2xs'
                                : 'border-1 border-[#D1C7B7] bg-white-500 hover:border-[#1F6E5B]'
                                }`}
                            >
                              {lvl.reviewer && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                          )}
                        </div>

                        {/* Approver Checkbox */}
                        <div className="flex justify-center">
                          {isLocked ? (
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center select-none ${lvl.approver
                                ? 'bg-[#1F6E5B] text-white shadow-2xs'
                                : 'border border-[#D1C7B7] bg-[#FAF8F5] opacity-40'
                                }`}
                            >
                              {lvl.approver && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleRight(lvl.id, 'approver')}
                              className={`w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer ${lvl.approver
                                ? 'bg-[#1F6E5B] text-white shadow-2xs'
                                : 'border-1 border-[#D1C7B7] bg-white-500 hover:border-[#1F6E5B]'
                                }`}
                            >
                              {lvl.approver && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                          )}
                        </div>

                        {/* Delete Action */}
                        {!isLocked && (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveLevel(lvl.id)}
                              className="p-1 text-[#9A9184] hover:text-red-600 transition-colors cursor-pointer"
                              title="Remove level"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Table Footer Controls */}
            {!isLocked && (
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleAddLevel}
                  className="px-4 py-2 border border-[#EAE2D4] rounded-xl bg-white hover:bg-[#FBF9F4] text-[#1F6E5B] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:border-[#1F6E5B]"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add level</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="text-xs font-semibold text-[#1F6E5B] hover:text-[#124A3D] hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to defaults</span>
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          STICKY BOTTOM ACTION BAR
      ───────────────────────────────────────────────────────────── */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EAE2D4] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <div>
          <span className="text-xs font-medium text-[#726A5D]">
            Step 2 of 3
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSkipStep}
            className="px-4 py-2 text-xs font-semibold text-[#29251F] bg-white border border-[#EAE2D4] rounded-xl hover:bg-[#FBF9F4] transition-colors cursor-pointer"
          >
            Skip for now
          </button>

          <button
            type="button"
            onClick={handleSaveAndContinue}
            disabled={isSaving}
            className="px-5 py-2 text-xs font-bold text-white bg-[#1F6E5B] hover:bg-[#164A3D] rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.99] cursor-pointer disabled:opacity-75"
          >
            {isLocked ? (
              <>
                <span>Continue to invite team</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>Save &amp; continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </footer>

      {/* ─────────────────────────────────────────────────────────────
          CONFIRMATION MODAL
      ───────────────────────────────────────────────────────────── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-[#EAE2D4] shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-[#E6EFE9] text-[#1F6E5B] border border-[#B7D4C3] flex items-center justify-center mx-auto shadow-xs">
              <Check className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#29251F]">
                Save Hierarchy Configuration?
              </h3>
              <p className="text-xs sm:text-[13px] text-[#726A5D] leading-relaxed">
                Save your active departments and approval level permissions to proceed to the next onboarding step.
              </p>
            </div>

            <div className="bg-[#FAF6EF] rounded-2xl p-4 border border-[#EAE2D4] space-y-2.5 text-xs text-[#29251F]">
              <div className="flex items-center justify-between text-[#726A5D]">
                <span>Active departments to configure:</span>
                <span className="font-bold text-[#14281F]">
                  {departments.filter((d) => d.isActive !== false).length}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#726A5D]">
                <span>Approval levels configured:</span>
                <span className="font-bold text-[#14281F]">
                  {levels.length} levels (L1 - L{levels.length})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSaving}
                className="w-full py-2.5 px-4 text-xs font-bold text-[#29251F] bg-white border border-[#EAE2D4] rounded-xl hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={executeSaveAndContinue}
                disabled={isSaving}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#1F6E5B] hover:bg-[#164A3D] rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.99] cursor-pointer disabled:opacity-75"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save &amp; continue</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

