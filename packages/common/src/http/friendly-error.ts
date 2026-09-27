import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

function fieldLabel(property: string): string {
  const leaf = property.split('.').pop() ?? property;
  const words = leaf
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .trim()
    .toLowerCase();
  if (!words) {
    return 'This field';
  }
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function friendlyValidationLine(raw: string, property?: string): string {
  const label = fieldLabel(property ?? raw.split(' ')[0] ?? '');
  const text = raw.trim();
  const minLength = text.match(/longer than or equal to (\d+) characters/i);
  if (minLength) {
    return `${label} must be at least ${minLength[1]} characters.`;
  }
  const maxLength = text.match(/shorter than or equal to (\d+) characters/i);
  if (maxLength) {
    return `${label} must be at most ${maxLength[1]} characters.`;
  }
  const minNumber = text.match(/must not be less than (-?\d+(?:\.\d+)?)/i);
  if (minNumber) {
    return `${label} must be ${minNumber[1]} or more.`;
  }
  const maxNumber = text.match(/must not be greater than (-?\d+(?:\.\d+)?)/i);
  if (maxNumber) {
    return `${label} must be ${maxNumber[1]} or less.`;
  }
  if (/must be an email/i.test(text)) {
    return 'Enter a valid email address.';
  }
  if (/must be a uuid/i.test(text)) {
    return `Select a valid ${label.toLowerCase()}.`;
  }
  if (/regular expression/i.test(text)) {
    return `${label} is not in the expected format.`;
  }
  if (/should not be empty|must not be empty/i.test(text)) {
    return `${label} is required.`;
  }
  if (/must be a number|must be a number string/i.test(text)) {
    return `${label} must be a number.`;
  }
  if (/must be an integer/i.test(text)) {
    return `${label} must be a whole number.`;
  }
  if (/must be a boolean/i.test(text)) {
    return `${label} must be yes or no.`;
  }
  if (/must be one of the following values/i.test(text)) {
    return `Choose a valid ${label.toLowerCase()}.`;
  }
  if (/should not exist/i.test(text)) {
    return 'The form includes a field that is not allowed.';
  }
  if (/iso 8601|must be a date/i.test(text)) {
    return `Enter a valid date for ${label.toLowerCase()}.`;
  }
  if (text.length > 240 || /prisma|econn|sql|exception|at \w+\./i.test(text)) {
    return 'Check the form and try again.';
  }
  return text.endsWith('.') ? text : `${text}.`;
}

export function flattenValidationErrors(errors: ValidationError[], prefix = ''): string[] {
  const lines: string[] = [];
  for (const error of errors) {
    const property = prefix ? `${prefix}.${error.property}` : error.property;
    for (const constraint of Object.values(error.constraints ?? {})) {
      lines.push(friendlyValidationLine(constraint, property));
    }
    if (error.children?.length) {
      lines.push(...flattenValidationErrors(error.children, property));
    }
  }
  return lines;
}

export function validationException(errors: ValidationError[]): BadRequestException {
  const details = flattenValidationErrors(errors);
  return new BadRequestException({
    message: details[0] ?? 'Check the form and try again.',
    details,
  });
}

export function publicErrorMessage(status: number, message: string): string {
  if (status >= 500) {
    return 'Something went wrong. Please try again.';
  }
  if (status === 401 && /^unauthorized\.?$/i.test(message)) {
    return 'Your session has expired. Sign in again.';
  }
  if (status === 403 && /^forbidden\.?$/i.test(message)) {
    return 'You do not have permission to do this.';
  }
  if (status === 404 && /^not found\.?$/i.test(message)) {
    return 'That record was not found.';
  }
  return friendlyValidationLine(message);
}
