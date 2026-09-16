import { apiGet } from './client';

export type LivenessResponse = {
  status: 'ok';
  service: string;
  timestamp: string;
};

export type ReadinessResponse = {
  status: 'ready' | 'degraded';
  service: string;
  timestamp: string;
  checks: Record<string, string>;
};

export function fetchLiveness(): Promise<LivenessResponse> {
  return apiGet<LivenessResponse>('/health');
}

export function fetchReadiness(): Promise<ReadinessResponse> {
  return apiGet<ReadinessResponse>('/health/ready');
}
