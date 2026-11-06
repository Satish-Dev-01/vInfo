/**
 * Core Domain & API Types
 * Provides unified, enterprise-grade type safety across the entire application.
 */

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export type ApiResponse<T = unknown> = {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
};

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncState<T> = {
  data: Nullable<T>;
  isLoading: boolean;
  error: Nullable<Error>;
};

// ==========================================
// Auth & User Types (Backend API Contract)
// ==========================================

export type NextOnboardingStep =
  | 'VERIFY_EMAIL'
  | 'USER_DETAILS'
  | 'ORG_BILLING_DETAILS'
  | 'DEPARTMENTS_AND_LEVELS'
  | 'MODULE_SELECTION'
  | 'INVITE_TEAM'
  | 'DASHBOARD'
  | 'COMPLETED'
  | string;

export type UserRole =
  | 'COMPANY_ADMIN'
  | 'INDEPENDENT_PROFESSIONAL'
  | 'EMPLOYEE'
  | string;

export type RegistrationType = 'COMPANY' | 'INDIVIDUAL' | string;

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  registrationType: RegistrationType;
  emailVerified: boolean;
  organizationId: string | null;
  organizationName: string | null;
  department: string | null;
  level: string | null;
  preparer: boolean;
  reviewer: boolean;
  approver: boolean;
}

export interface LoginBackendResponse {
  token: string;
  nextStep: NextOnboardingStep;
  user: AuthUser;
  emailVerificationToken: string | null;
}

export interface HeadOfficeDto {
  companyName: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  pinCode?: string | null;
  country?: string | null;
  state?: string | null;
  gstin?: string | null;
}

export interface FacilityDto {
  id?: string;
  name: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  pinCode?: string | null;
  country?: string | null;
  state?: string | null;
  gstin?: string | null;
}

export interface ThirdPartyManufacturerDto {
  id?: string;
  name: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  pinCode?: string | null;
  country?: string | null;
  state?: string | null;
  gstin?: string | null;
}

export interface OrganizationBillingDetailsRequest {
  headOffice: HeadOfficeDto;
  ownsManufacturingFacilities: boolean;
  manufacturingFacilities: FacilityDto[];
  hasThirdPartyManufacturers: boolean;
  thirdPartyManufacturers: ThirdPartyManufacturerDto[];
  billingEmail?: string | null;
  billingAddress?: string | null;
  taxId?: string | null;
}

export interface OrganizationBillingDetailsResponse {
  headOffice: HeadOfficeDto;
  ownsManufacturingFacilities: boolean | null;
  manufacturingFacilities: FacilityDto[];
  hasThirdPartyManufacturers: boolean | null;
  thirdPartyManufacturers: ThirdPartyManufacturerDto[];
  billingEmail?: string | null;
  billingAddress?: string | null;
  taxId?: string | null;
}

export interface LevelRightDto {
  id?: string | number;
  levelCode: string;
  levelName: string;
  preparer: boolean;
  reviewer: boolean;
  approver: boolean;
  sortOrder?: number;
  isCustom?: boolean;
}

export interface PredefinedLevelDto {
  levelCode: string;
  levelName: string;
  preparer: boolean;
  reviewer: boolean;
  approver: boolean;
  sortOrder?: number;
}

export interface LevelRightsUpdateRequest {
  levels: LevelRightDto[];
}

export interface DepartmentDto {
  id: string | number;
  name: string;
  isCustom: boolean;
}

export interface AddDepartmentRequest {
  name: string;
}

export interface DepartmentsAndLevelsResponse {
  predefinedDepartments?: string[];
  departments?: DepartmentDto[];
  predefinedLevels?: PredefinedLevelDto[];
  levels?: LevelRightDto[];
}

export interface DepartmentsAndLevelsUpdateRequest {
  predefinedDepartments?: string[];
  departments?: string[];
  predefinedLevels?: PredefinedLevelDto[];
  levels?: LevelRightDto[];
  complete?: boolean;
}

export interface DepartmentHeadInvitationDto {
  department: string;
  email: string;
  level: string;
  employmentStatus: string;
}

export interface MemberInvitationDto {
  email: string;
  department: string;
  level: string;
  employmentStatus: string;
}

export interface OrgInvitationsRequest {
  departmentHeads: DepartmentHeadInvitationDto[];
  members: MemberInvitationDto[];
  complete: boolean;
}

export interface UserDetailsRequest {
  phone: string;
  jobTitle: string;
  designation: string;
  country: string;
  highestQualification: string;
  yearsOfExperience: number;
  functions: string[];
  productTypes: string[];
}

export interface UserDetailsResponse {
  phone?: string;
  jobTitle?: string;
  designation?: string;
  country?: string;
  highestQualification?: string;
  yearsOfExperience?: number;
  functions?: string[];
  productTypes?: string[];
  [key: string]: unknown;
}
