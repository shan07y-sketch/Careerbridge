import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Student } from '../types';
import { ProfileService, AuthService } from '../services';

interface AuthContextType {
  user: Student | null;
  isAuthenticated: boolean;
  role: 'student' | 'employer' | 'university' | 'admin' | null;
  isLoading: boolean;
  login: (email: string, password: string, forceAdmin?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  selectRole: (role: 'student' | 'employer' | 'university' | 'admin') => void;
  registerStudent: (
    name: string,
    email: string,
    university?: string,
    degree?: string,
    gradYear?: number,
    role?: 'student' | 'employer' | 'university' | 'admin',
    companyName?: string
  ) => Promise<void>;
  updateUser: (updates: Partial<Student>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Student | null>(null);
  const [role, setRoleState] = useState<'student' | 'employer' | 'university' | 'admin' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedAuth = localStorage.getItem('isAuthenticated') === 'true';
        const savedRole = localStorage.getItem('role') as 'student' | 'employer' | 'university' | 'admin' | null;
        
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

  const login = async (email: string, password: string, forceAdmin: boolean = false): Promise<void> => {
    setIsLoading(true);
    try {
      if (email.toLowerCase().includes('admin') || forceAdmin) {
        // Mock successful administrator profile login
        const adminProfile: Student = {
          id: 'admin_sarah',
          name: 'Sarah Jenkins',
          email: email || 'admin@careerbridge.com',
          university: 'CareerBridge Central Office',
          degree: 'Super Administrator',
          gradYear: 2026,
          profilePicture: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbOejhXbZv_ELJo1RBJWqBxjJB9iywryg2Avf_Ioyd5RWwMvHfQzulsLoLYzVrl4qmPtiKWSsg4TteqNF7rQxcgy8TXd0Rc1nIQVuJXPEM-s_Rg55j2J6_6DtAw2_Q2GcVuDgCrpv9UDHRvnsKWEBzst4YSyTbK-PSRGkqNBxg7Ph_Rlhkw0_y_RDYdHv8RuJm3vca1QK_Tq8s3QKN2ebo-aD04q2LE0MDo2ZsV6KXxN2BZB9t1Fko',
          careerGoal: 'System Operations Control',
          workMode: 'On-site',
          preferredLocation: 'Central Operations Center',
          skills: [{ name: 'Infrastructure Management', level: 95 }, { name: 'AI Monitoring & Auditing', level: 90 }],
          resumeScore: 100,
          readinessScore: 100,
          linkedInConnected: true,
          gitHubConnected: true,
          phoneVerified: true,
          emailVerified: true
        };
        setUser(adminProfile);
        setIsAuthenticated(true);
        setRoleState('admin');
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('role', 'admin');
        localStorage.setItem('accessToken', 'mock_admin_token');
        return;
      }

      const profile = await AuthService.login(email, password);
      setUser(profile);
      setIsAuthenticated(true);
      const savedRole = localStorage.getItem('role') as 'student' | 'employer' | 'university' | 'admin' | null;
      setRoleState(savedRole || 'student');
    } catch (err) {
      console.warn('API Authentication failed. Using mock student profile fallback...', err);
      // Fallback on offline/disconnected modes
      const profile = await ProfileService.getStudentProfile();
      setUser(profile);
      setIsAuthenticated(true);
      const savedRole = localStorage.getItem('role') as 'student' | 'employer' | 'university' | 'admin' | null;
      setRoleState(savedRole || 'student');
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('role', savedRole || 'student');
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

  const selectRole = (newRole: 'student' | 'employer' | 'university' | 'admin') => {
    setRoleState(newRole);
    localStorage.setItem('role', newRole);
  };

  const registerStudent = async (
    name: string,
    email: string,
    university?: string,
    degree?: string,
    gradYear?: number,
    role: 'student' | 'employer' | 'university' | 'admin' = 'student',
    companyName?: string
  ): Promise<void> => {
    setIsLoading(true);
    try {
      await AuthService.register(name, email, university, degree, gradYear, role, companyName);
      const profile = await AuthService.login(email, 'Password123!');
      setUser(profile);
      setIsAuthenticated(true);
      setRoleState(role);
      localStorage.setItem('role', role);
    } catch (err) {
      console.warn('API Registration failed. Using mock updates fallback...', err);
      const updatedProfile = await ProfileService.updateStudentProfile({
        name,
        email,
        university: role === 'student' ? university : undefined,
        degree: role === 'student' ? degree : undefined,
        gradYear: role === 'student' ? gradYear : undefined
      });
      setUser(updatedProfile);
      setIsAuthenticated(true);
      setRoleState(role);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('role', role);
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
