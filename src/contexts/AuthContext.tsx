import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Student } from '../types';
import { ProfileService, AuthService } from '../services';

interface AuthContextType {
  user: Student | null;
  isAuthenticated: boolean;
  role: 'student' | 'employer' | 'university' | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  selectRole: (role: 'student' | 'employer' | 'university') => void;
  registerStudent: (name: string, email: string, university: string, degree: string, gradYear: number) => Promise<void>;
  updateUser: (updates: Partial<Student>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Student | null>(null);
  const [role, setRoleState] = useState<'student' | 'employer' | 'university' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedAuth = localStorage.getItem('isAuthenticated') === 'true';
        const savedRole = localStorage.getItem('role') as 'student' | 'employer' | 'university' | null;
        
        if (savedAuth) {
          const profile = await ProfileService.getStudentProfile();
          setUser(profile);
          setIsAuthenticated(true);
          setRoleState(savedRole || 'student');
        }
      } catch (err) {
        console.error('Failed to restore auth state', err);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const profile = await AuthService.login(email, password);
      setUser(profile);
      setIsAuthenticated(true);
      setRoleState('student');
    } catch (err) {
      console.warn('API Authentication failed. Using mock student profile fallback...', err);
      // Fallback on offline/disconnected modes
      const profile = await ProfileService.getStudentProfile();
      setUser(profile);
      setIsAuthenticated(true);
      setRoleState('student');
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('role', 'student');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setUser(null);
    setIsAuthenticated(false);
    setRoleState(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('role');
    localStorage.removeItem('accessToken');
  };

  const selectRole = (newRole: 'student' | 'employer' | 'university') => {
    setRoleState(newRole);
    localStorage.setItem('role', newRole);
  };

  const registerStudent = async (name: string, email: string, university: string, degree: string, gradYear: number): Promise<void> => {
    setIsLoading(true);
    try {
      await AuthService.register(name, email, university, degree, gradYear);
      const profile = await AuthService.login(email, 'Password123!');
      setUser(profile);
      setIsAuthenticated(true);
      setRoleState('student');
    } catch (err) {
      console.warn('API Registration failed. Using mock updates fallback...', err);
      const updatedProfile = await ProfileService.updateStudentProfile({
        name,
        email,
        university,
        degree,
        gradYear
      });
      setUser(updatedProfile);
      setIsAuthenticated(true);
      setRoleState('student');
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('role', 'student');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updates: Partial<Student>): Promise<void> => {
    try {
      const updated = await ProfileService.updateStudentProfile(updates);
      setUser(updated);
    } catch (err) {
      console.error('Failed to update student profile', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        role,
        isLoading,
        login,
        logout,
        selectRole,
        registerStudent,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
