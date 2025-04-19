/**
 * Configuração e utilitários para o banco de dados vetorial com Supabase Automatic Embeddings
 * 
 * Este arquivo contém as configurações e funções necessárias para trabalhar
 * com o banco de dados vetorial usando Supabase Automatic Embeddings.
 */

// Configuração para o Supabase Automatic Embeddings
const embeddingsConfig = {
  // Modelo de embedding a ser usado (OpenAI)
  model: 'text-embedding-ada-002',
  
  // Dimensão dos vetores de embedding
  dimensions: 1536,
  
  // Tabela e coluna para armazenar embeddings
  table: 'documents',
  textColumn: 'content',
  embeddingColumn: 'embedding',
  
  // Configurações para pesquisa de similaridade
  similarityThreshold: 0.7,
  maxResults: 10
};

// Funções SQL para pesquisa vetorial
const vectorSearchFunctions = `
-- Função para pesquisar documentos por similaridade vetorial
CREATE OR REPLACE FUNCTION search_documents(
  query_text TEXT,
  match_count INTEGER DEFAULT 10,
  organization_id UUID,
  collection_id UUID DEFAULT NULL,
  category_ids UUID[] DEFAULT NULL,
  similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
DECLARE
  query_embedding VECTOR(1536);
BEGIN
  -- Na implementação real, o Supabase Automatic Embeddings geraria o embedding
  -- Aqui, simulamos a chamada para a API de embeddings
  
  -- Obter embedding para a consulta (seria feito pelo Supabase)
  -- query_embedding := embedding_function(query_text);
  
  -- Consulta de similaridade
  RETURN QUERY
  SELECT
    d.id,
    d.title,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM
    documents d
  LEFT JOIN
    document_categories dc ON d.id = dc.document_id
  WHERE
    d.organization_id = search_documents.organization_id
    AND (search_documents.collection_id IS NULL OR d.collection_id = search_documents.collection_id)
    AND (
      search_documents.category_ids IS NULL
      OR dc.category_id = ANY(search_documents.category_ids)
    )
    AND 1 - (d.embedding <=> query_embedding) > similarity_threshold
  GROUP BY
    d.id, d.title, d.content, d.metadata, similarity
  ORDER BY
    similarity DESC
  LIMIT
    match_count;
END;
$$;

-- Função para incrementar contador de consultas e verificar limites do plano
CREATE OR REPLACE FUNCTION check_query_limit_and_increment(
  org_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month DATE := DATE_TRUNC('month', NOW());
  current_count INTEGER;
  max_queries INTEGER;
  plan_id UUID;
BEGIN
  -- Obter plano atual da organização
  SELECT s.plan_id INTO plan_id
  FROM subscriptions s
  WHERE s.organization_id = org_id AND s.status = 'active'
  LIMIT 1;
  
  -- Obter limite de consultas do plano
  SELECT p.max_queries_per_month INTO max_queries
  FROM plans p
  WHERE p.id = plan_id;
  
  -- Obter contagem atual de consultas
  SELECT u.query_count INTO current_count
  FROM usage_metrics u
  WHERE u.organization_id = org_id AND u.month = current_month;
  
  -- Verificar se excedeu o limite
  IF current_count >= max_queries THEN
    RETURN FALSE;
  END IF;
  
  -- Incrementar contador de consultas
  PERFORM increment_query_count(org_id);
  
  RETURN TRUE;
END;
$$;
`;

// Exemplo de como usar a pesquisa vetorial no código
const searchExample = `
// Exemplo de como realizar uma pesquisa vetorial
async function searchDocuments(supabase, query, options = {}) {
  const {
    organizationId,
    collectionId = null,
    categoryIds = null,
    limit = 10,
    similarityThreshold = 0.7
  } = options;
  
  // Verificar limite de consultas
  const { data: canQuery, error: limitError } = await supabase.rpc(
    'check_query_limit_and_increment',
    { org_id: organizationId }
  );
  
  if (limitError) {
    throw new Error('Erro ao verificar limite de consultas: ' + limitError.message);
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
      similarity_threshold: similarityThreshold
    }
  );
  
  if (error) {
    throw new Error('Erro na pesquisa: ' + error.message);
  }
  
  return data;
}
`;

// Instruções para configurar Automatic Embeddings no Supabase
const setupInstructions = `
# Configuração do Supabase Automatic Embeddings

Para configurar o Supabase Automatic Embeddings para este projeto, siga os passos abaixo:

1. No painel do Supabase, vá para "Database" > "Extensions"
2. Habilite a extensão "vector" (pgvector)
3. Vá para "Vector Store" no menu lateral
4. Clique em "Create new embedding"
5. Configure:
   - Tabela: documents
   - Coluna de texto: content
   - Coluna de embedding: embedding
   - Dimensão: 1536
   - Modelo: text-embedding-ada-002 (ou o mais recente disponível)
6. Clique em "Create"

O Supabase irá automaticamente:
- Gerar embeddings para novos documentos
- Atualizar embeddings quando o conteúdo for modificado
- Fornecer funções para pesquisa de similaridade

Nota: O Supabase Automatic Embeddings usa a API da OpenAI internamente, mas gerencia as chaves
de API para você, eliminando a necessidade de os usuários fornecerem suas próprias chaves.
`;

module.exports = {
  embeddingsConfig,
  vectorSearchFunctions,
  searchExample,
  setupInstructions
};
