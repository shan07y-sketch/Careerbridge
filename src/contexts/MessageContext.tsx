import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Thread, Message } from '../types';
import { MessageService } from '../services';
import { useAuth } from './AuthContext';

interface MessageContextType {
  threads: Thread[];
  activeThreadId: string | null;
  messages: Message[];
  unreadCount: number;
  isLoading: boolean;
  setActiveThreadId: (id: string | null) => void;
  sendMessage: (content: string) => Promise<void>;
  loadMessages: (threadId: string) => Promise<void>;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, isAuthenticated } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadIdState] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchThreads = useCallback(async () => {
    try {
      const items = await MessageService.getThreads();
      setThreads(items);
    } catch (err) {
      console.error('Failed to load chat threads', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // The /messages endpoints are student-scoped; other portals (employer,
  // university, admin) have their own messaging surfaces and would 404 here.
  const isStudent = (role ?? '').toLowerCase() === 'student';

  useEffect(() => {
    if (isAuthenticated && isStudent) {
      fetchThreads();
    } else {
      setThreads([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, isStudent, fetchThreads]);

  const loadMessages = useCallback(async (threadId: string) => {
    try {
      const items = await MessageService.getMessagesByThreadId(threadId);
      setMessages(items);
      
      // Reset thread unread count
      setThreads(prev =>
        prev.map(t => (t.id === threadId ? { ...t, unreadCount: 0 } : t))
      );
    } catch (err) {
      console.error('Failed to load thread messages', err);
    }
  }, []);

  const setActiveThreadId = (id: string | null) => {
    setActiveThreadIdState(id);
    if (id) {
      loadMessages(id);
    } else {
      setMessages([]);
    }
  };

  const sendMessage = async (content: string) => {
    if (!activeThreadId || !user) return;
    try {
      const newMsg = await MessageService.sendMessage(activeThreadId, user.id, content);
      setMessages(prev => [...prev, newMsg]);
      
      // Re-order threads or update last message
      setThreads(prev =>
        prev.map(t =>
          t.id === activeThreadId
            ? {
                ...t,
                lastMessage: content,
                lastMessageTime: newMsg.timestamp
              }
            : t
        )
      );
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const unreadCount = threads.reduce((acc, t) => acc + t.unreadCount, 0);

  return (
    <MessageContext.Provider
      value={{
        threads,
        activeThreadId,
        messages,
        unreadCount,
        isLoading,
        setActiveThreadId,
        sendMessage,
        loadMessages
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) throw new Error('useMessages must be used within a MessageProvider');
  return context;
};
