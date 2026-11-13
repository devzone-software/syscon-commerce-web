/** Inactivity timing shared by every open tab of the store (pure helpers, tested). */

export const ACTIVITY_KEY = 'syscon.activity';
/** The warning shows this long before the session closes (less for very short limits). */
export const WARNING_MS = 60_000;

/** Idle limit rendered by Laravel (SESSION_IDLE_MINUTES); 15 minutes if missing. */
export function idleLimitMs(doc: Document = document) {
  const minutes = Number(
    doc.querySelector<HTMLMetaElement>('meta[name="session-idle-minutes"]')?.content,
  );
  return (Number.isFinite(minutes) && minutes > 0 ? minutes : 15) * 60_000;
}

export type IdlePhase = { phase: 'active' | 'warning' | 'expired'; remainingMs: number };

export function idlePhase(lastActivity: number, now: number, limitMs: number): IdlePhase {
  const remainingMs = Math.max(0, lastActivity + limitMs - now);
  const warning = Math.min(WARNING_MS, limitMs / 4);
  if (remainingMs === 0) return { phase: 'expired', remainingMs };
  return { phase: remainingMs <= warning ? 'warning' : 'active', remainingMs };
}

/** 59 000 → "0:59" */
export function countdown(ms: number) {
  const seconds = Math.ceil(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** Last activity of any tab; storage may be unavailable (private mode), then this tab's own time. */
export function readActivity(fallback: number) {
  try {
    const value = Number(localStorage.getItem(ACTIVITY_KEY));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  } catch {
    return fallback;
  }
}

export function writeActivity(time: number) {
  try {
    localStorage.setItem(ACTIVITY_KEY, String(time));
  } catch {
    // Without storage each tab keeps its own timer.
  }
}
