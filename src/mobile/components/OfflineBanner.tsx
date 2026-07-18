/**
 * OfflineBanner — slides in under the header whenever connectivity drops.
 * State comes from the shared OfflineQueueContext (Capacitor Network on
 * device, browser events on the web) — no logic duplicated here.
 */
import React from 'react';
import { useOfflineQueue } from '../../contexts/OfflineQueueContext';

export const OfflineBanner: React.FC = () => {
  const { isOnline } = useOfflineQueue();
  if (isOnline) return null;

  return (
    <div role="status" className="m-banner sticky top-0 z-40 bg-error text-on-error text-center text-xs font-semibold py-1.5 px-4">
      No internet connection — changes will sync when you're back online
    </div>
  );
};
