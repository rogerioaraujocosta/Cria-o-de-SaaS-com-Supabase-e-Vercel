// lib/auth-context.tsx

"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { supabase as supabaseClient } from './supabase-client';
import type { SupabaseClient } from '@supabase/supabase-js';

// Tipos básicos para usuário e organização
export type User = { id: string /*…outros campos se desejar*/ };
export type Organization = { id: string /*…*/ };

// Interface do context incluindo signOut
export interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  supabase: SupabaseClient;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const user: User | null = { id: 'stub-user-id' };            // TODO: pegar usuário real
  const organization: Organization | null = { id: 'stub-org' };// TODO: carregar org real

  // Método para logout, stub de exemplo
  const signOut = async () => {
    // use supabaseClient.auth.signOut() ou lógica real aqui
    await supabaseClient.auth.signOut?.();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        supabase: supabaseClient,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
