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
  status: string;
  periodYm: string;
  version: number;
};

export type GovernanceSummary = {
  openActions: number;
  doneActions: number;
  meetings: number;
};

export const dashboardApi = {
  summary: () => apiGet<DashboardSummary>('/dashboard/summary'),
  delayed: () => apiGet<DelayedProject[]>('/dashboard/delayed'),
  governance: () => apiGet<GovernanceSummary>('/governance/summary'),
};
