import { createClient } from '@supabase/supabase-js';

// Configuração para implantação no Vercel
export const vercelConfig = {
  // Configurações para o projeto Next.js
  nextjs: {
    // Habilitar ISR (Incremental Static Regeneration)
    isr: {
      enabled: true,
      revalidateTime: 60, // Revalidar a cada 60 segundos
    },
    
    // Configurações de imagens
    images: {
      domains: [
        'localhost',
        'vercel.app',
        'supabase.co',
        // Adicionar outros domínios conforme necessário
      ],
      // Permitir qualquer domínio em produção
      remotePatterns: [
        {
          protocol: 'https',
          hostname: '**',
        },
      ],
    },
    
    // Configurações de ambiente
    env: {
      // Variáveis de ambiente públicas
      NEXT_PUBLIC_SUPABASE_URL: 'process.env.NEXT_PUBLIC_SUPABASE_URL',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY',
      NEXT_PUBLIC_APP_URL: 'process.env.NEXT_PUBLIC_APP_URL',
      
      // Variáveis de ambiente privadas (server-side)
      SUPABASE_SERVICE_ROLE_KEY: 'process.env.SUPABASE_SERVICE_ROLE_KEY',
    },
  },
  
  // Configurações para domínios personalizados
  domains: {
    // Domínio principal
    main: 'triptop.com.br',
    
    // Configuração de subdomínios
    subdomains: {
      enabled: true,
      pattern: '{slug}.triptop.com.br',
    },
    
    // Configuração para domínios personalizados
    custom: {
      enabled: true,
      // Verificação de propriedade via TXT record
      verification: {
        type: 'TXT',
        name: '_vectordb-verify',
        ttl: 3600,
      },
    },
  },
  
  // Configurações de cache
  cache: {
    // Cache de borda para melhorar performance
    edge: {
      enabled: true,
      // Páginas que não devem ser cacheadas
      bypass: [
        '/api/*',
        '/auth/*',
      ],
    },
  },
  
  // Configurações de segurança
  security: {
    // Headers de segurança
    headers: {
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  },
};

// Função para configurar cliente Supabase com chave de serviço
export const createServiceSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Função para atualizar domínio personalizado de uma organização
export const updateCustomDomain = async ({
  supabase,
  organizationId,
  customDomain,
}) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .update({ custom_domain: customDomain })
      .eq('id', organizationId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Erro ao atualizar domínio: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao atualizar domínio personalizado:', error);
    throw error;
  }
};

// Função para verificar disponibilidade de slug para subdomínio
export const checkSlugAvailability = async ({
  supabase,
  slug,
}) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    
    if (error) {
      throw new Error(`Erro ao verificar slug: ${error.message}`);
    }
    
    return {
      available: !data,
      slug,
    };
  } catch (error) {
    console.error('Erro ao verificar disponibilidade de slug:', error);
    throw error;
  }
};

// Função para atualizar slug de uma organização
export const updateOrganizationSlug = async ({
  supabase,
  organizationId,
  slug,
}) => {
  try {
    // Verificar disponibilidade
    const { available } = await checkSlugAvailability({
      supabase,
      slug,
    });
    
    if (!available) {
      throw new Error('Este slug já está em uso');
    }
    
    const { data, error } = await supabase
      .from('organizations')
      .update({ slug })
      .eq('id', organizationId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Erro ao atualizar slug: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao atualizar slug da organização:', error);
    throw error;
  }
};

// Instruções para configuração no Vercel
export const vercelDeploymentInstructions = `
# Instruções para Implantação no Vercel

## Pré-requisitos
1. Conta no Vercel
2. Repositório Git com o código do projeto
3. Projeto Supabase configurado

## Passos para Implantação

### 1. Conectar Repositório ao Vercel
- Acesse o dashboard do Vercel
- Clique em "New Project"
- Importe o repositório Git contendo o código do projeto
- Selecione o repositório e clique em "Import"

### 2. Configurar Variáveis de Ambiente
Adicione as seguintes variáveis de ambiente:

- \`NEXT_PUBLIC_SUPABASE_URL\`: URL do seu projeto Supabase
- \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`: Chave anônima do Supabase
- \`SUPABASE_SERVICE_ROLE_KEY\`: Chave de serviço do Supabase (mantenha segura!)
- \`NEXT_PUBLIC_APP_URL\`: URL base da sua aplicação (ex: https://app.triptop.com.br)

### 3. Configurar Domínios
- Após a implantação, vá para a aba "Domains" no projeto Vercel
- Adicione seu domínio principal (ex: triptop.com.br)
- Configure os registros DNS conforme instruções do Vercel

### 4. Configurar Subdomínios Curinga
Para permitir subdomínios dinâmicos:
- Adicione um registro DNS curinga: \`*.triptop.com.br\` apontando para o projeto Vercel
- No Vercel, adicione \`*.triptop.com.br\` como domínio

### 5. Configurar Domínios Personalizados
Para cada domínio personalizado de cliente:
- O cliente deve adicionar um registro CNAME apontando para \`cname.vercel-dns.com\`
- O cliente deve adicionar um registro TXT \`_vectordb-verify\` com o valor do ID da organização para verificação

### 6. Implantação Contínua
- O Vercel automaticamente implantará novas versões quando houver commits no branch principal
- Você pode configurar previews para branches de desenvolvimento

### 7. Monitoramento
- Use o painel do Vercel para monitorar:
  - Tempo de atividade
  - Performance
  - Logs de erro
  - Uso de recursos
`;

// Exportar configurações e funções
export default {
  vercelConfig,
  createServiceSupabaseClient,
  updateCustomDomain,
  checkSlugAvailability,
  updateOrganizationSlug,
  vercelDeploymentInstructions,
};
