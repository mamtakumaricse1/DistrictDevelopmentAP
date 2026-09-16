import { isUuidLike } from './uuid-like';

describe('isUuidLike', () => {
  it('accepts seeded district ids that are not RFC version-4 UUIDs', () => {
    expect(isUuidLike('11111111-1111-1111-1111-111111111111')).toBe(true);
    expect(isUuidLike('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1')).toBe(true);
  });

  it('accepts RFC v4 UUIDs', () => {
    expect(isUuidLike('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('rejects empty and malformed values', () => {
    expect(isUuidLike('')).toBe(false);
    expect(isUuidLike('changlang')).toBe(false);
    expect(isUuidLike('11111111-1111-1111-1111-11111111111')).toBe(false);
  });
});
