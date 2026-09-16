import { buildMessage, ValidateBy, type ValidationOptions } from 'class-validator';

export const UUID_LIKE_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuidLike(value: unknown): value is string {
  return typeof value === 'string' && UUID_LIKE_PATTERN.test(value);
}

/** Accepts RFC UUIDs and the fixed seed ids (e.g. 11111111-1111-1111-1111-111111111111). */
export function IsUuidLike(validationOptions?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isUuidLike',
      validator: {
        validate: (value: unknown) => isUuidLike(value),
        defaultMessage: buildMessage((eachPrefix) => `${eachPrefix}$property must be a UUID`, validationOptions),
      },
    },
    validationOptions,
  );
}
