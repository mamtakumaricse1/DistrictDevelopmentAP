export type RagStatus = 'ON_TRACK' | 'ATTENTION' | 'CRITICAL';

export function ragFromPercent(value: number, green = 90, amber = 70): RagStatus {
  if (value >= green) {
    return 'ON_TRACK';
  }
  if (value >= amber) {
    return 'ATTENTION';
  }
  return 'CRITICAL';
}

export function formatNumber(value: number | string | null | undefined): string {
  const numeric = typeof value === 'string' ? Number(value) : (value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  return new Intl.NumberFormat('en-IN').format(Math.round(numeric));
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }
  return `${value}%`;
}

export function formatRupees(value: number | string | null | undefined): string {
  const numeric = typeof value === 'string' ? Number(value) : (value ?? 0);
  if (!Number.isFinite(numeric) || numeric === 0) {
    return '—';
  }
  if (Math.abs(numeric) >= 10_000_000) {
    return `₹${(numeric / 10_000_000).toFixed(1)} Cr`;
  }
  return `₹${formatNumber(numeric)}`;
}

export function formatUpdated(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  if (/^\d{4}-\d{2}$/.test(value)) {
    return `01-${value.slice(5, 7)}-${value.slice(0, 4)}`;
  }
  const date = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return `${date.slice(8, 10)}-${date.slice(5, 7)}-${date.slice(0, 4)}`;
  }
  return value;
}

export function ragColor(status: string): 'success' | 'warning' | 'error' | 'info' {
  if (status === 'ON_TRACK' || status === 'COMPLETED' || status === 'DONE') {
    return 'success';
  }
  if (status === 'ATTENTION' || status === 'ON_HOLD') {
    return 'warning';
  }
  if (status === 'CRITICAL' || status === 'DELAYED' || status === 'STALLED' || status === 'IMMEDIATE' || status === 'OVERDUE') {
    return 'error';
  }
  return 'info';
}
