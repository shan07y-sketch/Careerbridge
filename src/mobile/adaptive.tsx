/**
 * adaptive() — route-level component selection without forking URLs.
 *
 * Each route keeps ONE path; at render time the platform decides which
 * presentation loads. React.lazy factories only run when the chosen
 * component actually renders, so:
 *   - desktop users never download mobile chunks
 *   - mobile users never download desktop chunks
 *
 * Detection comes from usePlatform (Capacitor native check + touch +
 * viewport tier) — never window.innerWidth alone.
 */
import React, { lazy } from 'react';
import { useIsMobile } from '../hooks/usePlatform';

type Importer<P> = () => Promise<{ default: React.ComponentType<P> }>;

export function adaptive<P extends object = Record<string, never>>(
  desktop: Importer<P>,
  mobile: Importer<P>,
): React.FC<P> {
  const Desktop = lazy(desktop);
  const Mobile = lazy(mobile);
  const Adaptive: React.FC<P> = (props: P) => {
    const isMobile = useIsMobile();
    return isMobile ? <Mobile {...(props as any)} /> : <Desktop {...(props as any)} />;
  };
  return Adaptive;
}
