// Configuração de autenticação e políticas de segurança para o Supabase

/**
 * Este arquivo contém as configurações e políticas de segurança que devem ser aplicadas
 * no projeto Supabase para implementar o sistema de autenticação multi-tenant
 * com diferentes níveis de permissão (Admin, Editor, Visualizador).
 */

// Políticas de segurança para organizações
const organizationPolicies = `
-- Políticas para tabela organizations
CREATE POLICY "Usuários podem ver suas próprias organizações" 
ON organizations FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id FROM user_profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Apenas administradores podem editar organizações" 
ON organizations FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND organization_id = organizations.id 
    AND role = 'admin'
  )
);
`;

// Políticas de segurança para usuários
const userPolicies = `
-- Políticas para tabela user_profiles
CREATE POLICY "Usuários podem ver perfis da mesma organização" 
ON user_profiles FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id FROM user_profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Apenas administradores podem criar novos usuários" 
ON user_profiles FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND organization_id = NEW.organization_id 
    AND role = 'admin'
  )
);

CREATE POLICY "Apenas administradores podem atualizar usuários" 
ON user_profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND organization_id = user_profiles.organization_id 
    AND role = 'admin'
  )
);

CREATE POLICY "Apenas administradores podem excluir usuários" 
ON user_profiles FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND organization_id = user_profiles.organization_id 
    AND role = 'admin'
  )
);
`;

// Políticas de segurança para documentos e embeddings
const documentPolicies = `
-- Políticas para tabela documents
CREATE POLICY "Usuários podem ver documentos da mesma organização" 
ON documents FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id FROM user_profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Administradores e editores podem criar documentos" 
ON documents FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND organization_id = NEW.organization_id 
    AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Administradores e editores podem atualizar documentos" 
ON documents FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND organization_id = documents.organization_id 
    AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Administradores e editores podem excluir documentos" 
ON documents FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND organization_id = documents.organization_id 
    AND role IN ('admin', 'editor')
  )
);
`;

// Políticas de segurança para categorias
const categoryPolicies = `
-- Políticas para tabela categories
CREATE POLICY "Usuários podem ver categorias da mesma organização" 
ON categories FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id FROM user_profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Administradores e editores podem criar categorias" 
ON categories FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND organization_id = NEW.organization_id 
    AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Administradores e editores podem atualizar categorias" 
ON categories FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND organization_id = categories.organization_id 
    AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Administradores e editores podem excluir categorias" 
ON categories FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND organization_id = categories.organization_id 
    AND role IN ('admin', 'editor')
  )
);
`;

// Políticas de segurança para coleções
const collectionPolicies = `
-- Políticas para tabela collections
CREATE POLICY "Usuários podem ver coleções da mesma organização" 
ON collections FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id FROM user_profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Administradores e editores podem criar coleções" 
ON collections FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND organization_id = NEW.organization_id 
    AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Administradores e editores podem atualizar coleções" 
ON collections FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND organization_id = collections.organization_id 
    AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Administradores e editores podem excluir coleções" 
ON collections FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND organization_id = collections.organization_id 
    AND role IN ('admin', 'editor')
  )
);
`;

// Políticas de segurança para visões compartilhadas
const sharedViewPolicies = `
-- Políticas para tabela shared_views
CREATE POLICY "Usuários podem ver visões compartilhadas da mesma organização" 
ON shared_views FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id FROM user_profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Administradores e editores podem criar visões compartilhadas" 
ON shared_views FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND organization_id = NEW.organization_id 
    AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Administradores e editores podem atualizar visões compartilhadas" 
ON shared_views FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND organization_id = shared_views.organization_id 
    AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Administradores e editores podem excluir visões compartilhadas" 
ON shared_views FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND organization_id = shared_views.organization_id 
    AND role IN ('admin', 'editor')
  )
);

-- Política para acesso público a visões compartilhadas
CREATE POLICY "Acesso público a visões compartilhadas marcadas como públicas" 
ON shared_views FOR SELECT 
USING (
  is_public = true
);
`;

// Políticas de segurança para chaves de API
const apiKeyPolicies = `
-- Políticas para tabela api_keys
CREATE POLICY "Usuários podem ver chaves de API da mesma organização" 
ON api_keys FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id FROM user_profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Apenas administradores podem gerenciar chaves de API" 
ON api_keys FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND organization_id = api_keys.organization_id 
    AND role = 'admin'
  )
);
`;

// Políticas de segurança para métricas de uso
const usageMetricsPolicies = `
-- Políticas para tabela usage_metrics
CREATE POLICY "Apenas administradores podem ver métricas de uso" 
ON usage_metrics FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND organization_id = usage_metrics.organization_id 
    AND role = 'admin'
  )
);
`;

// Funções para autenticação e registro de usuários
const authFunctions = `
-- Função para criar uma nova organização e usuário administrador
CREATE OR REPLACE FUNCTION create_organization_with_admin(
  org_name TEXT,
  org_slug TEXT,
  user_id UUID,
  first_name TEXT,
  last_name TEXT
) RETURNS UUID AS $$
DECLARE
  org_id UUID;
  free_plan_id UUID;
BEGIN
  -- Obter o ID do plano gratuito
  SELECT id INTO free_plan_id FROM plans WHERE is_free = TRUE LIMIT 1;
  
  -- Criar nova organização
  INSERT INTO organizations (name, slug)
  VALUES (org_name, org_slug)
  RETURNING id INTO org_id;
  
  -- Criar assinatura no plano gratuito
  INSERT INTO subscriptions (organization_id, plan_id, status, current_period_start, current_period_end)
  VALUES (org_id, free_plan_id, 'active', NOW(), NOW() + INTERVAL '1 month');
  
  -- Criar perfil de usuário como administrador
  INSERT INTO user_profiles (id, organization_id, role, first_name, last_name)
  VALUES (user_id, org_id, 'admin', first_name, last_name);
  
  -- Inicializar métricas de uso
  INSERT INTO usage_metrics (organization_id, month)
  VALUES (org_id, DATE_TRUNC('month', NOW()));
  
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para adicionar um novo usuário a uma organização existente
CREATE OR REPLACE FUNCTION add_user_to_organization(
  user_id UUID,
  organization_id UUID,
  user_role TEXT,
  first_name TEXT,
  last_name TEXT
) RETURNS VOID AS $$
BEGIN
  -- Verificar se o usuário que chama a função é administrador da organização
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND organization_id = add_user_to_organization.organization_id 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem adicionar usuários';
  END IF;
  
  -- Criar perfil de usuário
  INSERT INTO user_profiles (id, organization_id, role, first_name, last_name)
  VALUES (user_id, organization_id, user_role, first_name, last_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

// Gatilhos para atualização automática de métricas de uso
const usageMetricsTriggers = `
-- Trigger para atualizar contagem de registros
CREATE OR REPLACE FUNCTION update_record_count()
RETURNS TRIGGER AS $$
DECLARE
  current_month DATE := DATE_TRUNC('month', NOW());
BEGIN
  -- Inserir ou atualizar métricas de uso para o mês atual
  INSERT INTO usage_metrics (organization_id, record_count, month)
  VALUES (NEW.organization_id, 1, current_month)
  ON CONFLICT (organization_id, month) 
  DO UPDATE SET record_count = usage_metrics.record_count + 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_record_count
AFTER INSERT ON documents
FOR EACH ROW EXECUTE PROCEDURE update_record_count();

CREATE TRIGGER decrement_record_count
AFTER DELETE ON documents
FOR EACH ROW EXECUTE PROCEDURE (
  DECLARE
    current_month DATE := DATE_TRUNC('month', NOW());
  BEGIN
    UPDATE usage_metrics 
    SET record_count = GREATEST(0, record_count - 1)
    WHERE organization_id = OLD.organization_id AND month = current_month;
    
    RETURN OLD;
  END;
) LANGUAGE plpgsql;

-- Função para incrementar contagem de consultas
CREATE OR REPLACE FUNCTION increment_query_count(org_id UUID)
RETURNS VOID AS $$
DECLARE
  current_month DATE := DATE_TRUNC('month', NOW());
BEGIN
  -- Inserir ou atualizar métricas de uso para o mês atual
  INSERT INTO usage_metrics (organization_id, query_count, month)
  VALUES (org_id, 1, current_month)
  ON CONFLICT (organization_id, month) 
  DO UPDATE SET query_count = usage_metrics.query_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

// Configuração para Automatic Embeddings
const automaticEmbeddingsConfig = `
-- Configuração para Supabase Automatic Embeddings
-- Nota: Esta é uma representação conceitual. A configuração real
-- seria feita através da interface do Supabase ou API.

-- 1. Habilitar a extensão pgvector
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Configurar a função de embedding para a coluna 'content' da tabela 'documents'
-- No Supabase, isso seria configurado através da interface de Vector Store
-- especificando:
--   - Tabela: documents
--   - Coluna de texto: content
--   - Coluna de embedding: embedding
--   - Dimensão: 1536 (para OpenAI)
--   - Modelo: text-embedding-ada-002 (ou o mais recente disponível)

-- 3. Configurar um gatilho para atualizar embeddings quando o conteúdo é alterado
CREATE OR REPLACE FUNCTION update_document_embedding()
RETURNS TRIGGER AS $$
BEGIN
  -- Na implementação real, o Supabase Automatic Embeddings
  -- gerenciaria esta funcionalidade automaticamente
  NEW.embedding = NULL; -- Forçar recálculo do embedding
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_document_embedding
BEFORE UPDATE ON documents
FOR EACH ROW
WHEN (OLD.content IS DISTINCT FROM NEW.content)
EXECUTE FUNCTION update_document_embedding();
`;

// Exportar todas as configurações
module.exports = {
  organizationPolicies,
  userPolicies,
  documentPolicies,
  categoryPolicies,
  collectionPolicies,
  sharedViewPolicies,
  apiKeyPolicies,
  usageMetricsPolicies,
  authFunctions,
  usageMetricsTriggers,
  automaticEmbeddingsConfig
};
