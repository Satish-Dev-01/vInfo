import {
  LearningModuleItem,
  ModuleRequestItem,
  TrainingReminderItem,
  InfographicItem,
  QuestionBankItem,
  LearningDashboardResponseDto,
  LearningModuleDto,
  LearningRequestDto,
  LearningTrainingDto,
  ModuleStatus,
} from '@/types/learning';

export const DEFAULT_LEARNING_DASHBOARD_RESPONSE: LearningDashboardResponseDto = {
  metrics: {
    drafts: 2,
    reviewPending: 3,
    pendingObjections: 1,
    approvalPending: 0,
    liveModules: 0,
  },
  myLearningModules: [
    {
      id: 5,
      code: 'SOP/PRD/031',
      name: 'Batch record review',
      version: 1,
      department: 'Production',
      status: 'DRAFT',
      progressText: 'Step 2 of 4 · Upload SOP',
      updatedAgo: '2 h ago',
      trainedCount: 0,
      totalAssigned: 56,
    },
    {
      id: 6,
      code: 'SOP/PRD/014',
      name: 'Line clearance — tablet compression',
      version: 2,
      department: 'Production',
      status: 'PENDING_OBJECTIONS',
      progressText: 'Review 2 of 3',
      updatedAgo: '2 h ago',
      trainedCount: 0,
      totalAssigned: 56,
    },
    {
      id: 4,
      code: 'SOP/PRD/007',
      name: 'Operation of tablet compression machine',
      version: 3,
      department: 'Production',
      status: 'REVIEW_PENDING',
      progressText: 'Review 1 of 3',
      updatedAgo: '2 h ago',
      trainedCount: 0,
      totalAssigned: 56,
    },
    {
      id: 7,
      code: 'SOP/STR/004',
      name: 'Sterile area entry protocol',
      version: 1,
      department: 'Production',
      status: 'REVIEW_PENDING',
      progressText: 'Review 1 of 3',
      updatedAgo: '2 h ago',
      trainedCount: 0,
      totalAssigned: 56,
    },
    {
      id: 8,
      code: 'SOP/STR/005',
      name: 'Autoclave cycle validation',
      version: 1,
      department: 'Production',
      status: 'DRAFT',
      progressText: 'Step 2 of 4 · Upload SOP',
      updatedAgo: '2 h ago',
      trainedCount: 0,
      totalAssigned: 56,
    },
    {
      id: 9,
      code: 'SOP/STR/006',
      name: 'Cleanroom environmental monitoring',
      version: 1,
      department: 'Quality Assurance',
      status: 'REVIEW_PENDING',
      progressText: 'Review 1 of 3',
      updatedAgo: '2 h ago',
      trainedCount: 0,
      totalAssigned: 56,
    },
  ],
  requestsForYou: [
    {
      id: 3,
      requestType: 'NEW_MODULE',
      moduleName: 'Batch record review',
      ownerDepartment: 'Production',
      fromUser: 'Vikram Desai',
      timeAgo: '2 days ago',
      notes: null,
      status: 'PENDING',
    },
    {
      id: 4,
      requestType: 'REVISION',
      moduleName: 'Operation of tablet compression machine',
      ownerDepartment: 'Production',
      fromUser: 'Vikram Desai',
      timeAgo: '2 days ago',
      notes: 'Turret speed update from 40 rpm to 30 rpm per revised annexure.',
      status: 'PENDING',
    },
  ],
  myTrainings: [],
};

export function mapDtoToLearningModules(dtos: LearningModuleDto[]): LearningModuleItem[] {
  if (!Array.isArray(dtos)) return [];
  return dtos.map((dto) => {
    let status: ModuleStatus = 'Draft';
    const rawStatus = (dto.status || '').toUpperCase();
    if (rawStatus.includes('OBJECTION')) {
      status = 'Pending objections';
    } else if (rawStatus.includes('REVIEW')) {
      status = 'Review pending';
    } else if (rawStatus.includes('APPROVAL')) {
      status = 'Approval pending';
    } else if (rawStatus.includes('APPROV') || rawStatus.includes('LIVE')) {
      status = 'Approved · Live';
    } else if (rawStatus.includes('REJECT')) {
      status = 'Rejected';
    } else {
      status = 'Draft';
    }

    let progressPercent = 0;
    if (status === 'Approved · Live') {
      progressPercent = 100;
    } else if (dto.totalAssigned > 0 && dto.trainedCount > 0) {
      progressPercent = Math.min(100, Math.round((dto.trainedCount / dto.totalAssigned) * 100));
    } else if (dto.progressText?.includes('2 of 3')) {
      progressPercent = 66;
    } else if (dto.progressText?.includes('1 of 3')) {
      progressPercent = 33;
    } else if (dto.progressText?.includes('2 of 4')) {
      progressPercent = 50;
    } else if (dto.progressText?.includes('1 of 2')) {
      progressPercent = 50;
    } else if (status === 'Pending objections') {
      progressPercent = 66;
    } else if (status === 'Review pending') {
      progressPercent = 33;
    } else if (status === 'Approval pending') {
      progressPercent = 75;
    } else if (status === 'Draft') {
      progressPercent = 25;
    }

    let progressColor = 'bg-[#1F6E5B]';
    if (status === 'Pending objections') {
      progressColor = 'bg-red-500';
    } else if (status === 'Approval pending') {
      progressColor = 'bg-amber-600';
    } else if (status === 'Draft') {
      progressColor = 'bg-zinc-400';
    } else if (status === 'Rejected') {
      progressColor = 'bg-zinc-800';
    }

    let actionText: 'Open' | 'Resume' | '...' = '...';
    if (status === 'Draft') {
      actionText = 'Resume';
    } else if (status === 'Pending objections') {
      actionText = 'Open';
    }

    const displayName =
      dto.name && dto.name !== 'string'
        ? dto.name
        : dto.code === 'SOP/STR/004'
        ? 'Sterile area entry protocol'
        : dto.code === 'SOP/STR/005'
        ? 'Autoclave cycle validation'
        : dto.code === 'SOP/STR/006'
        ? 'Cleanroom environmental monitoring'
        : `Module ${dto.code}`;

    const displayDept =
      dto.department && dto.department !== 'string' ? dto.department : 'Production';

    return {
      id: String(dto.id),
      name: displayName,
      code: dto.code,
      version: typeof dto.version === 'number' ? `v${dto.version}` : String(dto.version || 'v1'),
      department: displayDept,
      status,
      progressText: dto.progressText || 'In progress',
      progressPercent,
      progressColor,
      updated: dto.updatedAgo || 'Recently',
      actionText,
    };
  });
}

export function mapDtoToRequests(dtos: LearningRequestDto[]): ModuleRequestItem[] {
  if (!Array.isArray(dtos)) return [];
  return dtos.map((dto) => {
    const isRevision = (dto.requestType || '').toUpperCase().includes('REVISION');
    return {
      id: String(dto.id),
      type: isRevision ? 'REVISION REQUEST' : 'NEW MODULE REQUEST',
      title: dto.moduleName || 'Standard Learning Module',
      requester: dto.fromUser || 'Team Lead',
      department: dto.ownerDepartment || 'Production',
      timeAgo: dto.timeAgo || 'Recently',
      actionText: isRevision ? 'Start revision' : 'Start module',
      notes: dto.notes,
      status: dto.status,
    };
  });
}

export function mapDtoToTrainings(dtos: LearningTrainingDto[]): TrainingReminderItem[] {
  if (!Array.isArray(dtos) || dtos.length === 0) return [];
  return dtos.map((dto, idx) => ({
    id: String(dto.id || `tr-${idx}`),
    title: dto.title || 'Standard GMP Training',
    dueText: dto.dueText || 'Due soon',
    isUrgent: Boolean(dto.isUrgent),
  }));
}

export const INITIAL_MODULES: LearningModuleItem[] = [
  {
    id: 'mod-1',
    name: 'Line clearance — tablet compression',
    code: 'SOP/PRD/014',
    version: 'v2',
    department: 'Production',
    status: 'Pending objections',
    progressText: 'Review 2 of 3',
    progressPercent: 66,
    progressColor: 'bg-red-500',
    updated: '2 h ago',
    actionText: 'Open',
  },
  {
    id: 'mod-2',
    name: 'Dispensing of raw materials',
    code: 'SOP/WH/003',
    version: 'v1',
    department: 'Warehouse',
    status: 'Review pending',
    progressText: 'Review 1 of 3',
    progressPercent: 33,
    progressColor: 'bg-emerald-700',
    updated: 'Yesterday',
    actionText: '...',
  },
  {
    id: 'mod-3',
    name: 'Cleaning of fluid bed dryer',
    code: 'SOP/PRD/022',
    version: 'v1',
    department: 'Production',
    status: 'Approval pending',
    progressText: 'Approver 1 of 2',
    progressPercent: 50,
    progressColor: 'bg-amber-600',
    updated: '3 days ago',
    actionText: '...',
  },
  {
    id: 'mod-4',
    name: 'Operation of tablet compression machine',
    code: 'SOP/PRD/007',
    version: 'v3',
    department: 'Production',
    status: 'Approved · Live',
    progressText: '42 of 56 trained',
    progressPercent: 75,
    progressColor: 'bg-emerald-600',
    updated: '12 Sep',
    actionText: '...',
  },
  {
    id: 'mod-5',
    name: 'Batch record review',
    code: 'SOP/PRD/031',
    version: 'draft',
    department: 'Production',
    status: 'Draft',
    progressText: 'Step 2 of 4 · Upload SOP',
    progressPercent: 50,
    progressColor: 'bg-zinc-400',
    updated: 'Today',
    actionText: 'Resume',
  },
  {
    id: 'mod-6',
    name: 'Operation of blister packing machine',
    code: 'SOP/PKG/005',
    version: 'v1',
    department: 'Production',
    status: 'Rejected',
    progressText: 'Rejected by QA Head',
    progressPercent: 0,
    progressColor: 'bg-zinc-800',
    updated: '8 Oct',
    actionText: '...',
  },
];

export const INITIAL_REQUESTS: ModuleRequestItem[] = [
  {
    id: 'req-1',
    type: 'NEW MODULE REQUEST',
    title: 'Batch record review',
    requester: 'Vikram Desai',
    department: 'Production',
    timeAgo: '2 days ago',
    actionText: 'Start module',
  },
  {
    id: 'req-2',
    type: 'REVISION REQUEST',
    title: 'Operation of tablet compression machine',
    requester: 'Vikram Desai',
    department: 'Production',
    timeAgo: '4 days ago',
    actionText: 'Start revision',
  },
];

export const INITIAL_TRAININGS: TrainingReminderItem[] = [
  {
    id: 'tr-1',
    title: 'Handling of deviations',
    dueText: 'Due in 2 days',
    isUrgent: true,
  },
  {
    id: 'tr-2',
    title: 'Data integrity basics',
    dueText: 'Due 30 Oct',
    isUrgent: false,
  },
];

export const INITIAL_INFOGRAPHICS: InfographicItem[] = [
  {
    id: 1,
    title: 'Review in 5 steps',
    subtitle: 'Reviewing an executed batch record in 5 steps',
    status: 'Not checked',
    steps: [
      {
        number: 1,
        title: 'Receive the BMR',
        description:
          'Collect the executed record from Production within 24 h of batch completion. Log receipt in the BMR register.',
      },
      {
        number: 2,
        title: 'Check every entry',
        description:
          'Entries are complete, legible, signed and dated. No overwriting — corrections are single-line strikes with initials.',
      },
      {
        number: 3,
        title: 'Verify critical parameters',
        description:
          'Compare in-process results with limits in the master record. Flag any value outside range.',
      },
      {
        number: 4,
        title: 'Reconcile yield and materials',
        description:
          'Yield within 98–102%. Account for all labels and packing material issued.',
      },
      {
        number: 5,
        title: 'Record deviations, then sign off',
        description:
          'Raise a deviation for every discrepancy before signing. Only then forward the BMR to QA for batch release.',
      },
    ],
  },
  {
    id: 2,
    title: "Do's and don'ts",
    subtitle: 'Essential guidelines for batch record compliance',
    status: 'Looks right',
    steps: [
      {
        number: 1,
        title: 'Do document concurrently',
        description:
          'Always sign and stamp entries at the exact moment tasks are performed.',
      },
      {
        number: 2,
        title: 'Do not use correction fluid',
        description:
          'Never use whitener, sticky notes, or obliteration on official documents.',
      },
    ],
  },
  {
    id: 3,
    title: 'Critical checks',
    subtitle: 'High-risk verification points prior to release',
    status: 'Not checked',
    steps: [
      {
        number: 1,
        title: 'Line clearance verification',
        description:
          'Ensure previous product materials are completely removed and tagged.',
      },
      {
        number: 2,
        title: 'Yield reconciliation tolerances',
        description:
          'Check that actual yield falls within established Schedule M acceptance limits.',
      },
    ],
  },
];

export const INITIAL_QUESTIONS: QuestionBankItem[] = [
  {
    id: 'q1',
    number: 1,
    question: 'Within how many hours must the executed BMR reach QA after batch completion?',
    type: '4 options',
    isMandatory: true,
    options: ['12 h', '24 h', '48 h', '72 h'],
    correctOptionIndex: 1,
  },
  {
    id: 'q2',
    number: 2,
    question: 'Overwriting an entry is acceptable if the new value is initialled.',
    type: 'True / False',
    isMandatory: true,
    options: ['True', 'False'],
    correctOptionIndex: 1,
  },
  {
    id: 'q3',
    number: 3,
    question: 'What is the acceptable yield range for a compressed tablet batch?',
    type: '4 options',
    isMandatory: true,
    options: ['95–105%', '97–101%', '98–102%', '90–110%'],
    correctOptionIndex: 1,
    isEditedByUser: true,
  },
  {
    id: 'q4',
    number: 4,
    question: 'Which form is used to reconcile labels and packing material?',
    type: '4 options',
    isMandatory: false,
    options: ['Form PRD-04', 'Form MAT-09', 'Form QA-21', 'Form PKG-12'],
    correctOptionIndex: 3,
  },
  {
    id: 'q5',
    number: 5,
    question: 'A deviation must be raised before the reviewer signs off the BMR.',
    type: 'True / False',
    isMandatory: true,
    options: ['True', 'False'],
    correctOptionIndex: 0,
  },
  {
    id: 'q6',
    number: 6,
    question: 'Who is responsible for logging receipt of the BMR?',
    type: '4 options',
    isMandatory: false,
    options: ['Shift In-charge', 'QA Document Custodian', 'Warehouse Lead', 'Operator'],
    correctOptionIndex: 1,
  },
  {
    id: 'q7',
    number: 7,
    question: 'Corrections must be made with a single-line strike, initials and date.',
    type: 'True / False',
    isMandatory: true,
    options: ['True', 'False'],
    correctOptionIndex: 0,
  },
  {
    id: 'q8',
    number: 8,
    question: 'Who conducts the secondary verification of raw material weights?',
    type: '4 options',
    isMandatory: false,
    options: ['Warehouse operator', 'Quality Control analyst', 'QA Officer', 'Production Supervisor'],
    correctOptionIndex: 2,
  },
  {
    id: 'q9',
    number: 9,
    question: 'Temperature and humidity conditions in compression suites must be recorded hourly.',
    type: 'True / False',
    isMandatory: false,
    options: ['True', 'False'],
    correctOptionIndex: 0,
  },
  {
    id: 'q10',
    number: 10,
    question: 'What is the procedure if a signature line is inadvertently missed during execution?',
    type: '4 options',
    isMandatory: false,
    options: [
      'Backdate the signature',
      'Raise a planned deviation and cross-verify with logbooks',
      'Have any operator sign',
      'Leave blank with an asterisk',
    ],
    correctOptionIndex: 1,
  },
  {
    id: 'q11',
    number: 11,
    question: 'Destruction of damaged labels must be witnessed and dual-signed.',
    type: 'True / False',
    isMandatory: false,
    options: ['True', 'False'],
    correctOptionIndex: 0,
  },
  {
    id: 'q12',
    number: 12,
    question: 'How long must finished batch records be retained under Schedule M guidelines?',
    type: '4 options',
    isMandatory: false,
    options: ['1 year after expiry', '5 years after manufacturing', '10 years', 'Indefinitely'],
    correctOptionIndex: 0,
  },
];

