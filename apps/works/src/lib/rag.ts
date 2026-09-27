export type RagStatus = 'ON_TRACK' | 'ATTENTION' | 'CRITICAL';

export function ragStatus(achievement: number, green = 90, amber = 70): RagStatus {
  if (achievement >= green) {
    return 'ON_TRACK';
  }
  if (achievement >= amber) {
    return 'ATTENTION';
  }
  return 'CRITICAL';
}

export function asNumber(value: { toNumber?: () => number; toString(): string } | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  return Number(value.toString());
}
