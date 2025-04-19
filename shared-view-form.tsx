import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getCategories, createSharedView } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const sharedViewSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  slug: z.string().min(1, 'Slug é obrigatório')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  collection_id: z.string().optional(),
  filter_categories: z.array(z.string()).optional(),
  is_public: z.boolean().default(false),
});

export default function SharedViewForm({
  isOpen,
  onClose,
  collections = [],
  onSuccess = () => {},
}) {
  const { supabase, user, organization } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [publicUrl, setPublicUrl] = useState('');

  const form = useForm({
    resolver: zodResolver(sharedViewSchema),
    defaultValues: {
      name: '',
      slug: '',
      collection_id: '',
      filter_categories: [],
      is_public: false,
    },
  });

  useEffect(() => {
    if (isOpen && organization) {
      loadCategories();
      form.reset({
        name: '',
        slug: '',
        collection_id: '',
        filter_categories: [],
        is_public: false,
      });
      setSelectedCategories([]);
      updatePublicUrl(form.getValues().slug);
    }
  }, [isOpen, organization]);

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
      
      form.setValue('filter_categories', newSelection);
      return newSelection;
    });
  };

  const updatePublicUrl = (slug) => {
    if (!slug) {
      setPublicUrl('');
      return;
    }
    
    const baseUrl = window.location.origin;
    const orgSlug = organization?.slug || '';
    
    if (organization?.custom_domain) {
      setPublicUrl(`https://${organization.custom_domain}/shared/${slug}`);
    } else {
      setPublicUrl(`${baseUrl}/shared/${orgSlug}/${slug}`);
    }
  };

  const handleSlugChange = (e) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    form.setValue('slug', value);
    updatePublicUrl(value);
  };

  const handleSubmit = async (data) => {
    try {
      setLoading(true);
      
      await createSharedView({
        supabase,
        organizationId: organization.id,
        userId: user.id,
        name: data.name,
        slug: data.slug,
        collectionId: data.collection_id || null,
        filterCategories: data.filter_categories || [],
        isPublic: data.is_public,
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao criar visão compartilhada:', error);
      // Mostrar erro no formulário
      form.setError('root', { 
        type: 'manual',
        message: `Erro ao criar visão compartilhada: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nova Visão Compartilhada</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome da visão compartilhada" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="slug-da-visao" 
                      onChange={handleSlugChange}
                    />
                  </FormControl>
                  <FormDescription>
                    {publicUrl && (
                      <span className="text-xs">URL: {publicUrl}</span>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="collection_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coleção (opcional)</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as coleções" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Todas as coleções</SelectItem>
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
              name="filter_categories"
              render={() => (
                <FormItem>
                  <FormLabel>Filtrar por categorias (opcional)</FormLabel>
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
            
            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Visão pública</FormLabel>
                    <FormDescription>
                      Tornar esta visão acessível publicamente através de URL
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {form.formState.errors.root && (
              <div className="text-sm font-medium text-destructive">
                {form.formState.errors.root.message}
              </div>
            )}
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Criando...' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
