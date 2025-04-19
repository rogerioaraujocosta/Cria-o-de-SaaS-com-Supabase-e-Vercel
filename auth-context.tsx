import { createContext, useContext, useEffect, useState } from 'react';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// Tipos para o contexto
type OrganizationType = {
  id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  logo_url: string | null;
};

type UserProfileType = {
  id: string;
  organization_id: string;
  role: 'admin' | 'editor' | 'viewer';
  first_name: string | null;
  last_name: string | null;
};

type SubscriptionType = {
  id: string;
  organization_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  plan: {
    name: string;
    is_free: boolean;
    max_records: number;
    max_queries_per_month: number;
  };
};

type AuthContextType = {
  supabase: SupabaseClient;
  user: User | null;
  userProfile: UserProfileType | null;
  organization: OrganizationType | null;
  subscription: SubscriptionType | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, firstName: string, lastName: string, orgName: string, orgSlug: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
};

// Valores padrão para o contexto
const defaultContextValue: AuthContextType = {
  supabase: {} as SupabaseClient,
  user: null,
  userProfile: null,
  organization: null,
  subscription: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
};

// Criação do contexto
const AuthContext = createContext<AuthContextType>(defaultContextValue);

// Hook para usar o contexto
export const useAuth = () => useContext(AuthContext);

// Provedor do contexto
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [supabase] = useState(() => 
    createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    )
  );
  
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileType | null>(null);
  const [organization, setOrganization] = useState<OrganizationType | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionType | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar usuário atual
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        
        // Verificar sessão atual
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          
          // Carregar perfil do usuário
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileError) throw profileError;
          setUserProfile(profile);
          
          // Carregar organização
          const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', profile.organization_id)
            .single();
            
          if (orgError) throw orgError;
          setOrganization(org);
          
          // Carregar assinatura
          const { data: sub, error: subError } = await supabase
            .from('subscriptions')
            .select('*, plans(*)')
            .eq('organization_id', profile.organization_id)
            .eq('status', 'active')
            .single();
            
          if (!subError) {
            setSubscription(sub);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
    
    // Configurar listener para mudanças de autenticação
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          
          // Carregar perfil do usuário
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profile) {
            setUserProfile(profile);
            
            // Carregar organização
            const { data: org } = await supabase
              .from('organizations')
              .select('*')
              .eq('id', profile.organization_id)
              .single();
              
            if (org) {
              setOrganization(org);
              
              // Carregar assinatura
              const { data: sub } = await supabase
                .from('subscriptions')
                .select('*, plans(*)')
                .eq('organization_id', profile.organization_id)
                .eq('status', 'active')
                .single();
                
              if (sub) {
                setSubscription(sub);
              }
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserProfile(null);
          setOrganization(null);
          setSubscription(null);
        }
      }
    );
    
    // Limpar listener
    return () => {
      authSubscription.unsubscribe();
    };
  }, [supabase]);

  // Função de login
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      return { error };
    } catch (error) {
      return { error };
    }
  };

  // Função de cadastro
  const signUp = async (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string, 
    orgName: string, 
    orgSlug: string
  ) => {
    try {
      // Registrar usuário
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (authError) return { error: authError };
      
      if (authData.user) {
        // Criar organização e perfil de usuário
        const { error: orgError } = await supabase.rpc('create_organization_with_admin', {
          org_name: orgName,
          org_slug: orgSlug,
          user_id: authData.user.id,
          first_name: firstName,
          last_name: lastName
        });
        
        if (orgError) return { error: orgError };
      }
      
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // Função de logout
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Função de recuperação de senha
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      return { error };
    } catch (error) {
      return { error };
    }
  };

  // Valor do contexto
  const value = {
    supabase,
    user,
    userProfile,
    organization,
    subscription,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
