import { z } from 'zod';
import { UUID_LIKE } from './ids';

function fieldLabel(path: PropertyKey[]): string {
  const last = path[path.length - 1];
  if (typeof last !== 'string' || !last) {
    return 'This field';
  }
  const words = last
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

z.setErrorMap((issue, ctx) => {
  const label = fieldLabel(issue.path);
  if (issue.code === z.ZodIssueCode.invalid_type) {
    return { message: `${label} is required.` };
  }
  if (issue.code === z.ZodIssueCode.too_small) {
    if (issue.type === 'string') {
      return { message: Number(issue.minimum) <= 1 ? `${label} is required.` : `${label} must be at least ${issue.minimum} characters.` };
    }
    if (issue.type === 'number') {
      return { message: `${label} must be ${issue.minimum} or more.` };
    }
  }
  if (issue.code === z.ZodIssueCode.too_big) {
    if (issue.type === 'string') {
      return { message: `${label} must be at most ${issue.maximum} characters.` };
    }
    if (issue.type === 'number') {
      return { message: `${label} must be ${issue.maximum} or less.` };
    }
  }
  if (issue.code === z.ZodIssueCode.invalid_string) {
    if (issue.validation === 'email') {
      return { message: 'Enter a valid email address.' };
    }
    return { message: `${label} is not in the expected format.` };
  }
  if (issue.code === z.ZodIssueCode.invalid_enum_value) {
    return { message: `Choose a valid ${label.toLowerCase()}.` };
  }
  const fallback = ctx.defaultError === 'Required' ? `${label} is required.` : ctx.defaultError;
  return { message: fallback };
});

export const periodYmSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use a month in YYYY-MM format, for example 2026-09.');
export const uuidSchema = z.string().regex(UUID_LIKE, 'Select a valid record.');
export const optionalUuidSchema = z.union([uuidSchema, z.literal('')]).optional();
export const percentSchema = z.coerce.number({ invalid_type_error: 'Enter a number.' }).min(0, 'Enter a percentage from 0 to 100.').max(100, 'Enter a percentage from 0 to 100.');
export const moneySchema = z
  .string()
  .optional()
  .refine((value) => !value || (!Number.isNaN(Number(value)) && Number(value) >= 0), 'Enter an amount of 0 or more.');

export const projectCreateSchema = z
  .object({
    name: z.string().min(3).max(300),
    departmentId: uuidSchema,
    implementingAgencyId: optionalUuidSchema,
    executingAgencyId: optionalUuidSchema,
    financialYear: z.coerce.number().int().min(2000).max(2100),
    sanctionedAmount: moneySchema,
    releasedAmount: moneySchema,
    contractor: z.string().max(200).optional(),
    category: z.enum(['ROAD', 'BRIDGE', 'CULVERT', 'WATER', 'BUILDING', 'OTHER', '']).optional(),
    workType: z.enum(['NH', 'PWD', 'RWD', 'PMGSY', 'OTHER', '']).optional(),
    description: z.string().max(4000).optional(),
    locationText: z.string().max(300).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    expectedCompletion: z.string().optional(),
  })
  .refine((value) => !value.startDate || !value.endDate || value.startDate <= value.endDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  });

export const projectUpdateSchema = z.object({
  name: z.string().min(3).max(300),
  status: z.enum(['DRAFT', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CLOSED']),
  sanctionedAmount: moneySchema,
  locationText: z.string().max(300).optional(),
  description: z.string().max(4000).optional(),
});

export const progressSchema = z.object({
  periodYm: periodYmSchema,
  physicalPercent: percentSchema,
  financialAmount: moneySchema,
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'DELAYED', 'STALLED', 'COMPLETED']),
  remarks: z.string().max(4000).optional(),
});

export const kpiProgressSchema = z.object({
  kpiId: uuidSchema,
  periodYm: periodYmSchema,
  target: z.coerce.number().min(0),
  achievement: z.coerce.number().min(0),
  physicalPercent: percentSchema,
  financialPercent: z.union([percentSchema, z.nan()]).optional(),
  fundAllocated: moneySchema,
  fundReleased: moneySchema,
  expenditure: moneySchema,
});

export const actionCreateSchema = z.object({
  districtId: uuidSchema,
  title: z.string().min(3).max(300),
  departmentId: optionalUuidSchema,
  locationText: z.string().max(300).optional(),
  officerName: z.string().max(200).optional(),
  dcDirection: z.string().max(4000).optional(),
  severity: z.enum(['IMMEDIATE', 'ATTENTION', 'ROUTINE']),
  dueDate: z.string().optional(),
});

export const meetingCreateSchema = z.object({
  districtId: uuidSchema,
  title: z.string().min(3).max(300),
  scheduledAt: z.string().min(1, 'Scheduled time is required'),
  venue: z.string().max(200).optional(),
  notes: z.string().max(4000).optional(),
  nextReviewAt: z.string().optional(),
});

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ALLOWED_UPLOAD_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export function validateUpload(file: File): string | null {
  if (file.size > MAX_UPLOAD_BYTES) {
    return 'File must be 10 MB or smaller.';
  }
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
    return 'Upload a PDF, JPEG, PNG, or WebP file.';
  }
  return null;
}
