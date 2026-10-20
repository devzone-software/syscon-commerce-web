import { describe, expect, it } from 'vitest';
import {
  clampWidth,
  defaultLayout,
  loadLayout,
  saveLayout,
  SIDEBAR_WIDTH,
} from './backofficeLayout';

const memory = () => {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  } as Storage;
};

describe('backoffice layout', () => {
  it('keeps the sidebar width within limits', () => {
    expect(clampWidth(50)).toBe(SIDEBAR_WIDTH.min);
    expect(clampWidth(999)).toBe(SIDEBAR_WIDTH.max);
    expect(clampWidth(300.4)).toBe(300);
  });

  it('remembers the saved layout', () => {
    const storage = memory();
    expect(loadLayout(storage)).toEqual(defaultLayout);
    saveLayout({ collapsed: true, width: 310 }, storage);
    expect(loadLayout(storage)).toEqual({ collapsed: true, width: 310 });
  });

  it('falls back to the default on bad or blocked storage', () => {
    const storage = memory();
    storage.setItem('syscon.backoffice.layout', '{not json');
    expect(loadLayout(storage)).toEqual(defaultLayout);
    storage.setItem('syscon.backoffice.layout', JSON.stringify({ collapsed: 'yes', width: 5000 }));
    expect(loadLayout(storage)).toEqual({ collapsed: false, width: SIDEBAR_WIDTH.max });
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;
    expect(loadLayout(blocked)).toEqual(defaultLayout);
    expect(() => saveLayout(defaultLayout, blocked)).not.toThrow();
  });
});
