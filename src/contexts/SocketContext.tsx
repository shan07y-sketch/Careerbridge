import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  isConnected: boolean;
  typingUsers: { [conversationId: string]: { [userId: string]: string } };
  connect: () => void;
  disconnect: () => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  setStatusAway: () => void;
  setStatusOnline: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used inside a SocketProvider');
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ [convId: string]: { [userId: string]: string } }>({});
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutsRef = useRef<{ [key: string]: any }>({});

  const connect = () => {
    if (socketRef.current?.connected) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('Socket connection skipped: access token not found.');
      return;
    }

    const socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('WS connection established successfully.');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('WS connection closed.');
      setIsConnected(false);
    });

    // Handle typing-started indicators with auto-clear timers
    socket.on('typing-started', (data: { conversationId: string; userId: string; name: string }) => {
      const key = `${data.conversationId}_${data.userId}`;
      
      // Clear previous timer if exists
      if (typingTimeoutsRef.current[key]) {
        clearTimeout(typingTimeoutsRef.current[key]);
      }

      setTypingUsers(prev => {
        const conv = prev[data.conversationId] || {};
        return {
          ...prev,
          [data.conversationId]: {
            ...conv,
            [data.userId]: data.name
          }
        };
      });

      // Automatically clear after 3 seconds of inactivity
      typingTimeoutsRef.current[key] = setTimeout(() => {
        setTypingUsers(prev => {
          const conv = { ...(prev[data.conversationId] || {}) };
          delete conv[data.userId];
          return {
            ...prev,
            [data.conversationId]: conv
          };
        });
        delete typingTimeoutsRef.current[key];
      }, 3000);
    });

    socket.on('typing-stopped', (data: { conversationId: string; userId: string }) => {
      const key = `${data.conversationId}_${data.userId}`;
      if (typingTimeoutsRef.current[key]) {
        clearTimeout(typingTimeoutsRef.current[key]);
        delete typingTimeoutsRef.current[key];
      }

      setTypingUsers(prev => {
        const conv = { ...(prev[data.conversationId] || {}) };
        delete conv[data.userId];
        return {
          ...prev,
          [data.conversationId]: conv
        };
      });
    });

    socketRef.current = socket;
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  };

  const joinConversation = (conversationId: string) => {
    socketRef.current?.emit('join-conversation', conversationId);
  };

  const leaveConversation = (conversationId: string) => {
    socketRef.current?.emit('leave-conversation', conversationId);
  };

  const sendTyping = (conversationId: string) => {
    socketRef.current?.emit('typing-start', conversationId);
  };

  const stopTyping = (conversationId: string) => {
    socketRef.current?.emit('typing-stop', conversationId);
  };

  const setStatusAway = () => {
    socketRef.current?.emit('status-away');
  };

  const setStatusOnline = () => {
    socketRef.current?.emit('status-online');
  };

  useEffect(() => {
    // Auto-connect if authenticated
    const savedAuth = localStorage.getItem('isAuthenticated') === 'true';
    if (savedAuth) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{
      isConnected,
      typingUsers,
      connect,
      disconnect,
      joinConversation,
      leaveConversation,
      sendTyping,
      stopTyping,
      setStatusAway,
      setStatusOnline
    }}>
      {children}
    </SocketContext.Provider>
  );
};
