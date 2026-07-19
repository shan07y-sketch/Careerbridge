import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Network } from '@capacitor/network';
import { useToast } from './ToastContext';

interface OfflineQueueContextType {
  isOnline: boolean;
  queueRequest: (op: () => Promise<any>, description: string) => void;
}

const OfflineQueueContext = createContext<OfflineQueueContextType | undefined>(undefined);

export const useOfflineQueue = () => {
  const context = useContext(OfflineQueueContext);
  if (!context) throw new Error('useOfflineQueue must be used inside OfflineQueueProvider');
  return context;
};

export const OfflineQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const queueRef = useRef<Array<{ op: () => Promise<any>; description: string }>>([]);
  const { showToast } = useToast();

  const replayQueue = async () => {
    const temp = [...queueRef.current];
    queueRef.current = [];

    for (const item of temp) {
      try {
        await item.op();
        showToast(`Successfully synchronized: ${item.description}`, 'success');
      } catch (err) {
        queueRef.current.push(item);
        showToast(`Sync failed, keeping in queue: ${item.description}`, 'error');
      }
    }
  };

  useEffect(() => {
    const initNetwork = async () => {
      try {
        const status = await Network.getStatus();
        setIsOnline(status.connected);
      } catch {
        // Network plugin unavailable — assume online so the app stays usable.
        setIsOnline(true);
      }
    };

    initNetwork();

    let listener: ReturnType<typeof Network.addListener> | undefined;
    try {
      listener = Network.addListener('networkStatusChange', status => {
        setIsOnline(status.connected);
        if (status.connected) {
          showToast('Internet connection restored. Syncing pending requests...', 'success');
          replayQueue();
        } else {
          showToast('Internet connection lost. Switched to offline mode.', 'error');
        }
      });
    } catch {
      /* no-op: network change events unavailable on this platform */
    }

    return () => {
      listener?.then(h => h.remove());
    };
  }, []);

  const queueRequest = (op: () => Promise<any>, description: string) => {
    if (isOnline) {
      op().catch(() => {
        queueRef.current.push({ op, description });
        showToast(`Request failed. Saved to offline queue: ${description}`, 'info');
      });
    } else {
      queueRef.current.push({ op, description });
      showToast(`Saved to offline queue: ${description}`, 'info');
    }
  };

  return (
    <OfflineQueueContext.Provider value={{ isOnline, queueRequest }}>
      {children}
    </OfflineQueueContext.Provider>
  );
};
