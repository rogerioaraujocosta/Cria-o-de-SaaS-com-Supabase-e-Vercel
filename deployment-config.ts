import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

// …seu vercelConfig e createServiceSupabaseClient permanecem inalterados…

// 1) Tipo para os parâmetros de updateCustomDomain
export interface UpdateCustomDomainParams {
  supabase: SupabaseClient;
  organizationId: string;
  customDomain: string;
}
export const updateCustomDomain = async ({
  supabase,
  organizationId,
  customDomain,
}: UpdateCustomDomainParams) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .update({ custom_domain: customDomain })
      .eq('id', organizationId)
      .select()
      .single();
    if (error) throw new Error(`Erro ao atualizar domínio: ${error.message}`);
    return data;
  } catch (error) {
    console.error('Erro ao atualizar domínio personalizado:', error);
    throw error;
  }
};

// 2) Tipo para checkSlugAvailability
export interface CheckSlugAvailabilityParams {
  supabase: SupabaseClient;
  slug: string;
}
export const checkSlugAvailability = async ({
  supabase,
  slug,
}: CheckSlugAvailabilityParams) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw new Error(`Erro ao verificar slug: ${error.message}`);
    return {
      available: !data,
      slug,
    };
  } catch (error) {
    console.error('Erro ao verificar disponibilidade de slug:', error);
    throw error;
  }
};

// 3) Tipo para updateOrganizationSlug
export interface UpdateOrganizationSlugParams {
  supabase: SupabaseClient;
  organizationId: string;
  slug: string;
}
export const updateOrganizationSlug = async ({
  supabase,
  organizationId,
  slug,
}: UpdateOrganizationSlugParams) => {
  try {
    const { available } = await checkSlugAvailability({ supabase, slug });
    if (!available) {
      throw new Error('Este slug já está em uso');
    }
    const { data, error } = await supabase
      .from('organizations')
      .update({ slug })
      .eq('id', organizationId)
      .select()
      .single();
    if (error) throw new Error(`Erro ao atualizar slug: ${error.message}`);
    return data;
  } catch (error) {
    console.error('Erro ao atualizar slug da organização:', error);
    throw error;
  }
};
