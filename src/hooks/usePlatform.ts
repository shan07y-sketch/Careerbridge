/**
 * Platform & viewport detection for adaptive rendering.
 *
 * Three-pronged detection — not just window.innerWidth:
 *  1. Capacitor.isNativePlatform() → running inside the Android/iOS shell.
 *  2. navigator.maxTouchPoints → touch-capable device (tablet or phone).
 *  3. matchMedia max-width  → narrow viewport (< 1024px).
 *
 * The hook returns reactive booleans that update on resize so components
 * can swap presentation at render time without forking route paths.
 *
 * This is shared infrastructure — NEVER import platform-specific UI here.
 */
import { useState, useSyncExternalStore } from 'react';
import { Capacitor } from '@capacitor/core';

/* ------------------------------------------------------------------ */
/*  Static platform facts (don't change during the session)           */
/* ------------------------------------------------------------------ */

/** True when the app is running inside the Capacitor Android/iOS shell. */
export const isNative = Capacitor.isNativePlatform();

/** True when the browser/webview reports touch capability. */
export const isTouchDevice =
  typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;

/** Platform family — narrows to one of these at startup. */
export type PlatformFamily = 'native' | 'tablet' | 'mobile-web' | 'desktop';

export const getPlatformFamily = (): PlatformFamily => {
  if (isNative) return 'native';
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (isTouchDevice && w < 1024) return w >= 768 ? 'tablet' : 'mobile-web';
  if (w < 1024) return 'mobile-web';
  return 'desktop';
};

/* ------------------------------------------------------------------ */
/*  Reactive viewport width via useSyncExternalStore (zero re-renders  */
/*  when the value hasn't crossed a breakpoint boundary)               */
/* ------------------------------------------------------------------ */

type ViewportTier = 'compact' | 'medium' | 'expanded';

const breakpoints: [number, ViewportTier][] = [
  [768, 'compact'],   // < 768 → phones
  [1024, 'medium'],   // 768..1023 → tablets / collapsed desktop
  [Infinity, 'expanded'], // ≥ 1024 → full desktop
];

const getTier = (): ViewportTier => {
  if (typeof window === 'undefined') return 'expanded';
  const w = window.innerWidth;
  for (const [max, tier] of breakpoints) {
    if (w < max) return tier;
  }
  return 'expanded';
};

let currentTier = getTier();
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    const next = getTier();
    if (next !== currentTier) {
      currentTier = next;
      listeners.forEach(fn => fn());
    }
  });
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
};
const getSnapshot = () => currentTier;
const getServerSnapshot = (): ViewportTier => 'expanded';

/* ------------------------------------------------------------------ */
/*  Public hooks                                                       */
/* ------------------------------------------------------------------ */

/**
 * Returns true when the user should see the mobile/touch-optimized UI.
 * Covers Capacitor native, mobile browsers AND tablets in portrait.
 */
export function useIsMobile(): boolean {
  const tier = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return isNative || tier === 'compact' || tier === 'medium';
}

/**
 * Returns the current viewport tier and platform family for fine-grained
 * layout decisions (e.g. two-column tablet vs single-column phone).
 */
export function usePlatform() {
  const tier = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [family] = useState<PlatformFamily>(getPlatformFamily);
  return { tier, family, isNative, isTouchDevice, isMobile: isNative || tier === 'compact' || tier === 'medium' };
}
