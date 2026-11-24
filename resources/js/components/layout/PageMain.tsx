import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/** Shared page entrance; headers, sidebars and footers stay outside the animation. */
export function PageMain({
  children,
  className,
  resetKey,
}: {
  children: ReactNode;
  className?: string;
  resetKey?: string;
}) {
  const region = useRef<HTMLElement>(null);
  const previousResetKey = useRef(resetKey);
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    const main = region.current;
    if (!main) return;

    // Query changes (filters, sorting, pagination) do not restart the page.
    // Leave Back/Forward restoration to the browser.
    if (navigationType !== 'POP' || previousResetKey.current !== resetKey) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    previousResetKey.current = resetKey;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches || typeof main.animate !== 'function') return;

    const animation = main.animate([{ opacity: 0.35 }, { opacity: 1 }], {
      duration: 180,
      easing: 'ease-out',
    });
    const cancel = () => animation.cancel();
    motion.addEventListener('change', cancel);
    return () => {
      animation.cancel();
      motion.removeEventListener('change', cancel);
    };
    // Navigation type alone must not animate a filter update on the same page.
  }, [pathname, resetKey]);

  return (
    <main className={className} ref={region}>
      {children}
    </main>
  );
}
