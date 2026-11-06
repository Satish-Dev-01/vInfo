'use client';

import React, { useState } from 'react';
import {
  X,
  Check,
  ArrowRight,
  ArrowLeft,
  FileText,
  Upload,
  Trash2,
  Info,
  Pencil,
  Loader2,
  GripVertical,
  Lock,
  Plus,
  Search,
} from 'lucide-react';
import {
  INITIAL_INFOGRAPHICS,
  INITIAL_QUESTIONS,
} from '@/config/learning-data';
import { InfographicItem, QuestionBankItem } from '@/types/learning';

interface CreateModuleWizardProps {
  isOpen: boolean;
  onClose: () => void;
  initialStep?: number;
  initialTitle?: string;
  onSuccess?: () => void;
}

export function CreateModuleWizard({
  isOpen,
  onClose,
  initialStep = 1,
  initialTitle = 'Batch record review',
  onSuccess,
}: CreateModuleWizardProps) {
  // Wizard state
  const [currentStep, setCurrentStep] = useState<number>(initialStep);

  // Step 1: Module Details
  const [moduleName, setModuleName] = useState<string>(initialTitle);
  const [ownerDepartment, setOwnerDepartment] = useState<string>('Production');
  const [appliesDepartments, setAppliesDepartments] = useState<string[]>([
    'Production',
    'QA',
    'Warehouse',
  ]);
  const [isMandatory, setIsMandatory] = useState<boolean>(true);
  const [mandatoryFor, setMandatoryFor] = useState<'Permanent' | 'Contractual' | 'All'>('All');
  const [completeWithinDays, setCompleteWithinDays] = useState<string>('15');
  const [periodicRetraining, setPeriodicRetraining] = useState<boolean>(true);
  const [frequency, setFrequency] = useState<
    'Monthly' | 'Quarterly' | 'Half-yearly' | 'Annually' | 'Bi-annually'
  >('Annually');

  // Step 2: SOP Upload & Progress
  const [uploadedSop, setUploadedSop] = useState<{
    name: string;
    size: string;
    pages: string;
    tag: string;
  } | null>({
    name: 'SOP-PRD-031_Batch_Record_Review_v1.pdf',
    size: '1.8 MB',
    pages: '14 pages',
    tag: 'From request',
  });
  const [aiProgress] = useState<number>(58);

  // Step 3: AI Content
  const [aiSubTab, setAiSubTab] = useState<'infographics' | 'questions'>('infographics');
  const [selectedInfographicId, setSelectedInfographicId] = useState<number>(1);
  const [infographics, setInfographics] = useState<InfographicItem[]>(INITIAL_INFOGRAPHICS);
  const [questions, setQuestions] = useState<QuestionBankItem[]>(INITIAL_QUESTIONS);
  const [showAllQuestions, setShowAllQuestions] = useState<boolean>(false);

  // Inline editing question (Q3 pre-opened as in screenshot Image 5)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>('q3');
  const [editedQuestionText, setEditedQuestionText] = useState<string>(
    'What is the acceptable yield range for a compressed tablet batch?'
  );
  const [editedOptions, setEditedOptions] = useState<string[]>([
    '95–105%',
    '97–101%',
    '98–102%',
    '90–110%',
  ]);
  const [editedCorrectIndex, setEditedCorrectIndex] = useState<number>(1);

  // Add new question form
  const [newQuestionText, setNewQuestionText] = useState<string>('');
  const [newQuestionType, setNewQuestionType] = useState<'4 options' | 'True / False'>('4 options');
  const [newOptions, setNewOptions] = useState<string[]>(['', '', '', '']);
  const [newCorrectIndex, setNewCorrectIndex] = useState<number>(0);
  const [newIsMandatory, setNewIsMandatory] = useState<boolean>(false);

  // Step 4: Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);

  // Step 4: Reviewers & Approvers State (matching Image media_1793698122645_3ce9ddf1.jpg)
  const [reviewers, setReviewers] = useState<Array<{
    id: string;
    name: string;
    role: string;
    initials: string;
    avatarBg: string;
    avatarColor: string;
    isLocked?: boolean;
    badge?: string;
  }>>([
    {
      id: 'rev-1',
      name: 'Rahul Shetty',
      role: 'Production · L2 Manager',
      initials: 'RS',
      avatarBg: 'bg-[#DCE7F5]',
      avatarColor: 'text-[#20457C]',
    },
    {
      id: 'rev-2',
      name: 'Anita Rao',
      role: 'QA · L3 Assistant Manager',
      initials: 'AR',
      avatarBg: 'bg-[#FCEEE2]',
      avatarColor: 'text-[#8A4C1B]',
    },
    {
      id: 'rev-3',
      name: 'Vikram Desai',
      role: 'Head of Production',
      initials: 'VD',
      avatarBg: 'bg-[#E5B563]',
      avatarColor: 'text-[#3B2807]',
      isLocked: true,
      badge: 'Final reviewer',
    },
  ]);

  const [approvers, setApprovers] = useState<Array<{
    id: string;
    name: string;
    role: string;
    initials: string;
    avatarBg: string;
    avatarColor: string;
    isLocked?: boolean;
    badge?: string;
  }>>([
    {
      id: 'app-1',
      name: 'Meera Joshi',
      role: 'Head of QC',
      initials: 'MJ',
      avatarBg: 'bg-[#F5E6F5]',
      avatarColor: 'text-[#702970]',
    },
    {
      id: 'app-2',
      name: 'Priya Nair',
      role: 'QA Head',
      initials: 'PN',
      avatarBg: 'bg-[#E5B563]',
      avatarColor: 'text-[#3B2807]',
      isLocked: true,
      badge: 'Final approver',
    },
  ]);

  const [isAddApproverOpen, setIsAddApproverOpen] = useState<boolean>(true);
  const [isAddReviewerOpen, setIsAddReviewerOpen] = useState<boolean>(false);
  const [searchApproverQuery, setSearchApproverQuery] = useState<string>('');
  const [searchReviewerQuery, setSearchReviewerQuery] = useState<string>('');

  const approverCandidates = [
    {
      id: 'cand-app-1',
      name: 'Karan Sethi',
      role: 'Regulatory Affairs · L1',
      initials: 'KS',
      avatarBg: 'bg-[#DCE7F5]',
      avatarColor: 'text-[#20457C]',
    },
    {
      id: 'cand-app-2',
      name: 'R. Pillai',
      role: 'Head of Warehouse',
      initials: 'RP',
      avatarBg: 'bg-[#FCEEE2]',
      avatarColor: 'text-[#8A4C1B]',
    },
  ];

  const reviewerCandidates = [
    {
      id: 'cand-rev-1',
      name: 'Sunita Patel',
      role: 'Microbiology · L2 Lead',
      initials: 'SP',
      avatarBg: 'bg-[#E6F4EA]',
      avatarColor: 'text-[#137333]',
    },
    {
      id: 'cand-rev-2',
      name: 'Amit Verma',
      role: 'Engineering · L3 Manager',
      initials: 'AV',
      avatarBg: 'bg-[#FEF7E0]',
      avatarColor: 'text-[#B06000]',
    },
  ];

  const handleRemoveReviewer = (id: string) => {
    setReviewers((prev) => prev.filter((r) => r.id !== id || r.isLocked));
  };

  const handleRemoveApprover = (id: string) => {
    setApprovers((prev) => prev.filter((a) => a.id !== id || a.isLocked));
  };

  const handleSelectApprover = (candidate: typeof approverCandidates[0]) => {
    setApprovers((prev) => {
      if (prev.some((a) => a.id === candidate.id)) return prev;
      const locked = prev.filter((a) => a.isLocked);
      const unlocked = prev.filter((a) => !a.isLocked);
      return [...unlocked, candidate, ...locked];
    });
    setIsAddApproverOpen(false);
  };

  const handleSelectReviewer = (candidate: typeof reviewerCandidates[0]) => {
    setReviewers((prev) => {
      if (prev.some((r) => r.id === candidate.id)) return prev;
      const locked = prev.filter((r) => r.isLocked);
      const unlocked = prev.filter((r) => !r.isLocked);
      return [...unlocked, candidate, ...locked];
    });
    setIsAddReviewerOpen(false);
  };

  if (!isOpen) return null;

  // Handlers for Step 1
  const handleRemoveDepartmentTag = (dept: string) => {
    setAppliesDepartments((prev) => prev.filter((d) => d !== dept));
  };

  const handleToggleSelectAllDepartments = (checked: boolean) => {
    if (checked) {
      setAppliesDepartments([
        'Production',
        'QA',
        'Warehouse',
        'Quality Control',
        'Engineering',
        'Regulatory Affairs',
        'Microbiology',
      ]);
    } else {
      setAppliesDepartments(['Production']);
    }
  };

  // Handlers for Step 3 - Infographics
  const handleToggleInfographicVerification = (id: number) => {
    setInfographics((prev) =>
      prev.map((inf) => {
        if (inf.id === id) {
          const nextStatus = inf.status === 'Looks right' ? 'Not checked' : 'Looks right';
          return { ...inf, status: nextStatus };
        }
        return inf;
      })
    );
  };

  // Handlers for Step 3 - Questions
  const handleToggleQuestionMandatory = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, isMandatory: !q.isMandatory } : q))
    );
  };

  const handleToggleAllQuestionsMandatory = (checked: boolean) => {
    setQuestions((prev) => prev.map((q) => ({ ...q, isMandatory: checked })));
  };

  const handleSaveEditedQuestion = () => {
    if (!editingQuestionId) return;
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === editingQuestionId) {
          return {
            ...q,
            question: editedQuestionText,
            options: editedOptions,
            correctOptionIndex: editedCorrectIndex,
            isEditedByUser: true,
          };
        }
        return q;
      })
    );
    setEditingQuestionId(null);
  };

  const handleAddNewQuestion = () => {
    if (!newQuestionText.trim()) return;
    const newQ: QuestionBankItem = {
      id: `q-${Date.now()}`,
      number: questions.length + 1,
      question: newQuestionText.trim(),
      type: newQuestionType,
      isMandatory: newIsMandatory,
      options:
        newQuestionType === 'True / False'
          ? ['True', 'False']
          : newOptions.map((opt, i) => opt.trim() || `Option ${String.fromCharCode(65 + i)}`),
      correctOptionIndex: newCorrectIndex,
    };
    setQuestions((prev) => [...prev, newQ]);
    setNewQuestionText('');
    setNewOptions(['', '', '', '']);
    setNewIsMandatory(false);
  };

  // Step 4 final submit
  const handleFinalSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmittedSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    }, 900);
  };

  const selectedInfographic =
    infographics.find((item) => item.id === selectedInfographicId) || infographics[0];

  const mandatoryCount = questions.filter((q) => q.isMandatory).length;

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF7F2] flex flex-col font-sans animate-in fade-in duration-200 overflow-hidden">
      {/* ─────────────────────────────────────────────────────────────
          WIZARD TOP BAR
      ───────────────────────────────────────────────────────────── */}
      <header className="shrink-0 bg-white border-b border-[#EAE2D4] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs z-30">
        {/* Left: Close & Module Info */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#726A5D] hover:bg-[#FAF8F5] hover:text-[#1E2320] transition-colors cursor-pointer"
            aria-label="Close wizard"
          >
            <X className="w-5 h-5 stroke-[2.2]" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-[#1E2320] tracking-tight">{moduleName}</h2>
            <p className="text-[11px] text-[#726A5D]">New learning module · Draft saved just now</p>
          </div>
        </div>

        {/* Center: Stepper (Clickable) */}
        <nav className="hidden md:flex items-center gap-3 select-none" aria-label="Wizard Steps">
          {/* Step 1: Details */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="flex items-center gap-2 cursor-pointer group"
          >
            {currentStep > 1 ? (
              <span className="w-5 h-5 rounded-full bg-[#0E3D31] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            ) : (
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep === 1
                    ? 'border-[1.5px] border-[#0E3D31] bg-white text-[#0E3D31]'
                    : 'bg-[#F2ECE1] text-[#726A5D]'
                }`}
              >
                1
              </span>
            )}
            <span
              className={`text-xs font-medium transition-colors ${
                currentStep === 1 ? 'font-bold text-[#1E2320]' : 'text-[#726A5D] group-hover:text-[#1E2320]'
              }`}
            >
              Details
            </span>
          </button>

          <span className={`w-8 h-[2px] ${currentStep > 1 ? 'bg-[#0E3D31]' : 'bg-[#EAE2D4]'}`} />

          {/* Step 2: SOP */}
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className="flex items-center gap-2 cursor-pointer group"
          >
            {currentStep > 2 ? (
              <span className="w-5 h-5 rounded-full bg-[#0E3D31] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            ) : (
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep === 2
                    ? 'border-[1.5px] border-[#0E3D31] bg-white text-[#0E3D31]'
                    : 'bg-[#F2ECE1] text-[#726A5D]'
                }`}
              >
                2
              </span>
            )}
            <span
              className={`text-xs font-medium transition-colors ${
                currentStep === 2 ? 'font-bold text-[#1E2320]' : 'text-[#726A5D] group-hover:text-[#1E2320]'
              }`}
            >
              SOP
            </span>
          </button>

          <span className={`w-8 h-[2px] ${currentStep > 2 ? 'bg-[#0E3D31]' : 'bg-[#EAE2D4]'}`} />

          {/* Step 3: AI content */}
          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className="flex items-center gap-2 cursor-pointer group"
          >
            {currentStep > 3 ? (
              <span className="w-5 h-5 rounded-full bg-[#0E3D31] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            ) : (
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep === 3
                    ? 'border-[1.5px] border-[#0E3D31] bg-white text-[#0E3D31]'
                    : 'bg-[#F2ECE1] text-[#726A5D]'
                }`}
              >
                3
              </span>
            )}
            <span
              className={`text-xs font-medium transition-colors ${
                currentStep === 3 ? 'font-bold text-[#1E2320]' : 'text-[#726A5D] group-hover:text-[#1E2320]'
              }`}
            >
              AI content
            </span>
          </button>

          <span className={`w-8 h-[2px] ${currentStep > 3 ? 'bg-[#0E3D31]' : 'bg-[#EAE2D4]'}`} />

          {/* Step 4: Reviewers & approvers */}
          <button
            type="button"
            onClick={() => setCurrentStep(4)}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep === 4
                  ? 'border-[1.5px] border-[#0E3D31] bg-white text-[#0E3D31]'
                  : 'bg-[#F2ECE1] text-[#726A5D]'
              }`}
            >
              4
            </span>
            <span
              className={`text-xs font-medium transition-colors ${
                currentStep === 4 ? 'font-bold text-[#1E2320]' : 'text-[#726A5D] group-hover:text-[#1E2320]'
              }`}
            >
              Reviewers &amp; approvers
            </span>
          </button>
        </nav>

        {/* Right: Save Draft */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-[#29251F] bg-white border border-[#EAE2D4] rounded-xl hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          >
            Save draft
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          WIZARD BODY SCROLL CONTAINER
      ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* ═══════════════════════════════════════════════════════════
            STEP 1: MODULE DETAILS (Image 2)
        ═══════════════════════════════════════════════════════════ */}
        {currentStep === 1 && (
          <div className="max-w-[760px] w-full mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-6">
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-[34px] font-serif font-normal text-[#1E2320] tracking-tight">
                Module details
              </h1>
              <p className="text-sm text-[#726A5D]">
                Who the training is for and when it&apos;s due.
              </p>
            </div>

            {/* Blue Info Notice */}
            <div className="flex items-start gap-2.5 p-3.5 sm:p-4 rounded-xl bg-[#EEF2FF] border border-[#E0E7FF] text-[#3730A3]">
              <Info className="w-4 h-4 text-[#4F46E5] shrink-0 mt-0.5" />
              <p className="text-xs sm:text-[13px] leading-relaxed">
                Pre-filled from Vikram Desai&apos;s request (REQ-0042, 13 Oct). Check everything and edit what you need.
              </p>
            </div>

            {/* Form Fields Card */}
            <div className="space-y-5">
              {/* Module Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1E2320]">Module name</label>
                <input
                  type="text"
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  className="w-full rounded-xl border border-[#EAE2D4] bg-white px-3.5 py-2.5 text-sm text-[#1E2320] placeholder:text-[#9A9184] focus:outline-none focus:ring-1 focus:ring-[#1F6E5B] focus:border-[#1F6E5B] transition-all"
                  placeholder="Enter module name"
                />
              </div>

              {/* Owner Department & Applies to departments */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Owner department */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1E2320]">Owner department</label>
                  <select
                    value={ownerDepartment}
                    onChange={(e) => setOwnerDepartment(e.target.value)}
                    className="w-full rounded-xl border border-[#EAE2D4] bg-white px-3.5 py-2.5 text-sm text-[#1E2320] focus:outline-none focus:ring-1 focus:ring-[#1F6E5B] focus:border-[#1F6E5B] transition-all cursor-pointer"
                  >
                    <option value="Production">Production</option>
                    <option value="Quality Assurance (QA)">Quality Assurance (QA)</option>
                    <option value="Quality Control (QC)">Quality Control (QC)</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Regulatory Affairs">Regulatory Affairs</option>
                  </select>
                  <span className="block text-[11px] text-[#726A5D]">
                    One department owns the module.
                  </span>
                </div>

                {/* Applies to departments */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1E2320]">Applies to departments</label>
                  <div className="min-h-[44px] flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl border border-[#EAE2D4] bg-white">
                    {appliesDepartments.map((dept) => (
                      <span
                        key={dept}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#EAE2D4] text-xs font-medium text-[#1E2320]"
                      >
                        <span>{dept}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDepartmentTag(dept)}
                          className="hover:text-red-500 cursor-pointer"
                        >
                          <X className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="pt-1">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-[#726A5D]">
                      <input
                        type="checkbox"
                        checked={appliesDepartments.length >= 6}
                        onChange={(e) => handleToggleSelectAllDepartments(e.target.checked)}
                        className="rounded border-[#D8CEBE] text-[#1F6E5B] focus:ring-[#1F6E5B] cursor-pointer"
                      />
                      <span>Select all departments</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Is this training mandatory? */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-[#1E2320]">
                  Is this training mandatory?
                </label>
                <div className="inline-flex p-1 rounded-xl bg-[#F0EAE1] border border-[#EAE2D4]">
                  <button
                    type="button"
                    onClick={() => setIsMandatory(true)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isMandatory
                        ? 'bg-white text-[#1E2320] shadow-xs'
                        : 'text-[#726A5D] hover:text-[#1E2320]'
                    }`}
                  >
                    Mandatory
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMandatory(false)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      !isMandatory
                        ? 'bg-white text-[#1E2320] shadow-xs'
                        : 'text-[#726A5D] hover:text-[#1E2320]'
                    }`}
                  >
                    Optional
                  </button>
                </div>
              </div>

              {/* Embedded Mandatory Card Settings */}
              {isMandatory && (
                <div className="bg-[#FAF8F5] rounded-2xl p-5 sm:p-6 border border-[#EAE2D4] space-y-5 animate-in fade-in">
                  {/* Mandatory for */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#1E2320]">Mandatory for</label>
                    <div className="flex flex-wrap items-center gap-5 text-xs text-[#1E2320]">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="mandatoryFor"
                          checked={mandatoryFor === 'Permanent'}
                          onChange={() => setMandatoryFor('Permanent')}
                          className="text-[#1F6E5B] focus:ring-[#1F6E5B]"
                        />
                        <span>Permanent employees</span>
                      </label>

                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="mandatoryFor"
                          checked={mandatoryFor === 'Contractual'}
                          onChange={() => setMandatoryFor('Contractual')}
                          className="text-[#1F6E5B] focus:ring-[#1F6E5B]"
                        />
                        <span>Contractual employees</span>
                      </label>

                      <label className="inline-flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="radio"
                          name="mandatoryFor"
                          checked={mandatoryFor === 'All'}
                          onChange={() => setMandatoryFor('All')}
                          className="text-[#1F6E5B] focus:ring-[#1F6E5B]"
                        />
                        <span>All</span>
                      </label>
                    </div>
                  </div>

                  {/* Complete within & Periodic re-training */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                    {/* Complete within */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#1E2320]">Complete within</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={completeWithinDays}
                          onChange={(e) => setCompleteWithinDays(e.target.value)}
                          className="w-20 rounded-xl border border-[#EAE2D4] bg-white px-3 py-2 text-sm text-center font-bold text-[#1E2320] focus:outline-none focus:ring-1 focus:ring-[#1F6E5B]"
                        />
                        <span className="text-xs text-[#726A5D]">days after approval</span>
                      </div>
                      <span className="block text-[11px] text-[#726A5D]">
                        New joiners get the same window from their registration date.
                      </span>
                    </div>

                    {/* Periodic re-training */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#1E2320]">
                        Periodic re-training
                      </label>
                      <div className="inline-flex p-1 rounded-xl bg-[#F0EAE1] border border-[#EAE2D4]">
                        <button
                          type="button"
                          onClick={() => setPeriodicRetraining(true)}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            periodicRetraining
                              ? 'bg-white text-[#1E2320] shadow-xs'
                              : 'text-[#726A5D]'
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setPeriodicRetraining(false)}
                          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            !periodicRetraining
                              ? 'bg-white text-[#1E2320] shadow-xs'
                              : 'text-[#726A5D]'
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Frequency */}
                  {periodicRetraining && (
                    <div className="space-y-2 pt-2 border-t border-[#EAE2D4]/60">
                      <label className="block text-xs font-bold text-[#1E2320]">Frequency</label>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#1E2320]">
                        {(
                          ['Monthly', 'Quarterly', 'Half-yearly', 'Annually', 'Bi-annually'] as const
                        ).map((freq) => (
                          <label
                            key={freq}
                            className={`inline-flex items-center gap-2 cursor-pointer ${
                              frequency === freq ? 'font-bold' : ''
                            }`}
                          >
                            <input
                              type="radio"
                              name="frequency"
                              checked={frequency === freq}
                              onChange={() => setFrequency(freq)}
                              className="text-[#1F6E5B] focus:ring-[#1F6E5B]"
                            />
                            <span>{freq}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            STEP 2: UPLOAD THE SOP (Image 3)
        ═══════════════════════════════════════════════════════════ */}
        {currentStep === 2 && (
          <div className="max-w-[760px] w-full mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-6">
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-[34px] font-serif font-normal text-[#1E2320] tracking-tight">
                Upload the SOP
              </h1>
              <p className="text-sm text-[#726A5D]">
                Vaayath reads the SOP and drafts infographics and a question bank for you to check.
              </p>
            </div>

            {/* Uploaded File Card */}
            {uploadedSop && (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-[#EAE2D4] shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs shrink-0 border border-red-100">
                    PDF
                  </div>
                  <div>
                    <p className="text-xs sm:text-[13px] font-bold text-[#1E2320] truncate">
                      {uploadedSop.name}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-[#726A5D] mt-0.5">
                      <span>{uploadedSop.size}</span>
                      <span>·</span>
                      <span>{uploadedSop.pages}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-[#1F6E5B] bg-[#EAF3EE] px-2.5 py-1 rounded-full border border-[#D5EADB]">
                    {uploadedSop.tag}
                  </span>
                  <button
                    type="button"
                    onClick={() => setUploadedSop(null)}
                    className="p-1.5 text-[#9A9184] hover:text-red-600 transition-colors cursor-pointer"
                    title="Remove SOP"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Dotted Upload Dropzone */}
            <div
              onClick={() => {
                setUploadedSop({
                  name: 'SOP-PRD-031_Batch_Record_Review_v1.pdf',
                  size: '1.8 MB',
                  pages: '14 pages',
                  tag: 'From request',
                });
              }}
              className="border-2 border-dashed border-[#D8CEBE] hover:border-[#1F6E5B] rounded-2xl p-8 text-center cursor-pointer transition-all bg-white/50 hover:bg-white space-y-2"
            >
              <div className="w-9 h-9 rounded-full bg-[#FAF8F5] text-[#1F6E5B] flex items-center justify-center mx-auto">
                <Upload className="w-4 h-4 stroke-[2.2]" />
              </div>
              <p className="text-xs sm:text-[13px] font-bold text-[#1E2320]">
                Add another SOP or drag it here
              </p>
              <p className="text-[11px] text-[#726A5D]">PDF or Word · up to 25 MB</p>
            </div>

            {/* AI Progress Generation Card */}
            <div className="p-6 rounded-2xl bg-white border border-[#EAE2D4] shadow-2xs space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#1E2320]">Generating learning content</h3>
                  <p className="text-xs text-[#726A5D] mt-0.5">
                    About 2 minutes. You can leave this page — we&apos;ll notify you when it&apos;s ready.
                  </p>
                </div>
                <span className="text-sm font-bold text-[#1F6E5B]">{aiProgress}%</span>
              </div>

              {/* Progress Bar Track */}
              <div className="w-full h-1.5 bg-[#EAE2D4] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1F6E5B] rounded-full transition-all duration-500"
                  style={{ width: `${aiProgress}%` }}
                />
              </div>

              {/* Step Checklist */}
              <div className="space-y-3 pt-2 text-xs text-[#1E2320]">
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-[#1F6E5B] text-white flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Read SOP — 14 pages, 9 procedure steps found</span>
                </div>

                <div className="flex items-center gap-2.5 font-bold text-[#1F6E5B]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#1F6E5B] shrink-0" />
                  <span>Drafting infographics</span>
                </div>

                <div className="flex items-center gap-2.5 text-[#9A9184]">
                  <div className="w-4 h-4 rounded-full border border-[#D8CEBE] shrink-0" />
                  <span>Writing question bank</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            STEP 3: AI CONTENT (Images 4 & 5)
        ═══════════════════════════════════════════════════════════ */}
        {currentStep === 3 && (
          <div className="max-w-[1080px] w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-[34px] font-serif font-normal text-[#1E2320] tracking-tight">
                  Check the AI-generated content
                </h1>
                <p className="text-sm text-[#726A5D]">
                  {aiSubTab === 'infographics'
                    ? 'Generated from SOP-PRD-031. Make sure it matches the SOP before it goes for review.'
                    : 'Edit any question, add your own, and mark which ones every trainee must answer.'}
                </p>
              </div>

              <span className="text-[11px] font-semibold text-[#5A625D] bg-[#F2ECE1] px-3 py-1 rounded-full shrink-0">
                AI-generated · needs your check
              </span>
            </div>

            {/* Sub-tabs: Infographics 3 vs Question bank 12 */}
            <div className="flex items-center gap-8 border-b border-[#EAE2D4]">
              <button
                type="button"
                onClick={() => setAiSubTab('infographics')}
                className={`pb-3 text-xs sm:text-[13px] font-bold transition-all relative cursor-pointer ${
                  aiSubTab === 'infographics'
                    ? 'text-[#1F6E5B]'
                    : 'text-[#726A5D] hover:text-[#1E2320]'
                }`}
              >
                <span>Infographics</span>
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-[#EAF3EE] text-[#1F6E5B]">
                  {infographics.length}
                </span>
                {aiSubTab === 'infographics' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1F6E5B]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setAiSubTab('questions')}
                className={`pb-3 text-xs sm:text-[13px] font-bold transition-all relative cursor-pointer ${
                  aiSubTab === 'questions'
                    ? 'text-[#1F6E5B]'
                    : 'text-[#726A5D] hover:text-[#1E2320]'
                }`}
              >
                <span>Question bank</span>
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-[#EAF3EE] text-[#1F6E5B]">
                  {questions.length}
                </span>
                {aiSubTab === 'questions' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1F6E5B]" />
                )}
              </button>
            </div>

            {/* TAB 1: INFOGRAPHICS (Image 4) */}
            {aiSubTab === 'infographics' && (
              <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr_240px] gap-5 items-start">
                {/* Left Column: Thumbnail cards */}
                <div className="space-y-3">
                  {infographics.map((item) => {
                    const isSelected = selectedInfographicId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedInfographicId(item.id)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#1F6E5B] ring-2 ring-[#1F6E5B]/20 bg-white shadow-xs'
                            : 'border-[#EAE2D4] bg-white/70 hover:bg-white hover:border-[#1F6E5B]/50'
                        }`}
                      >
                        {/* Mini Graphic Box */}
                        <div
                          className={`w-full h-16 rounded-lg mb-2 flex items-center justify-center ${
                            item.id === 1
                              ? 'bg-[#0E3D31] text-[#E5B563]'
                              : item.id === 2
                              ? 'bg-gradient-to-r from-[#D7EBE4] to-[#FCE7E7]'
                              : 'bg-[#FEF3C7]'
                          }`}
                        >
                          {item.id === 1 ? (
                            <div className="flex gap-1">
                              <span className="w-2 h-2 rounded-full bg-[#E5B563]" />
                              <span className="w-2 h-2 rounded-full bg-[#E5B563]" />
                              <span className="w-2 h-2 rounded-full bg-[#E5B563]" />
                            </div>
                          ) : item.id === 2 ? (
                            <span className="text-[10px] font-bold text-[#1E2320]">DO &amp; DON&apos;T</span>
                          ) : (
                            <span className="text-[10px] font-bold text-[#B45309]">CHECKS</span>
                          )}
                        </div>
                        <p className="text-[11px] font-bold text-[#1E2320] truncate">
                          {item.id}. {item.title}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Center Column: Full Infographic Display */}
                <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAE2D4] shadow-xs space-y-6">
                  {/* Top Bar inside Infographic */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-widest uppercase text-[#1F6E5B]">
                      SOP/PRD/031
                    </span>
                    <span className="text-xs text-[#726A5D]">
                      Infographic {selectedInfographic.id} of {infographics.length}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-serif font-bold text-[#1E2320] leading-snug">
                    {selectedInfographic.subtitle}
                  </h2>

                  {/* Steps Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedInfographic.steps.map((st) => (
                      <div
                        key={st.number}
                        className={`p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE2D4] space-y-2 ${
                          st.number === 5 ? 'sm:col-span-2' : ''
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full bg-[#0E3D31] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                          {st.number}
                        </div>
                        <h4 className="text-xs font-bold text-[#1E2320]">{st.title}</h4>
                        <p className="text-xs text-[#726A5D] leading-relaxed">{st.description}</p>
                      </div>
                    ))}
                  </div>

                  {/* Footer Source */}
                  <div className="pt-2 text-[11px] text-[#726A5D] flex items-center gap-1.5 border-t border-[#F2ECE1]">
                    <Info className="w-3.5 h-3.5" />
                    <span>Source: sections 5.1–5.9 of the SOP</span>
                  </div>
                </div>

                {/* Right Column: Verification Action Panel */}
                <div className="p-5 rounded-2xl bg-white border border-[#EAE2D4] shadow-2xs space-y-5">
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold text-[#1E2320]">Is this infographic right?</h3>
                    <p className="text-[11px] text-[#726A5D] leading-relaxed">
                      Compare it with the SOP. If something is wrong, report it — our team corrects infographics and sends them back.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleToggleInfographicVerification(selectedInfographic.id)}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        selectedInfographic.status === 'Looks right'
                          ? 'bg-[#1F6E5B] text-white shadow-xs'
                          : 'bg-[#0E3D31] hover:bg-[#165544] text-white shadow-xs'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>
                        {selectedInfographic.status === 'Looks right'
                          ? 'Looks right ✓'
                          : 'Looks right'}
                      </span>
                    </button>

                    <button
                      type="button"
                      className="w-full py-2 px-3 rounded-xl border border-[#EAE2D4] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#1E2320] transition-colors cursor-pointer"
                    >
                      Report an issue to Vaayath
                    </button>
                  </div>

                  {/* Progress Checklist */}
                  <div className="pt-2 border-t border-[#F2ECE1] space-y-2 text-xs">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[#726A5D]">
                      Progress
                    </span>
                    {infographics.map((inf) => (
                      <div key={inf.id} className="flex items-center justify-between text-xs">
                        <span className="text-[#1E2320]">Infographic {inf.id}</span>
                        <span
                          className={`font-semibold ${
                            inf.status === 'Looks right' ? 'text-[#1F6E5B]' : 'text-[#9A9184]'
                          }`}
                        >
                          {inf.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Open SOP Side by Side */}
                  <div className="pt-2 border-t border-[#F2ECE1]">
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#1F6E5B] hover:underline cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Open SOP side by side</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: QUESTION BANK (Image 5) */}
            {aiSubTab === 'questions' && (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
                {/* Left: Questions List */}
                <div className="p-6 rounded-2xl bg-white border border-[#EAE2D4] shadow-xs space-y-4">
                  {/* Header of Questions List */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE1]">
                    <span className="text-xs font-bold text-[#1E2320]">
                      {questions.length} questions · {mandatoryCount} marked mandatory
                    </span>

                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-[#726A5D]">
                      <input
                        type="checkbox"
                        checked={mandatoryCount === questions.length}
                        onChange={(e) => handleToggleAllQuestionsMandatory(e.target.checked)}
                        className="rounded border-[#D8CEBE] text-[#1F6E5B] focus:ring-[#1F6E5B] cursor-pointer"
                      />
                      <span>Mark all mandatory</span>
                    </label>
                  </div>

                  {/* Questions */}
                  <div className="space-y-3">
                    {(showAllQuestions ? questions : questions.slice(0, 7)).map((q) => {
                      const isEditing = editingQuestionId === q.id;

                      if (isEditing) {
                        return (
                          /* Expanded Edit Box (Q3 in screenshot Image 5) */
                          <div
                            key={q.id}
                            className="p-4 rounded-xl border-2 border-[#1F6E5B] bg-white space-y-4 shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#1F6E5B]">
                                Editing Q{q.number}
                              </span>
                              <span className="text-[10px] font-bold text-[#1F6E5B] bg-[#EAF3EE] px-2 py-0.5 rounded-full">
                                Edited by you
                              </span>
                            </div>

                            <input
                              type="text"
                              value={editedQuestionText}
                              onChange={(e) => setEditedQuestionText(e.target.value)}
                              className="w-full rounded-xl border border-[#EAE2D4] p-3 text-xs sm:text-sm font-medium text-[#1E2320] focus:outline-none focus:border-[#1F6E5B]"
                            />

                            {/* 2x2 Options Grid */}
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              {editedOptions.map((opt, optIndex) => (
                                <label
                                  key={optIndex}
                                  className="flex items-center gap-2 p-2.5 rounded-lg border border-[#EAE2D4] bg-[#FAF8F5] cursor-pointer hover:border-[#1F6E5B]/60"
                                >
                                  <input
                                    type="radio"
                                    name={`edited-opt-${q.id}`}
                                    checked={editedCorrectIndex === optIndex}
                                    onChange={() => setEditedCorrectIndex(optIndex)}
                                    className="text-[#1F6E5B] focus:ring-[#1F6E5B]"
                                  />
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const updated = [...editedOptions];
                                      updated[optIndex] = e.target.value;
                                      setEditedOptions(updated);
                                    }}
                                    className="w-full bg-transparent text-xs font-medium focus:outline-none"
                                  />
                                </label>
                              ))}
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[11px] text-[#726A5D]">
                                Select the radio next to the correct answer
                              </span>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingQuestionId(null)}
                                  className="px-3 py-1.5 text-xs font-semibold text-[#726A5D] hover:text-[#1E2320] cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSaveEditedQuestion}
                                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#0E3D31] hover:bg-[#165544] rounded-xl shadow-xs transition-colors cursor-pointer"
                                >
                                  Save question
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        /* Standard Question Row */
                        <div
                          key={q.id}
                          className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-[#FAF8F5] transition-colors border border-transparent hover:border-[#EAE2D4]"
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <span className="text-xs font-bold text-[#726A5D] shrink-0 pt-0.5">
                              Q{q.number}
                            </span>
                            <p className="text-xs text-[#1E2320] leading-relaxed truncate sm:text-wrap">
                              {q.question}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[10px] font-semibold text-[#726A5D] bg-[#F2ECE1] px-2 py-0.5 rounded-md">
                              {q.type}
                            </span>

                            <label className="inline-flex items-center gap-1.5 text-xs text-[#1E2320] cursor-pointer">
                              <input
                                type="checkbox"
                                checked={q.isMandatory}
                                onChange={() => handleToggleQuestionMandatory(q.id)}
                                className="rounded border-[#D8CEBE] text-[#1F6E5B] focus:ring-[#1F6E5B] cursor-pointer"
                              />
                              <span className="text-[11px] font-medium">Mandatory</span>
                            </label>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingQuestionId(q.id);
                                setEditedQuestionText(q.question);
                                if (q.options) setEditedOptions(q.options);
                                if (typeof q.correctOptionIndex === 'number')
                                  setEditedCorrectIndex(q.correctOptionIndex);
                              }}
                              className="p-1 text-[#9A9184] hover:text-[#1E2320] cursor-pointer"
                              title="Edit question"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* + More Questions Expand Button */}
                  {!showAllQuestions && questions.length > 7 && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAllQuestions(true)}
                        className="text-xs font-semibold text-[#1F6E5B] hover:underline cursor-pointer"
                      >
                        + {questions.length - 7} more questions
                      </button>
                    </div>
                  )}
                </div>

                {/* Right: Add a Question Form */}
                <div className="p-5 rounded-2xl bg-white border border-[#EAE2D4] shadow-2xs space-y-4">
                  <h3 className="text-xs font-bold text-[#1E2320]">Add a question</h3>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-[#726A5D]">Question</label>
                    <input
                      type="text"
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="Type the question"
                      className="w-full rounded-xl border border-[#EAE2D4] p-2.5 text-xs text-[#1E2320] focus:outline-none focus:border-[#1F6E5B]"
                    />
                  </div>

                  {/* Answer Type Toggle */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-[#726A5D]">Answer type</label>
                    <div className="flex rounded-xl bg-[#F0EAE1] p-1 border border-[#EAE2D4]">
                      <button
                        type="button"
                        onClick={() => setNewQuestionType('4 options')}
                        className={`flex-1 py-1 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          newQuestionType === '4 options'
                            ? 'bg-white text-[#1E2320] shadow-xs'
                            : 'text-[#726A5D]'
                        }`}
                      >
                        4 options
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewQuestionType('True / False')}
                        className={`flex-1 py-1 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          newQuestionType === 'True / False'
                            ? 'bg-white text-[#1E2320] shadow-xs'
                            : 'text-[#726A5D]'
                        }`}
                      >
                        True / False
                      </button>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-[#726A5D]">
                      Options · select the correct one
                    </label>
                    {newQuestionType === '4 options' ? (
                      ['Option A', 'Option B', 'Option C', 'Option D'].map((optLabel, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 rounded-xl border border-[#EAE2D4] bg-[#FAF8F5]"
                        >
                          <input
                            type="radio"
                            name="new-correct-opt"
                            checked={newCorrectIndex === idx}
                            onChange={() => setNewCorrectIndex(idx)}
                            className="text-[#1F6E5B] focus:ring-[#1F6E5B]"
                          />
                          <input
                            type="text"
                            value={newOptions[idx]}
                            onChange={(e) => {
                              const updated = [...newOptions];
                              updated[idx] = e.target.value;
                              setNewOptions(updated);
                            }}
                            placeholder={optLabel}
                            className="w-full bg-transparent text-xs text-[#1E2320] focus:outline-none"
                          />
                        </div>
                      ))
                    ) : (
                      ['True', 'False'].map((label, idx) => (
                        <label
                          key={label}
                          className="flex items-center gap-2 p-2.5 rounded-xl border border-[#EAE2D4] bg-[#FAF8F5] cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="new-tf-opt"
                            checked={newCorrectIndex === idx}
                            onChange={() => setNewCorrectIndex(idx)}
                            className="text-[#1F6E5B] focus:ring-[#1F6E5B]"
                          />
                          <span className="text-xs font-bold text-[#1E2320]">{label}</span>
                        </label>
                      ))
                    )}
                  </div>

                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-[#1E2320]">
                    <input
                      type="checkbox"
                      checked={newIsMandatory}
                      onChange={(e) => setNewIsMandatory(e.target.checked)}
                      className="rounded border-[#D8CEBE] text-[#1F6E5B] focus:ring-[#1F6E5B]"
                    />
                    <span>Mandatory for every trainee</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleAddNewQuestion}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#0E3D31] hover:bg-[#165544] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    + Add to question bank
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            STEP 4: REVIEWERS & APPROVERS (Matching Image media_1793698122645_3ce9ddf1.jpg)
        ═══════════════════════════════════════════════════════════ */}
        {currentStep === 4 && (
          <div className="max-w-[960px] w-full mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-6">
            {/* Header */}
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-[34px] font-serif font-normal text-[#1E2320] tracking-tight">
                Who reviews and approves?
              </h1>
              <p className="text-xs sm:text-[13px] text-[#726A5D] leading-relaxed">
                The module moves through each person in order. Drag to reorder. Your Department Head and QA Head always sign off last.
              </p>
            </div>

            {/* Two Columns Grid: Reviewers & Approvers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              {/* ── LEFT COLUMN: REVIEWERS ── */}
              <div className="p-5 rounded-2xl bg-white border border-[#EAE2D4] shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-1">
                  <h3 className="text-sm font-bold text-[#1E2320]">Reviewers</h3>
                  <span className="text-xs text-[#726A5D]">{reviewers.length} of 5</span>
                </div>

                {/* Reviewers List */}
                <div className="space-y-2.5">
                  {reviewers.map((item, index) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        item.isLocked
                          ? 'bg-[#F9F7F2] border-[#EAE2D4]'
                          : 'bg-white border-[#EAE2D4] hover:border-[#1F6E5B]/40 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Drag Handle or Lock */}
                        {item.isLocked ? (
                          <Lock className="w-3.5 h-3.5 text-[#726A5D] shrink-0" />
                        ) : (
                          <GripVertical className="w-3.5 h-3.5 text-[#9A9184] hover:text-[#1E2320] cursor-grab shrink-0" />
                        )}

                        {/* Sequence Number */}
                        <div className="relative flex flex-col items-center">
                          {index > 0 && (
                            <span className="absolute -top-3.5 w-[1.5px] h-3.5 bg-[#EAE2D4]" />
                          )}
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 z-10 ${
                              item.isLocked
                                ? 'bg-[#0E3D31] text-white'
                                : 'bg-[#EAF5F1] text-[#165B4C]'
                            }`}
                          >
                            {index + 1}
                          </div>
                          {index < reviewers.length - 1 && (
                            <span className="absolute -bottom-3.5 w-[1.5px] h-3.5 bg-[#EAE2D4]" />
                          )}
                        </div>

                        {/* Avatar */}
                        <div
                          className={`w-8 h-8 rounded-full ${item.avatarBg} ${item.avatarColor} text-xs font-bold flex items-center justify-center shrink-0`}
                        >
                          {item.initials}
                        </div>

                        {/* Details */}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1E2320] truncate">{item.name}</p>
                          <p className="text-[11px] text-[#726A5D] truncate">{item.role}</p>
                        </div>
                      </div>

                      {/* Right: Locked Badge or Remove */}
                      {item.isLocked ? (
                        <span className="text-[11px] font-semibold text-[#165B4C] bg-[#EAF5F1] px-2.5 py-1 rounded-md whitespace-nowrap">
                          {item.badge}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemoveReviewer(item.id)}
                          className="p-1 text-[#9A9184] hover:text-[#1E2320] transition-colors cursor-pointer rounded"
                          aria-label={`Remove ${item.name}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Reviewer Button & Dropdown */}
                <div className="pt-1 relative">
                  <button
                    type="button"
                    onClick={() => setIsAddReviewerOpen(!isAddReviewerOpen)}
                    className="px-3 py-1.5 rounded-xl border border-[#EAE2D4] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#1E2320] flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add reviewer</span>
                  </button>

                  {isAddReviewerOpen && (
                    <div className="absolute left-0 mt-2 w-full max-w-[340px] rounded-2xl border border-[#EAE2D4] bg-white shadow-xl p-2.5 space-y-2 z-30 animate-in fade-in zoom-in-95 duration-100">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-[#9A9184] absolute left-3 top-2.5 pointer-events-none" />
                        <input
                          type="text"
                          value={searchReviewerQuery}
                          onChange={(e) => setSearchReviewerQuery(e.target.value)}
                          placeholder="Search people with reviewer rights"
                          className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[#EAE2D4] bg-[#FAF8F5] text-[#1E2320] placeholder-[#9A9184] focus:outline-none focus:border-[#1F6E5B] focus:bg-white"
                          autoFocus
                        />
                      </div>
                      <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                        {reviewerCandidates
                          .filter(
                            (c) =>
                              c.name.toLowerCase().includes(searchReviewerQuery.toLowerCase()) ||
                              c.role.toLowerCase().includes(searchReviewerQuery.toLowerCase())
                          )
                          .map((cand) => (
                            <button
                              key={cand.id}
                              type="button"
                              onClick={() => handleSelectReviewer(cand)}
                              className="w-full text-left p-2 rounded-xl flex items-center gap-3 hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            >
                              <div
                                className={`w-7 h-7 rounded-full ${cand.avatarBg} ${cand.avatarColor} text-xs font-bold flex items-center justify-center shrink-0`}
                              >
                                {cand.initials}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-[#1E2320] truncate">{cand.name}</p>
                                <p className="text-[10px] text-[#726A5D] truncate">{cand.role}</p>
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── RIGHT COLUMN: APPROVERS ── */}
              <div className="p-5 rounded-2xl bg-white border border-[#EAE2D4] shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-1">
                  <h3 className="text-sm font-bold text-[#1E2320]">Approvers</h3>
                  <span className="text-xs text-[#726A5D]">{approvers.length} of 5</span>
                </div>

                {/* Approvers List */}
                <div className="space-y-2.5">
                  {approvers.map((item, index) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        item.isLocked
                          ? 'bg-[#F9F7F2] border-[#EAE2D4]'
                          : 'bg-white border-[#EAE2D4] hover:border-[#1F6E5B]/40 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Drag Handle or Lock */}
                        {item.isLocked ? (
                          <Lock className="w-3.5 h-3.5 text-[#726A5D] shrink-0" />
                        ) : (
                          <GripVertical className="w-3.5 h-3.5 text-[#9A9184] hover:text-[#1E2320] cursor-grab shrink-0" />
                        )}

                        {/* Sequence Number */}
                        <div className="relative flex flex-col items-center">
                          {index > 0 && (
                            <span className="absolute -top-3.5 w-[1.5px] h-3.5 bg-[#EAE2D4]" />
                          )}
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 z-10 ${
                              item.isLocked
                                ? 'bg-[#0E3D31] text-white'
                                : 'bg-[#EAF5F1] text-[#165B4C]'
                            }`}
                          >
                            {index + 1}
                          </div>
                          {index < approvers.length - 1 && (
                            <span className="absolute -bottom-3.5 w-[1.5px] h-3.5 bg-[#EAE2D4]" />
                          )}
                        </div>

                        {/* Avatar */}
                        <div
                          className={`w-8 h-8 rounded-full ${item.avatarBg} ${item.avatarColor} text-xs font-bold flex items-center justify-center shrink-0`}
                        >
                          {item.initials}
                        </div>

                        {/* Details */}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1E2320] truncate">{item.name}</p>
                          <p className="text-[11px] text-[#726A5D] truncate">{item.role}</p>
                        </div>
                      </div>

                      {/* Right: Locked Badge or Remove */}
                      {item.isLocked ? (
                        <span className="text-[11px] font-semibold text-[#165B4C] bg-[#EAF5F1] px-2.5 py-1 rounded-md whitespace-nowrap">
                          {item.badge}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemoveApprover(item.id)}
                          className="p-1 text-[#9A9184] hover:text-[#1E2320] transition-colors cursor-pointer rounded"
                          aria-label={`Remove ${item.name}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Approver Button & Dropdown (matching screenshot Image media_1793698122645_3ce9ddf1.jpg) */}
                <div className="pt-1 relative">
                  <button
                    type="button"
                    onClick={() => setIsAddApproverOpen(!isAddApproverOpen)}
                    className="px-3 py-1.5 rounded-xl border border-[#EAE2D4] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#1E2320] flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add approver</span>
                  </button>

                  {/* Open Dropdown Popover */}
                  {isAddApproverOpen && (
                    <div className="absolute left-0 mt-2 w-full max-w-[340px] rounded-2xl border border-[#EAE2D4] bg-white shadow-xl p-2.5 space-y-2 z-30 animate-in fade-in zoom-in-95 duration-100">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-[#9A9184] absolute left-3 top-2.5 pointer-events-none" />
                        <input
                          type="text"
                          value={searchApproverQuery}
                          onChange={(e) => setSearchApproverQuery(e.target.value)}
                          placeholder="Search people with approver rights"
                          className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[#EAE2D4] bg-[#FAF8F5] text-[#1E2320] placeholder-[#9A9184] focus:outline-none focus:border-[#1F6E5B] focus:bg-white"
                          autoFocus
                        />
                      </div>

                      <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                        {approverCandidates
                          .filter(
                            (c) =>
                              c.name.toLowerCase().includes(searchApproverQuery.toLowerCase()) ||
                              c.role.toLowerCase().includes(searchApproverQuery.toLowerCase())
                          )
                          .map((cand, idx) => (
                            <button
                              key={cand.id}
                              type="button"
                              onClick={() => handleSelectApprover(cand)}
                              className={`w-full text-left p-2 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                                idx === 0
                                  ? 'bg-[#EAF3EE] hover:bg-[#DEEFE6]'
                                  : 'hover:bg-[#FAF8F5]'
                              }`}
                            >
                              <div
                                className={`w-7 h-7 rounded-full ${cand.avatarBg} ${cand.avatarColor} text-xs font-bold flex items-center justify-center shrink-0`}
                              >
                                {cand.initials}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-[#1E2320] truncate">{cand.name}</p>
                                <p className="text-[10px] text-[#726A5D] truncate">{cand.role}</p>
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── BOTTOM SUMMARY PILL BAR (matching screenshot) ── */}
            <div className="w-full bg-white rounded-2xl border border-[#EAE2D4] px-6 py-3.5 shadow-2xs overflow-x-auto">
              <div className="flex items-center gap-6 text-xs text-[#5C5346] whitespace-nowrap">
                <span className="font-bold uppercase tracking-wider text-[11px] text-[#29251F]">
                  SUMMARY
                </span>
                <span>{appliesDepartments.join(', ')}</span>
                <span>Mandatory · all employees</span>
                <span>Due {completeWithinDays || 15} days after approval</span>
                <span>{frequency} re-training</span>
                <span>
                  {infographics.length} infographics · {questions.length} questions
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          WIZARD BOTTOM FOOTER
      ───────────────────────────────────────────────────────────── */}
      <footer className="shrink-0 bg-white border-t border-[#EAE2D4] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs z-30">
        <div>
          {currentStep === 1 ? (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#726A5D] hover:text-[#1E2320] cursor-pointer"
            >
              Cancel
            </button>
          ) : currentStep === 2 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#726A5D] hover:text-[#1E2320] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : currentStep === 3 ? (
            <button
              type="button"
              onClick={() => {
                if (aiSubTab === 'questions') {
                  setAiSubTab('infographics');
                } else {
                  setCurrentStep(2);
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#726A5D] hover:text-[#1E2320] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{aiSubTab === 'questions' ? 'Back to infographics' : 'Back'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#726A5D] hover:text-[#1E2320] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}
        </div>

        <div>
          {currentStep === 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2 text-xs font-bold text-white bg-[#0E3D31] hover:bg-[#165544] rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <span>Continue to SOP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : currentStep === 2 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2 text-xs font-bold text-white bg-[#0E3D31] hover:bg-[#165544] rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <span>Review AI content</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : currentStep === 3 ? (
            aiSubTab === 'infographics' ? (
              <button
                type="button"
                onClick={() => setAiSubTab('questions')}
                className="px-5 py-2 text-xs font-bold text-white bg-[#0E3D31] hover:bg-[#165544] rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span>Next: question bank</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-5 py-2 text-xs font-bold text-white bg-[#0E3D31] hover:bg-[#165544] rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span>Continue to reviewers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )
          ) : (
            <div className="flex items-center gap-4">
              <p className="text-xs text-[#726A5D] hidden sm:block">
                Status becomes <strong className="text-[#1E2320] font-semibold">Review pending</strong> and{' '}
                <strong className="text-[#1E2320] font-semibold">{reviewers[0]?.name?.split(' ')[0] || 'Rahul'}</strong> is notified
              </p>

              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting || isSubmittedSuccess}
                className="px-6 py-2.5 text-xs font-bold text-white bg-[#0E3D31] hover:bg-[#165544] rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-75 active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : isSubmittedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Submitted for review!</span>
                  </>
                ) : (
                  <span>Submit for review</span>
                )}
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
