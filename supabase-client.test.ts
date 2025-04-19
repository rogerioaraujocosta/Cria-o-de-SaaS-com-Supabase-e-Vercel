import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { searchDocuments, createDocument, updateDocument, deleteDocument } from '@/lib/supabase-client';

// Mock do cliente Supabase
const mockSupabase = {
  rpc: vi.fn(),
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        maybeSingle: vi.fn(),
        in: vi.fn(),
        order: vi.fn(() => ({
          range: vi.fn(),
          limit: vi.fn()
        }))
      })),
      order: vi.fn(() => ({
        range: vi.fn()
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn()
      }))
    }))
  })
};

describe('Funções de banco de dados vetorial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchDocuments', () => {
    it('deve verificar o limite de consultas antes de pesquisar', async () => {
      // Configurar mocks
      mockSupabase.rpc.mockResolvedValueOnce({ data: true, error: null });
      mockSupabase.rpc.mockResolvedValueOnce({ data: [{ id: '1', title: 'Teste', content: 'Conteúdo de teste', similarity: 0.95 }], error: null });

      // Executar função
      await searchDocuments({
        supabase: mockSupabase,
        query: 'teste',
        organizationId: 'org-123',
        limit: 10
      });

      // Verificar se a função de verificação de limite foi chamada
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'check_query_limit_and_increment',
        { org_id: 'org-123' }
      );

      // Verificar se a função de pesquisa foi chamada com os parâmetros corretos
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'search_documents',
        {
          query_text: 'teste',
          match_count: 10,
          organization_id: 'org-123',
          collection_id: null,
          category_ids: null,
          similarity_threshold: 0.7
        }
      );
    });

    it('deve lançar erro quando o limite de consultas for excedido', async () => {
      // Configurar mock para simular limite excedido
      mockSupabase.rpc.mockResolvedValueOnce({ data: false, error: null });

      // Verificar se a função lança erro
      await expect(
        searchDocuments({
          supabase: mockSupabase,
          query: 'teste',
          organizationId: 'org-123'
        })
      ).rejects.toThrow('Limite de consultas excedido para este mês');
    });
  });

  describe('createDocument', () => {
    it('deve verificar o limite de registros antes de criar documento', async () => {
      // Configurar mocks
      mockSupabase.rpc.mockResolvedValueOnce({ data: true, error: null });
      mockSupabase.rpc.mockResolvedValueOnce({ data: { id: '1' }, error: null });

      // Executar função
      await createDocument({
        supabase: mockSupabase,
        organizationId: 'org-123',
        userId: 'user-123',
        title: 'Teste',
        content: 'Conteúdo de teste'
      });

      // Verificar se a função de verificação de limite foi chamada
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'check_record_limit',
        { org_id: 'org-123' }
      );

      // Verificar se a função de criação foi chamada com os parâmetros corretos
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'create_document_with_categories',
        expect.objectContaining({
          p_title: 'Teste',
          p_content: 'Conteúdo de teste',
          p_organization_id: 'org-123',
          p_created_by: 'user-123'
        })
      );
    });
  });

  describe('updateDocument', () => {
    it('deve verificar se o documento existe antes de atualizar', async () => {
      // Configurar mocks
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({ data: { id: '1' }, error: null });
      mockSupabase.rpc.mockResolvedValueOnce({ data: { id: '1' }, error: null });

      // Executar função
      await updateDocument({
        supabase: mockSupabase,
        documentId: '1',
        organizationId: 'org-123',
        title: 'Teste Atualizado',
        content: 'Conteúdo atualizado'
      });

      // Verificar se a verificação de existência foi chamada
      expect(mockSupabase.from).toHaveBeenCalledWith('documents');
      
      // Verificar se a função de atualização foi chamada com os parâmetros corretos
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'update_document_with_categories',
        expect.objectContaining({
          p_id: '1',
          p_title: 'Teste Atualizado',
          p_content: 'Conteúdo atualizado'
        })
      );
    });
  });

  describe('deleteDocument', () => {
    it('deve verificar se o documento existe antes de excluir', async () => {
      // Configurar mocks
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({ data: { id: '1' }, error: null });
      mockSupabase.from().delete().eq.mockResolvedValueOnce({ error: null });

      // Executar função
      await deleteDocument({
        supabase: mockSupabase,
        documentId: '1',
        organizationId: 'org-123'
      });

      // Verificar se a verificação de existência foi chamada
      expect(mockSupabase.from).toHaveBeenCalledWith('documents');
      
      // Verificar se a função de exclusão foi chamada
      expect(mockSupabase.from).toHaveBeenCalledWith('documents');
      expect(mockSupabase.from().delete().eq).toHaveBeenCalled();
    });
  });
});
