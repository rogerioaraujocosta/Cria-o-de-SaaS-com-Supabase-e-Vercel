-- Schema para o VectorDB SaaS

-- Configuração de extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Tabela de organizações (multi-tenant)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  custom_domain TEXT UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de planos
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_free BOOLEAN DEFAULT FALSE,
  max_records INTEGER,
  max_queries_per_month INTEGER,
  price_monthly DECIMAL(10, 2),
  price_yearly DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de assinaturas
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de usuários estendida
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de categorias/tags
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (organization_id, name)
);

-- Tabela de coleções de dados
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (organization_id, name)
);

-- Tabela de documentos (entradas de dados)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  external_id TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),  -- Dimensão para embeddings da OpenAI
  metadata JSONB DEFAULT '{}'::JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relação entre documentos e categorias
CREATE TABLE document_categories (
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, category_id)
);

-- Tabela de visões compartilhadas
CREATE TABLE shared_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  filter_categories UUID[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (organization_id, slug)
);

-- Tabela de chaves de API
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key TEXT UNIQUE NOT NULL,
  permissions TEXT[] DEFAULT '{}',
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de uso (para métricas e cobrança)
CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  record_count INTEGER DEFAULT 0,
  query_count INTEGER DEFAULT 0,
  month DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (organization_id, month)
);

-- Índices para pesquisa vetorial
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Funções para pesquisa vetorial
CREATE OR REPLACE FUNCTION match_documents(
  query_text TEXT,
  match_count INTEGER DEFAULT 10,
  organization_id UUID,
  collection_id UUID DEFAULT NULL,
  category_ids UUID[] DEFAULT '{}'
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Aqui seria implementada a lógica para gerar embeddings,
  -- mas como usaremos Supabase Automatic Embeddings, isso será
  -- feito automaticamente. Esta função é um placeholder.
  
  RETURN QUERY
  SELECT
    d.id,
    d.title,
    d.content,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM
    documents d
  LEFT JOIN
    document_categories dc ON d.id = dc.document_id
  WHERE
    d.organization_id = match_documents.organization_id
    AND (match_documents.collection_id IS NULL OR d.collection_id = match_documents.collection_id)
    AND (
      array_length(match_documents.category_ids, 1) IS NULL
      OR dc.category_id = ANY(match_documents.category_ids)
    )
  ORDER BY
    similarity DESC
  LIMIT
    match_count;
END;
$$;

-- Triggers para atualização de timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_timestamp
BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_plans_timestamp
BEFORE UPDATE ON plans
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_subscriptions_timestamp
BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_user_profiles_timestamp
BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_categories_timestamp
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_collections_timestamp
BEFORE UPDATE ON collections
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_documents_timestamp
BEFORE UPDATE ON documents
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_shared_views_timestamp
BEFORE UPDATE ON shared_views
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_usage_metrics_timestamp
BEFORE UPDATE ON usage_metrics
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

-- Políticas de segurança RLS (Row Level Security)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

-- Inserir planos padrão
INSERT INTO plans (name, description, is_free, max_records, max_queries_per_month, price_monthly, price_yearly)
VALUES 
  ('Gratuito', 'Plano básico para pequenas empresas', TRUE, 1000, 10000, 0, 0),
  ('Profissional', 'Para empresas em crescimento', FALSE, 10000, 100000, 29.90, 299.00),
  ('Empresarial', 'Para grandes empresas com alto volume', FALSE, 100000, 1000000, 99.90, 999.00);
