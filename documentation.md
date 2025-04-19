# Documentação do VectorDB SaaS

## Visão Geral

O VectorDB SaaS é uma plataforma completa para empresas gerenciarem bancos de dados vetoriais (embeddings) através de uma interface amigável ou API REST. A solução permite inserir, consultar, atualizar e excluir dados vetoriais, otimizando o uso por sistemas de IA.

### Principais Funcionalidades

- **Sistema Multi-tenant**: Cada empresa tem seu próprio ambiente isolado
- **Níveis de Permissão**: Admin (acesso total, cobrança), Editor (CRUD) e Visualizador (leitura)
- **Planos Escaláveis**: Gratuito (até 1.000 registros ou 10.000 consultas/mês) e Pago (escalável por volume)
- **Categorização**: Sistema de tags para organizar entradas
- **API REST Completa**: Suporte a operações CRUD via POST, GET, PUT, DELETE
- **Integração com ManyChat**: Fácil integração via POST
- **Compartilhamento**: Visões da base com URLs personalizáveis
- **Domínios Personalizados**: Suporte a domínio próprio e subdomínios por empresa

## Arquitetura

### Backend (Supabase)

O backend utiliza o Supabase como plataforma, aproveitando os seguintes recursos:

- **PostgreSQL**: Banco de dados relacional para armazenamento de dados
- **pgvector**: Extensão para suporte a vetores e pesquisa por similaridade
- **Supabase Auth**: Sistema de autenticação e gerenciamento de usuários
- **Row Level Security (RLS)**: Políticas de segurança para isolamento de dados
- **Supabase Automatic Embeddings**: Geração automática de embeddings sem necessidade de chave OpenAI individual

### Frontend (Next.js/Vercel)

O frontend é desenvolvido com Next.js e implantado na Vercel, oferecendo:

- **Interface Moderna**: Design minimalista estilo Notion
- **Autenticação Segura**: Login e recuperação de senha
- **Painel Administrativo**: Controle de acesso e cobrança
- **CRUD Completo**: Interface para gerenciamento de dados
- **Pesquisa Vetorial**: Busca por similaridade com filtros
- **Responsividade**: Adaptação para diferentes dispositivos

## Estrutura do Banco de Dados

### Tabelas Principais

- **organizations**: Armazena informações das empresas (multi-tenant)
- **user_profiles**: Perfis de usuários com níveis de permissão
- **documents**: Entradas de dados com conteúdo e embeddings
- **categories**: Tags para categorização de documentos
- **collections**: Agrupamentos de documentos
- **shared_views**: Configurações de visões compartilhadas
- **api_keys**: Chaves de API para acesso programático
- **plans**: Planos disponíveis (gratuito/pagos)
- **subscriptions**: Assinaturas de organizações a planos
- **usage_metrics**: Métricas de uso para cobrança

## API REST

A API REST permite integração com sistemas externos e suporta as seguintes operações:

### Autenticação

- **POST /auth/signup**: Criar nova conta
- **POST /auth/signin**: Fazer login
- **POST /auth/reset-password**: Recuperar senha

### Documentos

- **GET /api/documents**: Listar documentos
- **GET /api/documents/:id**: Obter documento específico
- **POST /api/documents**: Criar novo documento
- **PUT /api/documents/:id**: Atualizar documento
- **DELETE /api/documents/:id**: Excluir documento
- **POST /api/documents/search**: Pesquisar documentos por similaridade
- **POST /api/documents/batch**: Criar múltiplos documentos

### Categorias

- **GET /api/categories**: Listar categorias
- **POST /api/categories**: Criar categoria
- **PUT /api/categories/:id**: Atualizar categoria
- **DELETE /api/categories/:id**: Excluir categoria

### Coleções

- **GET /api/collections**: Listar coleções
- **POST /api/collections**: Criar coleção
- **PUT /api/collections/:id**: Atualizar coleção
- **DELETE /api/collections/:id**: Excluir coleção

### Visões Compartilhadas

- **GET /api/shared-views**: Listar visões compartilhadas
- **POST /api/shared-views**: Criar visão compartilhada
- **PUT /api/shared-views/:id**: Atualizar visão compartilhada
- **DELETE /api/shared-views/:id**: Excluir visão compartilhada
- **GET /shared/:slug**: Acessar visão compartilhada pública

### Chaves de API

- **GET /api/api-keys**: Listar chaves de API
- **POST /api/api-keys**: Criar chave de API
- **DELETE /api/api-keys/:id**: Excluir chave de API

### Integração com ManyChat

- **POST /api/integrations/manychat**: Endpoint específico para ManyChat

## Autenticação e Segurança

### Autenticação de Usuários

O sistema utiliza autenticação baseada em JWT através do Supabase Auth, com suporte a:

- Login com email/senha
- Recuperação de senha
- Sessões persistentes

### Autenticação de API

Para acesso via API, o sistema utiliza chaves de API:

- Cada organização pode criar múltiplas chaves
- As chaves podem ter permissões específicas
- Autenticação via cabeçalho `X-API-Key`

### Segurança de Dados

A segurança dos dados é garantida por:

- Políticas de Row Level Security (RLS) no Supabase
- Isolamento completo entre organizações (multi-tenant)
- Controle de acesso baseado em funções (Admin, Editor, Visualizador)

## Domínios e Implantação

### Configuração de Domínios

O sistema suporta:

- **Domínio Principal**: triptop.com.br
- **Subdomínios**: empresa.triptop.com.br
- **Domínios Personalizados**: dominio-proprio-da-empresa.com.br

### Implantação no Vercel

A implantação é realizada no Vercel, com:

- Integração contínua com repositório Git
- Configuração de variáveis de ambiente
- Suporte a domínios personalizados e subdomínios
- Cache de borda para melhor performance

## Guia de Uso

### Para Administradores

1. **Cadastro**: Crie uma conta e configure sua organização
2. **Configuração**: Defina categorias e coleções para organizar dados
3. **Usuários**: Adicione usuários com diferentes níveis de permissão
4. **API**: Gere chaves de API para integração com sistemas externos
5. **Domínios**: Configure subdomínio ou domínio personalizado

### Para Editores

1. **Documentos**: Crie, edite e exclua documentos
2. **Categorias**: Organize documentos com categorias (tags)
3. **Visões**: Crie visões compartilhadas para acesso público
4. **Pesquisa**: Utilize a pesquisa vetorial para encontrar documentos similares

### Para Visualizadores

1. **Consulta**: Visualize documentos e coleções
2. **Pesquisa**: Utilize a pesquisa vetorial para encontrar documentos similares
3. **Visões**: Acesse visões compartilhadas

### Uso da API

Para utilizar a API, siga estes passos:

1. Gere uma chave de API no painel administrativo
2. Inclua a chave no cabeçalho `X-API-Key` das requisições
3. Utilize os endpoints conforme documentação

Exemplo de pesquisa via API:

```bash
curl -X POST https://sua-organizacao.triptop.com.br/api/documents/search \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua-chave-api" \
  -d '{"query": "sua consulta aqui"}'
```

## Integração com ManyChat

Para integrar com ManyChat:

1. Gere uma chave de API no painel administrativo
2. No ManyChat, crie uma ação HTTP Request
3. Configure o método POST para o endpoint `/api/integrations/manychat`
4. Adicione o cabeçalho `X-API-Key` com sua chave
5. No corpo da requisição, inclua a consulta:

```json
{
  "query": "{{pergunta_do_usuario}}",
  "collection_id": "opcional-id-da-colecao",
  "limit": 3
}
```

6. Configure o ManyChat para utilizar a resposta nas mensagens

## Limitações e Planos Futuros

### Limitações Atuais

- Suporte apenas para embeddings da OpenAI
- Limite de 1.536 dimensões para vetores
- Sem suporte a busca multimodal (apenas texto)

### Planos Futuros

- Suporte a outros provedores de embeddings
- Busca multimodal (imagens e texto)
- Análise avançada de dados vetoriais
- Integração com mais plataformas além do ManyChat
- Ferramentas de visualização de clusters

## Suporte e Contato

Para suporte técnico ou dúvidas sobre o VectorDB SaaS, entre em contato através de:

- Email: suporte@triptop.com.br
- Painel administrativo: Seção de Suporte
