import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Student } from '../types';
import { ProfileService, AuthService } from '../services';
import type { RegisterPayload } from '../services';

type Role = 'student' | 'employer' | 'university' | 'admin';

/**
 * Login/registration resolve with BOTH the role and the freshly-fetched
 * profile so callers can route immediately (e.g. skip onboarding for a
 * student whose saved profile is already complete) without waiting for a
 * React state update or re-reading localStorage.
 */
export interface AuthResult {
  role: Role;
  user: Student;
}

interface AuthContextType {
  user: Student | null;
  isAuthenticated: boolean;
  role: Role | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  selectRole: (role: Role) => void;
  register: (payload: RegisterPayload) => Promise<AuthResult>;
  /** @deprecated kept as an alias of register() for older call sites */
  registerStudent: (payload: RegisterPayload) => Promise<AuthResult>;
  updateUser: (updates: Partial<Student>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Student | null>(null);
  const [role, setRoleState] = useState<Role | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedAuth = localStorage.getItem('isAuthenticated') === 'true';
        const hasToken = !!localStorage.getItem('accessToken');

        if (savedAuth && hasToken) {
          // Restore the session from the backend, not from cached local state:
          // GET /auth/me works for EVERY role. (The previous code called
          // /student/profile here, which 403'd for employer, university and
          // admin accounts -- so those sessions silently died on every page
          // refresh.) If the access token has expired, fetchJson transparently
          // rotates it via the httpOnly refresh cookie and retries.
          const { user: profile, role: resolvedRole } = await AuthService.me();
          setUser(profile);
          setIsAuthenticated(true);
          setRoleState(resolvedRole as Role);
        }
      } catch (err) {
        // Refresh token expired/revoked or backend unreachable: clear the
        // half-dead session instead of leaving the UI looking logged in.
        console.error('Failed to restore auth state', err);
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('role');
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  /**
   * Real API login for every role -- including admin. (Admin used to be a
   * hardcoded mock triggered by any email containing "admin": it planted a
   * fake 'mock_admin_token' that made every subsequent API call 401.)
   * Returns the authenticated role so callers can route immediately without
   * re-reading localStorage.
   */
  const login = async (email: string, password: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const profile = await AuthService.login(email, password);
      const resolvedRole = (localStorage.getItem('role') as Role | null) || 'student';
      setUser(profile);
      setIsAuthenticated(true);
      setRoleState(resolvedRole);
      return { role: resolvedRole, user: profile };
    } catch (err) {
      // No mock fallback: silently faking a successful login when the real API
      // call fails used to leave isAuthenticated=true with no real accessToken
      // -- every later API call then 401'd while the UI looked logged in.
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    // Revoke the refresh token server-side and clear the httpOnly cookie
    // BEFORE clearing local state; best-effort (never blocks local logout).
    await AuthService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setRoleState(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('role');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('hasOnboarded');
    sessionStorage.clear();
  };

  const selectRole = (newRole: Role) => {
    setRoleState(newRole);
    localStorage.setItem('role', newRole);
  };

  const register = async (payload: RegisterPayload): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      await AuthService.register(payload);
      // Log in with the password the user actually chose -- registration used
      // to silently create every account with a shared hardcoded password.
      const profile = await AuthService.login(payload.email, payload.password);
      const resolvedRole = (localStorage.getItem('role') as Role | null) || payload.role;
      setUser(profile);
      setIsAuthenticated(true);
      setRoleState(resolvedRole);
      return { role: resolvedRole, user: profile };
    } catch (err) {
      // No mock fallback: faking success would leave the user believing they
      // have an account that doesn't actually exist in PostgreSQL.
      throw err;
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
        register,
        registerStudent: register,
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
