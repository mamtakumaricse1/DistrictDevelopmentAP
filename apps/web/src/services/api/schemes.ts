import { apiGet, apiPost } from './client';
import type { SchemePerformance } from './dashboard';

export type SchemeKpi = {
  id: string;
  name: string;
  unit: string;
  target: string | number;
};

export type SchemeDetail = SchemePerformance & {
  code?: string;
  funding?: string;
  remarks?: string | null;
  kpis?: SchemeKpi[];
  blockWise: Array<{ locationId: string | null; target: number; beneficiaries: number; progress: number }>;
  projects: Array<{ id: string; code: string; name: string; status: string; locationId: string | null }>;
};

export const schemesApi = {
  list: (departmentId?: string, domain?: string) =>
    apiGet<SchemePerformance[]>(
      `/schemes${departmentId || domain ? '?' : ''}${[
        departmentId ? `departmentId=${departmentId}` : '',
        domain ? `domain=${domain}` : '',
      ]
        .filter(Boolean)
        .join('&')}`,
    ),
  get: (id: string) => apiGet<SchemeDetail>(`/schemes/${id}`),
  submitKpiProgress: (kpiId: string, body: unknown) => apiPost(`/schemes/kpis/${kpiId}/progress`, body),
  validateImport: (csv: string) => apiPost<{ valid: boolean; issues: string[]; rows: number }>('/imports/validate', { csv }),
  importProgress: (csv: string) => apiPost<{ imported: number }>('/imports/progress', { csv }),
};
