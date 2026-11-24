import { useEffect, useRef, type ReactNode } from 'react';

/** Keeps supporting information available without extending the primary task. */
export function ContentDisclosure({ title, children }: { title: string; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const reveal = () => {
      let target: HTMLElement | null = null;
      try {
        target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      } catch {
        return;
      }
      if (target && ref.current?.contains(target)) {
        ref.current.open = true;
        requestAnimationFrame(() => target?.scrollIntoView({ block: 'start' }));
      }
    };
    reveal();
    window.addEventListener('hashchange', reveal);
    return () => window.removeEventListener('hashchange', reveal);
  }, []);
  return (
    <div className="container content-disclosure-wrap">
      <details className="content-disclosure" ref={ref}>
        <summary>{title}</summary>
        {children}
      </details>
    </div>
  );
}
