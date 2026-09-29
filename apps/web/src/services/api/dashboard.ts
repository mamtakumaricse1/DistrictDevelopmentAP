import { apiGet } from './client';

export type DashboardSummary = {
  totals: Record<string, number>;
  latestProgress: {
    delayed: number;
    stalled: number;
    inProgress: number;
    completed: number;
    notStarted: number;
  };
  byDepartment: Array<{ departmentId: string; delayed: number; stalled: number; total: number }>;
};

export type DelayedProject = {
  projectId: string;
  code: string;
  name: string;
  districtId: string;
  departmentId: string;
  locationText?: string | null;
  status: string;
  periodYm: string;
  version: number;
  daysPending?: number;
};

export type GovernanceSummary = {
  openActions: number;
  doneActions: number;
  meetings: number;
  immediate?: number;
  attention?: number;
  nextMeeting?: { id: string; title: string; scheduledAt: string; nextReviewAt: string | null } | null;
};

export type RagStatus = 'ON_TRACK' | 'ATTENTION' | 'CRITICAL';

export type DepartmentPerformance = {
  departmentId: string;
  projects: number;
  target: number;
  achievement: number;
  physicalPercent: number;
  financialPercent: number;
  status: RagStatus;
};

export type SchemePerformance = {
  id: string;
  name: string;
  departmentId: string;
  domain?: string;
  officerName?: string | null;
  remarks?: string | null;
  targetUnit?: string | null;
  funding?: string;
  reportingFrequency?: string;
  target: number;
  achievement: number;
  progress: number;
  physicalPercent: number;
  financialPercent: number;
  fundAllocated?: number;
  fundReleased?: number;
  expenditure?: number;
  status: RagStatus;
  lastUpdated: string | null;
};

export type HdIndicator = {
  id: string;
  schemeId: string;
  name: string;
  unit: string | null;
  target: number;
  achievement: number;
  progress: number;
  status: RagStatus;
  officerName?: string | null;
};

export type HdDomain = {
  schemes: SchemePerformance[];
  indicators: HdIndicator[];
};

export type DashboardOverview = {
  totals: {
    schemes: number;
    projects: number;
    ongoing: number;
    completed: number;
    delayed: number;
    onTrack?: number;
    beneficiaries: number;
    financialProgress: number;
    physicalProgress: number;
    financialStatus?: RagStatus;
    physicalStatus?: RagStatus;
    dcIntervention: number;
  };
  departments: DepartmentPerformance[];
  schemes: SchemePerformance[];
  delayedSchemes?: Array<{ id: string; name: string; progress: number; status: RagStatus }>;
  laggingBlocks?: Array<{ locationId: string; progress: number }>;
  lastUpdated: string | null;
};

export type InfrastructureProject = {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  locationId: string | null;
  locationText: string | null;
  category: string | null;
  workType: string | null;
  contractor: string | null;
  sanctionedAmount: string | null;
  releasedAmount: string | null;
  expenditure: string | null;
  physicalPercent: number;
  startDate: string | null;
  expectedCompletion: string | null;
  status: string;
  delayDays?: number;
};

export type HumanDevelopment = {
  HEALTH: HdDomain;
  EDUCATION: HdDomain;
  SOCIAL_WELFARE: HdDomain;
};

export type MapPoint = {
  locationId: string;
  schemes: number;
  roads: number;
  water: number;
  schools: number;
  health: number;
  pmay: number;
};

export type BlockDashboard = {
  locationId: string;
  totals: { schemes: number; projects: number; delayed: number; beneficiaries: number };
  sectors?: Array<{ domain: string; progress: number; status: RagStatus }>;
  gis?: { schemes: number; roads: number; water: number; schools: number; health: number; pmay: number };
  domains: Array<{ domain: string; value: number }>;
  projects: Array<{ id: string; code: string; name: string; departmentId: string; status: string; locationText: string | null }>;
  schemes: Array<{
    schemeId: string;
    name: string;
    departmentId: string;
    domain: string;
    target: number;
    beneficiaries: number;
    progress: number;
  }>;
};

export const dashboardApi = {
  summary: () => apiGet<DashboardSummary>('/dashboard/summary'),
  delayed: () => apiGet<DelayedProject[]>('/dashboard/delayed'),
  overview: () => apiGet<DashboardOverview>('/dashboard/overview'),
  department: (departmentId: string) =>
    apiGet<DashboardOverview & { projects: Array<Record<string, unknown>> }>(`/dashboard/departments/${departmentId}`),
  block: (locationId: string) => apiGet<BlockDashboard>(`/dashboard/blocks/${locationId}`),
  infrastructure: () => apiGet<InfrastructureProject[]>('/dashboard/infrastructure'),
  humanDevelopment: () => apiGet<HumanDevelopment>('/dashboard/human-development'),
  mapPoints: () => apiGet<MapPoint[]>('/dashboard/map-points'),
  governance: () => apiGet<GovernanceSummary>('/governance/summary'),
};
