import { apiGet, apiPatch, apiPost } from './client';

export type MeetingRecord = {
  id: string;
  districtId: string;
  title: string;
  scheduledAt: string;
  venue: string | null;
  notes: string | null;
  status: string;
  _count?: { actions: number };
};

export type ActionRecord = {
  id: string;
  meetingId: string | null;
  districtId: string;
  departmentId: string | null;
  projectId: string | null;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  isOverdue: boolean;
};

export const governanceApi = {
  meetings: () => apiGet<MeetingRecord[]>('/meetings'),
  createMeeting: (body: unknown) => apiPost<MeetingRecord>('/meetings', body),
  updateMeeting: (id: string, body: unknown) => apiPatch<MeetingRecord>(`/meetings/${id}`, body),
  actions: () => apiGet<ActionRecord[]>('/actions'),
  createAction: (body: unknown) => apiPost<ActionRecord>('/actions', body),
  updateAction: (id: string, body: unknown) => apiPatch<ActionRecord>(`/actions/${id}`, body),
};
