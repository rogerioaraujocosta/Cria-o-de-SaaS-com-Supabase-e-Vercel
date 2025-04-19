import { createClient } from '@supabase/supabase-js';

// Inicializar cliente Supabase
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

// Função para pesquisa vetorial
export const searchDocuments = async ({
  supabase,
  query,
  organizationId,
  collectionId = null,
  categoryIds = null,
  limit = 10,
  threshold = 0.7
}) => {
  try {
    // Verificar limite de consultas
    const { data: canQuery, error: limitError } = await supabase.rpc(
      'check_query_limit_and_increment',
      { org_id: organizationId }
    );
    
    if (limitError) {
      throw new Error(`Erro ao verificar limite de consultas: ${limitError.message}`);
    }
    
    if (!canQuery) {
      throw new Error('Limite de consultas excedido para este mês');
    }
    
    // Realizar pesquisa vetorial
    const { data, error } = await supabase.rpc(
      'search_documents',
      {
        query_text: query,
        match_count: limit,
        organization_id: organizationId,
        collection_id: collectionId,
        category_ids: categoryIds,
        similarity_threshold: threshold
      }
    );
    
    if (error) {
      throw new Error(`Erro na pesquisa: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Erro na pesquisa vetorial:', error);
    throw error;
  }
};

// Função para obter categorias
export const getCategories = async ({ supabase, organizationId }) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');
    
    if (error) {
      throw new Error(`Erro ao obter categorias: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao obter categorias:', error);
    throw error;
  }
};

// Função para obter coleções
export const getCollections = async ({ supabase, organizationId }) => {
  try {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');
    
    if (error) {
      throw new Error(`Erro ao obter coleções: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao obter coleções:', error);
    throw error;
  }
};

// Função para obter documentos
export const getDocuments = async ({ 
  supabase, 
  organizationId, 
  collectionId = null,
  categoryId = null,
  page = 1,
  limit = 20
}) => {
  try {
    let query = supabase
      .from('documents')
      .select('*, categories(*)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    
    if (collectionId) {
      query = query.eq('collection_id', collectionId);
    }
    
    if (categoryId) {
      query = query.eq('categories.id', categoryId);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      throw new Error(`Erro ao obter documentos: ${error.message}`);
    }
    
    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count
      }
    };
  } catch (error) {
    console.error('Erro ao obter documentos:', error);
    throw error;
  }
};

// Função para criar documento
export const createDocument = async ({
  supabase,
  organizationId,
  userId,
  title,
  content,
  collectionId = null,
  externalId = null,
  metadata = {},
  categories = []
}) => {
  try {
    // Verificar limite de registros
    const { data: canAddRecord, error: limitError } = await supabase.rpc(
      'check_record_limit',
      { org_id: organizationId }
    );
    
    if (limitError) {
      throw new Error(`Erro ao verificar limite de registros: ${limitError.message}`);
    }
    
    if (!canAddRecord) {
      throw new Error('Limite de registros do plano atingido');
    }
    
    // Criar documento
    const { data, error } = await supabase.rpc('create_document_with_categories', {
      p_title: title,
      p_content: content,
      p_organization_id: organizationId,
      p_collection_id: collectionId,
      p_external_id: externalId,
      p_metadata: metadata,
      p_created_by: userId,
      p_categories: categories
    });
    
    if (error) {
      throw new Error(`Erro ao criar documento: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao criar documento:', error);
    throw error;
  }
};

// Função para atualizar documento
export const updateDocument = async ({
  supabase,
  documentId,
  organizationId,
  title,
  content,
  collectionId = null,
  externalId = null,
  metadata = {},
  categories = []
}) => {
  try {
    // Verificar se o documento existe e pertence à organização
    const { data: existingDoc, error: fetchError } = await supabase
      .from('documents')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('id', documentId)
      .single();
    
    if (fetchError || !existingDoc) {
      throw new Error('Documento não encontrado');
    }
    
    // Atualizar documento
    const { data, error } = await supabase.rpc('update_document_with_categories', {
      p_id: documentId,
      p_title: title,
      p_content: content,
      p_collection_id: collectionId,
      p_external_id: externalId,
      p_metadata: metadata,
      p_categories: categories
    });
    
    if (error) {
      throw new Error(`Erro ao atualizar documento: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao atualizar documento:', error);
    throw error;
  }
};

// Função para excluir documento
export const deleteDocument = async ({
  supabase,
  documentId,
  organizationId
}) => {
  try {
    // Verificar se o documento existe e pertence à organização
    const { data: existingDoc, error: fetchError } = await supabase
      .from('documents')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('id', documentId)
      .single();
    
    if (fetchError || !existingDoc) {
      throw new Error('Documento não encontrado');
    }
    
    // Excluir documento
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);
    
    if (error) {
      throw new Error(`Erro ao excluir documento: ${error.message}`);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao excluir documento:', error);
    throw error;
  }
};

// Função para criar chave de API
export const createApiKey = async ({
  supabase,
  organizationId,
  userId,
  name,
  permissions = [],
  expiresAt = null
}) => {
  try {
    const { data, error } = await supabase.rpc('create_api_key', {
      p_organization_id: organizationId,
      p_name: name,
      p_permissions: permissions,
      p_created_by: userId,
      p_expires_at: expiresAt
    });
    
    if (error) {
      throw new Error(`Erro ao criar chave de API: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao criar chave de API:', error);
    throw error;
  }
};

// Função para obter métricas de uso
export const getUsageMetrics = async ({
  supabase,
  organizationId
}) => {
  try {
    const { data, error } = await supabase
      .from('usage_metrics')
      .select('*')
      .eq('organization_id', organizationId)
      .order('month', { ascending: false })
      .limit(12);
    
    if (error) {
      throw new Error(`Erro ao obter métricas de uso: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao obter métricas de uso:', error);
    throw error;
  }
};

// Função para criar visão compartilhada
export const createSharedView = async ({
  supabase,
  organizationId,
  userId,
  name,
  slug,
  collectionId = null,
  filterCategories = [],
  isPublic = false
}) => {
  try {
    const { data, error } = await supabase
      .from('shared_views')
      .insert({
        organization_id: organizationId,
        name,
        slug,
        collection_id: collectionId,
        filter_categories: filterCategories,
        is_public: isPublic,
        created_by: userId
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Erro ao criar visão compartilhada: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao criar visão compartilhada:', error);
    throw error;
  }
};

// Função para obter visão compartilhada pública
export const getPublicSharedView = async ({
  supabase,
  slug
}) => {
  try {
    const { data: view, error: viewError } = await supabase
      .from('shared_views')
      .select('*, organizations(*)')
      .eq('slug', slug)
      .eq('is_public', true)
      .single();
    
    if (viewError) {
      throw new Error('Visão compartilhada não encontrada ou não é pública');
    }
    
    // Obter documentos da visão
    let query = supabase
      .from('documents')
      .select('*, categories(*)')
      .eq('organization_id', view.organization_id)
      .order('created_at', { ascending: false });
    
    if (view.collection_id) {
      query = query.eq('collection_id', view.collection_id);
    }
    
    if (view.filter_categories && view.filter_categories.length > 0) {
      query = query.in('categories.id', view.filter_categories);
    }
    
    const { data: documents, error: docsError } = await query;
    
    if (docsError) {
      throw new Error(`Erro ao obter documentos: ${docsError.message}`);
    }
    
    return {
      view,
      documents
    };
  } catch (error) {
    console.error('Erro ao obter visão compartilhada:', error);
    throw error;
  }
};
