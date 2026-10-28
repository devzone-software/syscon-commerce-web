/** Backoffice sidebar preferences, remembered per browser. */
export type BackofficeLayout = { collapsed: boolean; width: number };

/** Sidebar width limits in px; the default matches the original fixed column. */
export const SIDEBAR_WIDTH = { min: 180, max: 420, default: 232, step: 16 };

const KEY = 'syscon.backoffice.layout';

export const defaultLayout: BackofficeLayout = { collapsed: false, width: SIDEBAR_WIDTH.default };

export const clampWidth = (width: number) =>
  Math.round(Math.min(SIDEBAR_WIDTH.max, Math.max(SIDEBAR_WIDTH.min, width)));

/** Reads the saved layout; storage can be missing or blocked, so any failure gives the default. */
export function loadLayout(storage?: Storage): BackofficeLayout {
  try {
    const saved = JSON.parse((storage ?? globalThis.localStorage)?.getItem(KEY) ?? 'null');
    if (!saved || typeof saved !== 'object') return defaultLayout;
    return {
      collapsed: saved.collapsed === true,
      width: Number.isFinite(saved.width) ? clampWidth(saved.width) : SIDEBAR_WIDTH.default,
    };
  } catch {
    return defaultLayout;
  }
}

export function saveLayout(layout: BackofficeLayout, storage?: Storage) {
  try {
    (storage ?? globalThis.localStorage)?.setItem(KEY, JSON.stringify(layout));
  } catch {
    // Without storage the layout simply resets on the next visit.
  }
}
