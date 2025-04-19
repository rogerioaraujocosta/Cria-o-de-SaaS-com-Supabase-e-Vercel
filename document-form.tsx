import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getCategories, createDocument, updateDocument, deleteDocument } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const documentSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  collection_id: z.string().optional(),
  external_id: z.string().optional(),
  metadata: z.any().optional(),
  categories: z.array(z.string()).optional(),
});

export default function DocumentForm({
  isOpen,
  onClose,
  document = null,
  collections = [],
  onSuccess = () => {},
}) {
  const { supabase, user, organization } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const form = useForm({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: document?.title || '',
      content: document?.content || '',
      collection_id: document?.collection_id || '',
      external_id: document?.external_id || '',
      metadata: document?.metadata || {},
      categories: [],
    },
  });

  useEffect(() => {
    if (isOpen && organization) {
      loadCategories();
      
      if (document) {
        form.reset({
          title: document.title || '',
          content: document.content || '',
          collection_id: document.collection_id || '',
          external_id: document.external_id || '',
          metadata: document.metadata || {},
        });
        
        // Configurar categorias selecionadas
        if (document.categories) {
          const categoryIds = document.categories.map(cat => cat.id);
          setSelectedCategories(categoryIds);
          form.setValue('categories', categoryIds);
        }
      } else {
        form.reset({
          title: '',
          content: '',
          collection_id: '',
          external_id: '',
          metadata: {},
          categories: [],
        });
        setSelectedCategories([]);
      }
    }
  }, [isOpen, document, organization]);

  const loadCategories = async () => {
    try {
      const categoriesData = await getCategories({
        supabase,
        organizationId: organization.id,
      });
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev => {
      const newSelection = prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId];
      
      form.setValue('categories', newSelection);
      return newSelection;
    });
  };

  const handleSubmit = async (data) => {
    try {
      setLoading(true);
      
      if (document) {
        // Atualizar documento existente
        await updateDocument({
          supabase,
          documentId: document.id,
          organizationId: organization.id,
          title: data.title,
          content: data.content,
          collectionId: data.collection_id || null,
          externalId: data.external_id || null,
          metadata: data.metadata || {},
          categories: data.categories || [],
        });
      } else {
        // Criar novo documento
        await createDocument({
          supabase,
          organizationId: organization.id,
          userId: user.id,
          title: data.title,
          content: data.content,
          collectionId: data.collection_id || null,
          externalId: data.external_id || null,
          metadata: data.metadata || {},
          categories: data.categories || [],
        });
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar documento:', error);
      // Mostrar erro no formulário
      form.setError('root', { 
        type: 'manual',
        message: `Erro ao salvar documento: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!document) return;
    
    if (!confirm('Tem certeza que deseja excluir este documento?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      await deleteDocument({
        supabase,
        documentId: document.id,
        organizationId: organization.id,
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      alert(`Erro ao excluir documento: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {document ? 'Editar Documento' : 'Novo Documento'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Título do documento" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conteúdo</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Conteúdo do documento" 
                      className="min-h-[200px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="collection_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coleção</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma coleção" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Nenhuma coleção</SelectItem>
                      {collections.map((collection) => (
                        <SelectItem key={collection.id} value={collection.id}>
                          {collection.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="external_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Externo (opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ID externo para referência" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="categories"
              render={() => (
                <FormItem>
                  <FormLabel>Categorias</FormLabel>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        onClick={() => handleCategoryToggle(category.id)}
                        className={`px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${
                          selectedCategories.includes(category.id)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground'
                        }`}
                        style={{
                          backgroundColor: selectedCategories.includes(category.id)
                            ? category.color || ''
                            : '',
                          color: selectedCategories.includes(category.id)
                            ? '#ffffff'
                            : ''
                        }}
                      >
                        {category.name}
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {form.formState.errors.root && (
              <div className="text-sm font-medium text-destructive">
                {form.formState.errors.root.message}
              </div>
            )}
            
            <DialogFooter className="flex justify-between">
              <div>
                {document && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    Excluir
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
