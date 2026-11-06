export type ModuleStatus =
  | 'Pending objections'
  | 'Review pending'
  | 'Approval pending'
  | 'Approved · Live'
  | 'Draft'
  | 'Rejected';

export interface LearningModuleItem {
  id: string;
  name: string;
  code: string;
  version: string;
  department: string;
  status: ModuleStatus;
  progressText: string;
  progressPercent: number;
  progressColor?: string;
  updated: string;
  actionText: 'Open' | 'Resume' | '...';
}

export interface ModuleRequestItem {
  id: string;
  type: 'NEW MODULE REQUEST' | 'REVISION REQUEST';
  title: string;
  requester: string;
  department: string;
  timeAgo: string;
  actionText: 'Start module' | 'Start revision';
  notes?: string | null;
  status?: string;
}

export interface TrainingReminderItem {
  id: string;
  title: string;
  dueText: string;
  isUrgent?: boolean;
}

export interface LearningDashboardMetricsDto {
  drafts: number;
  reviewPending: number;
  pendingObjections: number;
  approvalPending: number;
  liveModules: number;
}

export interface LearningModuleDto {
  id: number | string;
  code: string;
  name: string;
  version: number | string;
  department: string;
  status: string;
  progressText: string;
  updatedAgo: string;
  trainedCount: number;
  totalAssigned: number;
}

export interface LearningRequestDto {
  id: number | string;
  requestType: string;
  moduleName: string;
  ownerDepartment: string;
  fromUser: string;
  timeAgo: string;
  notes: string | null;
  status: string;
}

export interface LearningTrainingDto {
  id?: number | string;
  title?: string;
  dueText?: string;
  isUrgent?: boolean;
  dueDate?: string;
}

export interface LearningDashboardResponseDto {
  metrics: LearningDashboardMetricsDto;
  myLearningModules: LearningModuleDto[];
  requestsForYou: LearningRequestDto[];
  myTrainings: LearningTrainingDto[];
}

export interface InfographicItem {
  id: number;
  title: string;
  subtitle: string;
  status: 'Not checked' | 'Looks right' | 'Issue reported';
  steps: {
    number: number;
    title: string;
    description: string;
  }[];
}

export interface QuestionBankItem {
  id: string;
  number: number;
  question: string;
  type: '4 options' | 'True / False';
  isMandatory: boolean;
  options?: string[];
  correctOptionIndex?: number;
  isEditedByUser?: boolean;
}

