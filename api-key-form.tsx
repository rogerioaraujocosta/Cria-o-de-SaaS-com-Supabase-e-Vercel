import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createApiKey } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const apiKeySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  permissions: z.array(z.string()).optional(),
  expires_at: z.string().optional(),
});

export default function ApiKeyForm({
  isOpen,
  onClose,
  onSuccess = () => {},
}) {
  const { supabase, user, organization } = useAuth();
  const [loading, setLoading] = useState(false);
  const [newApiKey, setNewApiKey] = useState(null);

  const form = useForm({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      name: '',
      permissions: ['read', 'search'],
      expires_at: '',
    },
  });

  const handleSubmit = async (data) => {
    try {
      setLoading(true);
      
      const result = await createApiKey({
        supabase,
        organizationId: organization.id,
        userId: user.id,
        name: data.name,
        permissions: data.permissions,
        expiresAt: data.expires_at || null,
      });
      
      setNewApiKey(result.key);
      onSuccess();
    } catch (error) {
      console.error('Erro ao criar chave de API:', error);
      // Mostrar erro no formulário
      form.setError('root', { 
        type: 'manual',
        message: `Erro ao criar chave de API: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewApiKey(null);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Chave de API</DialogTitle>
        </DialogHeader>
        
        {newApiKey ? (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm font-medium text-yellow-800 mb-2">
                Importante: Guarde esta chave em um local seguro!
              </p>
              <p className="text-xs text-yellow-700 mb-4">
                Esta é a única vez que você verá esta chave. Não será possível recuperá-la depois.
              </p>
              <div className="bg-white p-3 rounded border border-yellow-300 font-mono text-sm break-all">
                {newApiKey}
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>Use esta chave para autenticar requisições à API.</p>
              <p className="mt-2">Exemplo:</p>
              <pre className="bg-muted p-2 rounded-md text-xs mt-1 overflow-x-auto">
                {`curl -X POST ${window.location.origin}/api/documents/search \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${newApiKey}" \\
  -d '{"query": "sua consulta aqui"}'`}
              </pre>
            </div>
            
            <DialogFooter>
              <Button onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome para identificar esta chave" />
                    </FormControl>
                    <FormDescription>
                      Um nome descritivo para identificar o propósito desta chave
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="expires_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de expiração (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </FormControl>
                    <FormDescription>
                      Deixe em branco para uma chave que não expira
                    </FormDescription>
                    <FormMessage />
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
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Criando...' : 'Criar Chave'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
