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

// 1) categories
export async function getCategories({
  supabase,
  organizationId,
}: { supabase: SupabaseClient; organizationId: string }): Promise<any[]> {
  // TODO: implementar real
  return [];
}

// 2) documentos CRUD
export async function createDocument({
  supabase,
  organizationId,
  title,
  content,
  collection_id,
  external_id,
  metadata,
}: {
  supabase: SupabaseClient;
  organizationId: string;
  title: string;
  content: string;
  collection_id?: string;
  external_id?: string;
  metadata?: any;
}): Promise<any> {
  // TODO: implementar real
  return {};
}

export async function updateDocument({
  supabase,
  documentId,
  organizationId,
  title,
  content,
}: {
  supabase: SupabaseClient;
  documentId: string;
  organizationId: string;
  title: string;
  content: string;
}): Promise<any> {
  // TODO: implementar real
  return {};
}

export async function deleteDocument({
  supabase,
  documentId,
  organizationId,
}: {
  supabase: SupabaseClient;
  documentId: string;
  organizationId: string;
}): Promise<any> {
  // TODO: implementar real
  return {};
}

// 3) search
export async function searchDocuments({
  supabase,
  query,
  organizationId,
}: { supabase: SupabaseClient; query: string; organizationId: string }): Promise<any[]> {
  // TODO: implementar real
  return [];
}

// 4) shared views
export async function createSharedView({
  supabase,
  organizationId,
  // outros campos…
}: {
  supabase: SupabaseClient;
  organizationId: string;
  [key: string]: any;
}): Promise<any> {
  // TODO: implementar real
  return {};
}
