// lib/supabase-client.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface CreateApiKeyParams {
  supabase: SupabaseClient;
  organizationId: string;
  userId: string;
  name: string;
  permissions?: string[];
  expiresAt?: string | null;
}

export interface ApiKey {
  key: string;
  // inclua outros campos retornados se quiser
}

/**
 * Cria uma chave de API na tabela api_keys.
 */
export async function createApiKey({
  supabase,
  organizationId,
  userId,
  name,
  permissions = [],
  expiresAt = null,
}: CreateApiKeyParams): Promise<ApiKey> {
  const { data, error } = await supabase
    .from('api_keys')
    .insert([
      {
        organization_id: organizationId,
        created_by: userId,
        name,
        permissions,
        expires_at: expiresAt,
      },
    ])
    .single();

  if (error) throw error;
  return data as ApiKey;
}
