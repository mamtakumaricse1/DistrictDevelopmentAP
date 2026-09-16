import { apiDownload, apiGet, apiPatch, apiPost, apiUpload } from './client';

export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CLOSED';

export type ProjectRecord = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  districtId: string;
  departmentId: string;
  implementingAgencyId: string | null;
  executingAgencyId: string | null;
  financialYear: number;
  sanctionedAmount: string | null;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  locationText: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedProjects = {
  data: ProjectRecord[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};

export type ProjectListQuery = {
  districtId?: string;
  departmentId?: string;
  status?: ProjectStatus | '';
  search?: string;
  page?: number;
  pageSize?: number;
};

function queryString(params: ProjectListQuery): string {
  const search = new URLSearchParams();
  if (params.districtId) {
    search.set('districtId', params.districtId);
  }
  if (params.departmentId) {
    search.set('departmentId', params.departmentId);
  }
  if (params.status) {
    search.set('status', params.status);
  }
  if (params.search) {
    search.set('search', params.search);
  }
  if (params.page) {
    search.set('page', String(params.page));
  }
  if (params.pageSize) {
    search.set('pageSize', String(params.pageSize));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
}

export type ProgressRecord = {
  id: string;
  projectId: string;
  version: number;
  periodYm: string;
  physicalPercent: string;
  financialAmount: string | null;
  status: string;
  remarks: string | null;
  createdAt: string;
};

export type DocumentRecord = {
  id: string;
  projectId: string;
  originalName: string;
  mimeType: string;
  byteSize: number;
  uploadedAt: string;
};

export const projectsApi = {
  list: (params: ProjectListQuery = {}) => apiGet<PaginatedProjects>(`/projects${queryString(params)}`),
  get: (id: string) => apiGet<ProjectRecord>(`/projects/${id}`),
  create: (body: unknown) => apiPost<ProjectRecord>('/projects', body),
  update: (id: string, body: unknown) => apiPatch<ProjectRecord>(`/projects/${id}`, body),
  progress: (id: string) => apiGet<ProgressRecord[]>(`/projects/${id}/progress`),
  submitProgress: (id: string, body: unknown) => apiPost<ProgressRecord>(`/projects/${id}/progress`, body),
  documents: (id: string) => apiGet<DocumentRecord[]>(`/projects/${id}/documents`),
  uploadDocument: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiUpload<DocumentRecord>(`/projects/${id}/documents`, form);
  },
  downloadDocument: (documentId: string) => apiDownload(`/documents/${documentId}/file`),
};
