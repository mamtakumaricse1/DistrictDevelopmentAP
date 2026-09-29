import { describe, expect, it } from 'vitest';
import { orderLoginOptions } from './passwordLogin';

describe('orderLoginOptions', () => {
  const options = [
    { kind: 'district', realm: 'changlang', code: 'CHANGLANG', issuer: 'http://localhost/realms/changlang' },
    { kind: 'system', realm: 'system', code: 'SYSTEM', issuer: 'http://localhost/realms/system' },
  ];

  it('tries the matching account store first without exposing it', () => {
    expect(orderLoginOptions(options, 'da.changlang').map((item) => item.realm)).toEqual(['changlang', 'system']);
    expect(orderLoginOptions(options, 'sys.admin').map((item) => item.realm)).toEqual(['changlang', 'system']);
  });
});
