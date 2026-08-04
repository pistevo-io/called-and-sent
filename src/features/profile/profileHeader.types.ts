import { useEffect, useState } from 'react';
import type { ElementType } from 'react';

export interface ProfileIdentity {
  name: string;
  initials: string;
  role?: string;
  tags?: { label: string; blue?: boolean }[];
}

export interface ProfileTabDef {
  key: string;
  icon: ElementType;
  label: string;
}

/* ---------- Scroll-collapse behavior hook ---------- */
export function useProfileScrollState(threshold = 120): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      setScrolled(window.scrollY > threshold);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return scrolled;
}
