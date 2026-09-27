import { friendlyValidationLine, publicErrorMessage } from './friendly-error';

describe('friendly validation messages', () => {
  it('turns class-validator text into a field message', () => {
    expect(friendlyValidationLine('title must be longer than or equal to 3 characters', 'title')).toBe(
      'Title must be at least 3 characters.',
    );
    expect(friendlyValidationLine('email must be an email', 'email')).toBe('Enter a valid email address.');
    expect(friendlyValidationLine('periodYm must match /^\\d{4}$/ regular expression', 'periodYm')).toBe(
      'Period ym is not in the expected format.',
    );
  });

  it('hides internal failures', () => {
    expect(publicErrorMessage(500, 'PrismaClientKnownRequestError')).toBe('Something went wrong. Please try again.');
    expect(publicErrorMessage(401, 'Unauthorized')).toBe('Your session has expired. Sign in again.');
    expect(publicErrorMessage(403, 'You are not allowed to access this department.')).toBe(
      'You are not allowed to access this department.',
    );
  });
});
