// lib/auth-context.tsx
import React, { createContext, ReactNode } from 'react';

// Contexto sem valor inicial (você pode trocar `null` por um type seguro depois)
export const AuthContext = createContext<null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={null}>
      {children}
    </AuthContext.Provider>
  );
}
