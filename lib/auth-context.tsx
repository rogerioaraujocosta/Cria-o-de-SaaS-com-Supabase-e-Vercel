"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { supabase as supabaseClient } from './supabase-client';  // seu client criado
import type { SupabaseClient } from '@supabase/supabase-js';

type User = { id: string /*…outros campos que quiser*/ };
type Organization = { id: string /*…*/ };

export interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  supabase: SupabaseClient;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const user: User | null = { id: 'stub-user-id' };            // TODO: pegar usuário real
  const organization: Organization | null = { id: 'stub-org' };// TODO: carregar org real

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        supabase: supabaseClient,
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
