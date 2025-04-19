// lib/supabase-client.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Insere uma nova API Key no Supabase.
 * @param name     Nome do key
 * @param perms    Array de permissões
 */
export async function createApiKey(name: string, perms: string[]) {
  const { data, error } = await supabase
    .from('api_keys')
    .insert([{ name, permissions: perms }])
    .single();

  if (error) throw error;
  return data;
}
