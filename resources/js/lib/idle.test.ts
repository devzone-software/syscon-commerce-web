import { describe, expect, it } from 'vitest';
import { countdown, idleLimitMs, idlePhase } from './idle';

const minute = 60_000;

describe('inactivity timing', () => {
  it('warns during the last minute and expires at the limit', () => {
    const limit = 15 * minute;
    expect(idlePhase(0, 10 * minute, limit)).toEqual({ phase: 'active', remainingMs: 5 * minute });
    expect(idlePhase(0, 14 * minute + 1_000, limit)).toEqual({
      phase: 'warning',
      remainingMs: 59_000,
    });
    expect(idlePhase(0, 15 * minute, limit).phase).toBe('expired');
    expect(idlePhase(0, 40 * minute, limit)).toEqual({ phase: 'expired', remainingMs: 0 });
  });

  it('keeps the warning short for very short limits', () => {
    // 1-minute limit: the warning starts with 15 s left, not at once.
    expect(idlePhase(0, 30_000, minute).phase).toBe('active');
    expect(idlePhase(0, 50_000, minute).phase).toBe('warning');
  });

  it('formats the countdown', () => {
    expect(countdown(59_000)).toBe('0:59');
    expect(countdown(60_000)).toBe('1:00');
    expect(countdown(1)).toBe('0:01');
  });

  it('reads the limit from the page and falls back to 15 minutes', () => {
    // Tests run without a browser: a minimal stand-in for the page's <meta> tag.
    const page = (content?: string) =>
      ({
        querySelector: () => (content === undefined ? null : { content }),
      }) as unknown as Document;
    expect(idleLimitMs(page())).toBe(15 * minute);
    expect(idleLimitMs(page('30'))).toBe(30 * minute);
    expect(idleLimitMs(page('abc'))).toBe(15 * minute);
  });
});
