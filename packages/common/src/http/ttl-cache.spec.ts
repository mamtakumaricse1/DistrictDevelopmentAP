import { TtlCache } from './ttl-cache';

describe('TtlCache', () => {
  it('returns a value within its TTL', () => {
    const cache = new TtlCache<string>();
    cache.set('k', 'v', 10_000);
    expect(cache.get('k')).toBe('v');
  });

  it('expires values', () => {
    jest.useFakeTimers();
    const cache = new TtlCache<string>();
    cache.set('k', 'v', 1_000);
    jest.advanceTimersByTime(1_001);
    expect(cache.get('k')).toBeUndefined();
    jest.useRealTimers();
  });

  it('ignores non-positive TTL', () => {
    const cache = new TtlCache<string>();
    cache.set('k', 'v', 0);
    expect(cache.get('k')).toBeUndefined();
  });
});
