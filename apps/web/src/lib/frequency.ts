export const REPORTING_FREQUENCIES = ['MONTHLY', 'QUARTERLY', 'YEARLY'] as const;

export type ReportingFrequency = (typeof REPORTING_FREQUENCIES)[number];

export function frequencyLabel(value: string | null | undefined): string {
  if (value === 'QUARTERLY') {
    return 'Quarterly';
  }
  if (value === 'YEARLY') {
    return 'Yearly';
  }
  return 'Monthly';
}
