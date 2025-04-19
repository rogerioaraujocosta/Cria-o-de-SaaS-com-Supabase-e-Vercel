/**
 * API Endpoints para o VectorDB SaaS
 * 
 * Este arquivo contém a implementação dos endpoints da API REST
 * que permitem operações CRUD completas e pesquisa vetorial.
 */

// Endpoints da API
const apiEndpoints = {
  // Autenticação
  auth: {
    signUp: '/auth/signup',
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    resetPassword: '/auth/reset-password',
  },
  
  // Organizações
  organizations: {
    base: '/api/organizations',
    get: '/api/organizations/:id',
    update: '/api/organizations/:id',
    domains: '/api/organizations/:id/domains',
  },
  
  // Usuários
  users: {
    base: '/api/users',
    get: '/api/users/:id',
    create: '/api/users',
    update: '/api/users/:id',
    delete: '/api/users/:id',
  },
  
  // Coleções
  collections: {
    base: '/api/collections',
    get: '/api/collections/:id',
    create: '/api/collections',
    update: '/api/collections/:id',
    delete: '/api/collections/:id',
  },
  
  // Categorias (Tags)
  categories: {
    base: '/api/categories',
    get: '/api/categories/:id',
    create: '/api/categories',
    update: '/api/categories/:id',
    delete: '/api/categories/:id',
  },
  
  // Documentos (Entradas de dados)
  documents: {
    base: '/api/documents',
    get: '/api/documents/:id',
    create: '/api/documents',
    update: '/api/documents/:id',
    delete: '/api/documents/:id',
    search: '/api/documents/search',
    batch: '/api/documents/batch',
  },
  
  // Visões compartilhadas
  sharedViews: {
    base: '/api/shared-views',
    get: '/api/shared-views/:id',
    create: '/api/shared-views',
    update: '/api/shared-views/:id',
    delete: '/api/shared-views/:id',
    public: '/shared/:slug',
  },
  
  // Chaves de API
  apiKeys: {
    base: '/api/api-keys',
    get: '/api/api-keys/:id',
    create: '/api/api-keys',
    delete: '/api/api-keys/:id',
  },
  
  // Métricas de uso
  usage: {
    base: '/api/usage',
    current: '/api/usage/current',
    history: '/api/usage/history',
  },
  
  // Planos e assinaturas
  billing: {
    plans: '/api/billing/plans',
    subscribe: '/api/billing/subscribe',
    cancel: '/api/billing/cancel',
    invoices: '/api/billing/invoices',
  },
};

// Middleware para verificação de API Key
const apiKeyMiddleware = `
/**
 * Middleware para autenticação via API Key
 * 
 * Este middleware verifica se a requisição contém uma API Key válida
 * e associa a organização correspondente ao request.
 */
export const apiKeyAuth = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API Key não fornecida' });
  }
  
  try {
    const { data: keyData, error } = await supabase
      .from('api_keys')
      .select('*, organizations(*)')
      .eq('key', apiKey)
      .single();
    
    if (error || !keyData) {
      return res.status(401).json({ error: 'API Key inválida' });
    }
    
    // Verificar se a chave não expirou
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return res.status(401).json({ error: 'API Key expirada' });
    }
    
    // Atualizar último uso
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date() })
      .eq('id', keyData.id);
    
    // Associar organização ao request
    req.organization = keyData.organizations;
    req.apiKey = keyData;
    
    next();
  } catch (error) {
    console.error('Erro ao verificar API Key:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
`;

// Implementação dos endpoints para documentos (CRUD + pesquisa)
const documentsEndpoints = `
/**
 * Endpoints para gerenciamento de documentos
 * 
 * Implementa operações CRUD completas e pesquisa vetorial.
 */

// GET /api/documents - Listar documentos
export const listDocuments = async (req, res) => {
  const { organization } = req;
  const { collection_id, category_id, page = 1, limit = 20 } = req.query;
  
  try {
    let query = supabase
      .from('documents')
      .select('*, categories(*)')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    
    if (collection_id) {
      query = query.eq('collection_id', collection_id);
    }
    
    if (category_id) {
      query = query.eq('categories.id', category_id);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    return res.status(200).json({
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count
      }
    });
  } catch (error) {
    console.error('Erro ao listar documentos:', error);
    return res.status(500).json({ error: 'Erro ao listar documentos' });
  }
};

// GET /api/documents/:id - Obter documento específico
export const getDocument = async (req, res) => {
  const { organization } = req;
  const { id } = req.params;
  
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*, categories(*)')
      .eq('organization_id', organization.id)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Documento não encontrado' });
      }
      throw error;
    }
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Erro ao obter documento:', error);
    return res.status(500).json({ error: 'Erro ao obter documento' });
  }
};

// POST /api/documents - Criar novo documento
export const createDocument = async (req, res) => {
  const { organization, user } = req;
  const { title, content, collection_id, external_id, metadata, categories } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Título e conteúdo são obrigatórios' });
  }
  
  // Verificar limite de registros do plano
  const canAddRecord = await checkRecordLimit(organization.id);
  if (!canAddRecord) {
    return res.status(403).json({ error: 'Limite de registros do plano atingido' });
  }
  
  try {
    // Iniciar transação
    const { data, error } = await supabase.rpc('create_document_with_categories', {
      p_title: title,
      p_content: content,
      p_organization_id: organization.id,
      p_collection_id: collection_id,
      p_external_id: external_id,
      p_metadata: metadata || {},
      p_created_by: user?.id,
      p_categories: categories || []
    });
    
    if (error) {
      throw error;
    }
    
    return res.status(201).json(data);
  } catch (error) {
    console.error('Erro ao criar documento:', error);
    return res.status(500).json({ error: 'Erro ao criar documento' });
  }
};

// PUT /api/documents/:id - Atualizar documento existente
export const updateDocument = async (req, res) => {
  const { organization } = req;
  const { id } = req.params;
  const { title, content, collection_id, external_id, metadata, categories } = req.body;
  
  try {
    // Verificar se o documento existe e pertence à organização
    const { data: existingDoc, error: fetchError } = await supabase
      .from('documents')
      .select('id')
      .eq('organization_id', organization.id)
      .eq('id', id)
      .single();
    
    if (fetchError || !existingDoc) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }
    
    // Atualizar documento e categorias
    const { data, error } = await supabase.rpc('update_document_with_categories', {
      p_id: id,
      p_title: title,
      p_content: content,
      p_collection_id: collection_id,
      p_external_id: external_id,
      p_metadata: metadata,
      p_categories: categories || []
    });
    
    if (error) {
      throw error;
    }
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Erro ao atualizar documento:', error);
    return res.status(500).json({ error: 'Erro ao atualizar documento' });
  }
};

// DELETE /api/documents/:id - Excluir documento
export const deleteDocument = async (req, res) => {
  const { organization } = req;
  const { id } = req.params;
  
  try {
    // Verificar se o documento existe e pertence à organização
    const { data: existingDoc, error: fetchError } = await supabase
      .from('documents')
      .select('id')
      .eq('organization_id', organization.id)
      .eq('id', id)
      .single();
    
    if (fetchError || !existingDoc) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }
    
    // Excluir documento
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir documento:', error);
    return res.status(500).json({ error: 'Erro ao excluir documento' });
  }
};

// POST /api/documents/search - Pesquisar documentos por similaridade
export const searchDocuments = async (req, res) => {
  const { organization } = req;
  const { query, collection_id, category_ids, limit = 10, threshold = 0.7 } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Consulta é obrigatória' });
  }
  
  try {
    // Verificar limite de consultas
    const { data: canQuery, error: limitError } = await supabase.rpc(
      'check_query_limit_and_increment',
      { org_id: organization.id }
    );
    
    if (limitError) {
      throw limitError;
    }
    
    if (!canQuery) {
      return res.status(403).json({ error: 'Limite de consultas do plano atingido' });
    }
    
    // Realizar pesquisa vetorial
    const { data, error } = await supabase.rpc(
      'search_documents',
      {
        query_text: query,
        match_count: limit,
        organization_id: organization.id,
        collection_id: collection_id,
        category_ids: category_ids,
        similarity_threshold: threshold
      }
    );
    
    if (error) {
      throw error;
    }
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Erro na pesquisa:', error);
    return res.status(500).json({ error: 'Erro ao realizar pesquisa' });
  }
};

// POST /api/documents/batch - Criar múltiplos documentos
export const batchCreateDocuments = async (req, res) => {
  const { organization, user } = req;
  const { documents } = req.body;
  
  if (!Array.isArray(documents) || documents.length === 0) {
    return res.status(400).json({ error: 'Lista de documentos é obrigatória' });
  }
  
  // Verificar limite de registros do plano
  const { data: usage, error: usageError } = await supabase
    .from('usage_metrics')
    .select('record_count')
    .eq('organization_id', organization.id)
    .eq('month', new Date().toISOString().substring(0, 7))
    .single();
  
  if (usageError) {
    console.error('Erro ao verificar uso:', usageError);
    return res.status(500).json({ error: 'Erro ao verificar limite de registros' });
  }
  
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('plans(*)')
    .eq('organization_id', organization.id)
    .eq('status', 'active')
    .single();
  
  if (subError) {
    console.error('Erro ao verificar assinatura:', subError);
    return res.status(500).json({ error: 'Erro ao verificar assinatura' });
  }
  
  const maxRecords = subscription.plans.max_records;
  const currentCount = usage?.record_count || 0;
  const remainingSlots = maxRecords - currentCount;
  
  if (documents.length > remainingSlots) {
    return res.status(403).json({
      error: 'Limite de registros do plano será excedido',
      limit: maxRecords,
      current: currentCount,
      remaining: remainingSlots,
      requested: documents.length
    });
  }
  
  try {
    // Processar documentos em lotes para evitar sobrecarga
    const batchSize = 100;
    const results = [];
    
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      
      const { data, error } = await supabase.rpc('batch_create_documents', {
        p_documents: batch,
        p_organization_id: organization.id,
        p_created_by: user?.id
      });
      
      if (error) {
        throw error;
      }
      
      results.push(...data);
    }
    
    return res.status(201).json(results);
  } catch (error) {
    console.error('Erro ao criar documentos em lote:', error);
    return res.status(500).json({ error: 'Erro ao criar documentos em lote' });
  }
};
`;

// Implementação da integração com ManyChat
const manyChatIntegration = `
/**
 * Integração com ManyChat
 * 
 * Endpoint específico para integração com ManyChat via POST.
 */

// POST /api/integrations/manychat - Endpoint para ManyChat
export const manyChatEndpoint = async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API Key não fornecida' });
  }
  
  try {
    // Verificar API Key
    const { data: keyData, error } = await supabase
      .from('api_keys')
      .select('*, organizations(*)')
      .eq('key', apiKey)
      .single();
    
    if (error || !keyData) {
      return res.status(401).json({ error: 'API Key inválida' });
    }
    
    const organization = keyData.organizations;
    
    // Extrair consulta do corpo da requisição
    const { query, collection_id, limit = 3 } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        success: false,
        error: 'Consulta é obrigatória'
      });
    }
    
    // Verificar limite de consultas
    const { data: canQuery, error: limitError } = await supabase.rpc(
      'check_query_limit_and_increment',
      { org_id: organization.id }
    );
    
    if (limitError) {
      throw limitError;
    }
    
    if (!canQuery) {
      return res.status(403).json({ 
        success: false,
        error: 'Limite de consultas do plano atingido'
      });
    }
    
    // Realizar pesquisa vetorial
    const { data, error: searchError } = await supabase.rpc(
      'search_documents',
      {
        query_text: query,
        match_count: limit,
        organization_id: organization.id,
        collection_id: collection_id || null,
        category_ids: null,
        similarity_threshold: 0.7
      }
    );
    
    if (searchError) {
      throw searchError;
    }
    
    // Formatar resposta para ManyChat
    const response = {
      success: true,
      results: data.map(item => ({
        id: item.id,
        title: item.title,
        content: item.content,
        similarity: item.similarity
      }))
    };
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Erro na integração com ManyChat:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};
`;

// Funções para verificação de limites do plano
const planLimitFunctions = `
/**
 * Funções para verificação de limites do plano
 * 
 * Estas funções verificam se a organização atingiu os limites
 * de registros e consultas definidos em seu plano.
 */

// Verificar limite de registros
export const checkRecordLimit = async (organizationId) => {
  try {
    // Obter uso atual
    const { data: usage, error: usageError } = await supabase
      .from('usage_metrics')
      .select('record_count')
      .eq('organization_id', organizationId)
      .eq('month', new Date().toISOString().substring(0, 7))
      .single();
    
    if (usageError && usageError.code !== 'PGRST116') {
      throw usageError;
    }
    
    // Obter limite do plano
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('plans(*)')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single();
    
    if (subError) {
      throw subError;
    }
    
    const maxRecords = subscription.plans.max_records;
    const currentCount = usage?.record_count || 0;
    
    return currentCount < maxRecords;
  } catch (error) {
    console.error('Erro ao verificar limite de registros:', error);
    throw error;
  }
};

// Verificar limite de consultas
export const checkQueryLimit = async (organizationId) => {
  try {
    // Obter uso atual
    const { data: usage, error: usageError } = await supabase
      .from('usage_metrics')
      .select('query_count')
      .eq('organization_id', organizationId)
      .eq('month', new Date().toISOString().substring(0, 7))
      .single();
    
    if (usageError && usageError.code !== 'PGRST116') {
      throw usageError;
    }
    
    // Obter limite do plano
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('plans(*)')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single();
    
    if (subError) {
      throw subError;
    }
    
    const maxQueries = subscription.plans.max_queries_per_month;
    const currentCount = usage?.query_count || 0;
    
    return currentCount < maxQueries;
  } catch (error) {
    console.error('Erro ao verificar limite de consultas:', error);
    throw error;
  }
};
`;

// Configuração de rotas da API
const apiRoutes = `
/**
 * Configuração de rotas da API
 * 
 * Define todas as rotas da API e associa aos controladores correspondentes.
 */
import express from 'express';
import { apiKeyAuth } from '../middleware/apiKeyAuth';
import * as documentsController from '../controllers/documentsController';
import * as categoriesController from '../controllers/categoriesController';
import * as collectionsController from '../controllers/collectionsController';
import * as organizationsController from '../controllers/organizationsController';
import * as usersController from '../controllers/usersController';
import * as sharedViewsController from '../controllers/sharedViewsController';
import * as apiKeysController from '../controllers/apiKeysController';
import * as usageController from '../controllers/usageController';
import * as billingController from '../controllers/billingController';
import * as integrationsController from '../controllers/integrationsController';

const router = express.Router();

// Rotas públicas
router.post('/auth/signup', authController.signUp);
router.post('/auth/signin', authController.signIn);
router.post('/auth/reset-password', authController.resetPassword);
router.get('/shared/:slug', sharedViewsController.getPublicView);

// Middleware de autenticação para rotas protegidas
router.use('/api', apiKeyAuth);

// Rotas de documentos
router.get('/api/documents', documentsController.listDocuments);
router.get('/api/documents/:id', documentsController.getDocument);
router.post('/api/documents', documentsController.createDocument);
router.put('/api/documents/:id', documentsController.updateDocument);
router.delete('/api/documents/:id', documentsController.deleteDocument);
router.post('/api/documents/search', documentsController.searchDocuments);
router.post('/api/documents/batch', documentsController.batchCreateDocuments);

// Rotas de categorias
router.get('/api/categories', categoriesController.listCategories);
router.get('/api/categories/:id', categoriesController.getCategory);
router.post('/api/categories', categoriesController.createCategory);
router.put('/api/categories/:id', categoriesController.updateCategory);
router.delete('/api/categories/:id', categoriesController.deleteCategory);

// Rotas de coleções
router.get('/api/collections', collectionsController.listCollections);
router.get('/api/collections/:id', collectionsController.getCollection);
router.post('/api/collections', collectionsController.createCollection);
router.put('/api/collections/:id', collectionsController.updateCollection);
router.delete('/api/collections/:id', collectionsController.deleteCollection);

// Rotas de organizações
router.get('/api/organizations', organizationsController.getOrganization);
router.put('/api/organizations', organizationsController.updateOrganization);
router.put('/api/organizations/domains', organizationsController.updateDomains);

// Rotas de usuários
router.get('/api/users', usersController.listUsers);
router.get('/api/users/:id', usersController.getUser);
router.post('/api/users', usersController.createUser);
router.put('/api/users/:id', usersController.updateUser);
router.delete('/api/users/:id', usersController.deleteUser);

// Rotas de visões compartilhadas
router.get('/api/shared-views', sharedViewsController.listSharedViews);
router.get('/api/shared-views/:id', sharedViewsController.getSharedView);
router.post('/api/shared-views', sharedViewsController.createSharedView);
router.put('/api/shared-views/:id', sharedViewsController.updateSharedView);
router.delete('/api/shared-views/:id', sharedViewsController.deleteSharedView);

// Rotas de chaves de API
router.get('/api/api-keys', apiKeysController.listApiKeys);
router.get('/api/api-keys/:id', apiKeysController.getApiKey);
router.post('/api/api-keys', apiKeysController.createApiKey);
router.delete('/api/api-keys/:id', apiKeysController.deleteApiKey);

// Rotas de métricas de uso
router.get('/api/usage/current', usageController.getCurrentUsage);
router.get('/api/usage/history', usageController.getUsageHistory);

// Rotas de faturamento
router.get('/api/billing/plans', billingController.listPlans);
router.post('/api/billing/subscribe', billingController.subscribe);
router.post('/api/billing/cancel', billingController.cancelSubscription);
router.get('/api/billing/invoices', billingController.listInvoices);

// Rotas de integrações
router.post('/api/integrations/manychat', integrationsController.manyChatEndpoint);

export default router;
`;

// Exportar todos os componentes
module.exports = {
  apiEndpoints,
  apiKeyMiddleware,
  documentsEndpoints,
  manyChatIntegration,
  planLimitFunctions,
  apiRoutes
};
