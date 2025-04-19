import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Middleware para gerenciar domínios personalizados e subdomínios
export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname, host, protocol } = url;
  
  // Verificar se é um domínio personalizado
  const isCustomDomain = !host.includes('vercel.app') && 
                         !host.includes('localhost') && 
                         !host.includes('.app');
  
  // Verificar se é um subdomínio
  const isSubdomain = host.split('.').length > 2 && !isCustomDomain;
  
  // Se não for domínio personalizado nem subdomínio, continuar normalmente
  if (!isCustomDomain && !isSubdomain) {
    return NextResponse.next();
  }
  
  try {
    // Inicializar cliente Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    if (isCustomDomain) {
      // Buscar organização pelo domínio personalizado
      const { data: org, error } = await supabase
        .from('organizations')
        .select('id, slug')
        .eq('custom_domain', host)
        .single();
      
      if (error || !org) {
        // Domínio não encontrado, redirecionar para página de erro
        url.pathname = '/domain-not-found';
        return NextResponse.rewrite(url);
      }
      
      // Adicionar informações da organização ao cabeçalho para uso posterior
      const response = NextResponse.next();
      response.headers.set('x-organization-id', org.id);
      response.headers.set('x-organization-slug', org.slug);
      return response;
    }
    
    if (isSubdomain) {
      // Extrair slug do subdomínio
      const subdomain = host.split('.')[0];
      
      // Buscar organização pelo slug
      const { data: org, error } = await supabase
        .from('organizations')
        .select('id, slug')
        .eq('slug', subdomain)
        .single();
      
      if (error || !org) {
        // Subdomínio não encontrado, redirecionar para página de erro
        url.pathname = '/subdomain-not-found';
        return NextResponse.rewrite(url);
      }
      
      // Adicionar informações da organização ao cabeçalho para uso posterior
      const response = NextResponse.next();
      response.headers.set('x-organization-id', org.id);
      response.headers.set('x-organization-slug', org.slug);
      return response;
    }
  } catch (error) {
    console.error('Erro no middleware de domínio:', error);
    
    // Em caso de erro, continuar normalmente
    return NextResponse.next();
  }
  
  // Fallback
  return NextResponse.next();
}

// Configurar caminhos para aplicar o middleware
export const config = {
  matcher: [
    /*
     * Corresponder a todos os caminhos exceto:
     * 1. /api (rotas de API)
     * 2. /_next (arquivos Next.js)
     * 3. /_static (se estiver usando imagens estáticas)
     * 4. /favicon.ico, /robots.txt, etc.
     */
    '/((?!api|_next|_static|favicon.ico|robots.txt).*)',
  ],
};
