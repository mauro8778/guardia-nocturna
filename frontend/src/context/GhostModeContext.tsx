import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

export type GhostRole = 'REAL_ADMIN' | 'GHOST_STUDENT' | 'GHOST_TEACHER';

interface GhostModeContextValue {
  ghostRole: GhostRole;
  setGhostRole: (role: GhostRole) => void;
  isSuperAdmin: boolean;
  isGhostStudent: boolean;
  isGhostTeacher: boolean;
}

const SUPERADMIN_EMAIL = 'maurodiaz8778@gmail.com';
const SESSION_KEY = 'gn_ghost_role';

const GhostModeContext = createContext<GhostModeContextValue>({
  ghostRole: 'REAL_ADMIN',
  setGhostRole: () => undefined,
  isSuperAdmin: false,
  isGhostStudent: false,
  isGhostTeacher: false,
});

export const GhostModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.email === SUPERADMIN_EMAIL;

  const [ghostRole, setGhostRoleState] = useState<GhostRole>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(SESSION_KEY) as GhostRole | null;
      return saved ?? 'REAL_ADMIN';
    }
    return 'REAL_ADMIN';
  });

  // Reset a REAL_ADMIN cuando el superadmin se desloguea
  useEffect(() => {
    if (!isSuperAdmin) {
      setGhostRoleState('REAL_ADMIN');
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [isSuperAdmin]);

  const setGhostRole = useCallback((role: GhostRole) => {
    setGhostRoleState(role);
    sessionStorage.setItem(SESSION_KEY, role);
  }, []);

  return (
    <GhostModeContext.Provider
      value={{
        ghostRole,
        setGhostRole,
        isSuperAdmin,
        isGhostStudent: ghostRole === 'GHOST_STUDENT',
        isGhostTeacher: ghostRole === 'GHOST_TEACHER',
      }}
    >
      {children}
    </GhostModeContext.Provider>
  );
};

export const useGhostMode = () => useContext(GhostModeContext);
