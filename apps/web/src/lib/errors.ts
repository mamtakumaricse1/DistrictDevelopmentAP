import { ApiError } from '../services/api/client';

export type UserMessage = {
  summary: string;
  details: string[];
};

function looksTechnical(message: string): boolean {
  return (
    message.length > 240 ||
    /request failed \(\d+\)|internal server error|prisma|econn|sql|exception|cannot |must be a uuid|regular expression/i.test(message)
  );
}

export function userFacingMessage(error: unknown): UserMessage {
  if (typeof error === 'string' && error.trim()) {
    return { summary: error, details: [] };
  }
  if (!(error instanceof Error) || !error.message.trim()) {
    return { summary: 'The request could not be completed.', details: [] };
  }
  if (/failed to fetch|networkerror|network request failed/i.test(error.message)) {
    return { summary: 'The service is unavailable. Check your connection and try again.', details: [] };
  }
  if (error instanceof ApiError) {
    if (error.status >= 500) {
      return { summary: 'Something went wrong. Please try again.', details: [] };
    }
    if (error.status === 401) {
      return { summary: 'Your session has expired. Sign in again.', details: [] };
    }
    const details = error.details.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    if (error.status === 403) {
      const summary = looksTechnical(error.message) ? 'You do not have permission to do this.' : error.message;
      return { summary, details: details.filter((item) => item !== summary) };
    }
    if (error.status === 404) {
      return { summary: looksTechnical(error.message) ? 'That record was not found.' : error.message, details: [] };
    }
    const summary = looksTechnical(error.message) ? (details[0] ?? 'Check the form and try again.') : error.message;
    return { summary, details: details.filter((item) => item !== summary) };
  }
  return {
    summary: looksTechnical(error.message) ? 'The request could not be completed.' : error.message,
    details: [],
  };
}
