import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { searchDocuments } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SearchComponent({ 
  collections = [], 
  categories = [],
  onResultSelect = () => {}
}) {
  const { supabase, organization } = useAuth();
  const [query, setQuery] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const searchResults = await searchDocuments({
        supabase,
        query: query.trim(),
        organizationId: organization?.id,
        collectionId: collectionId || null,
        categoryIds: selectedCategories.length > 0 ? selectedCategories : null,
        limit: 20,
        threshold: 0.6
      });
      
      setResults(searchResults || []);
    } catch (err) {
      console.error('Erro na pesquisa:', err);
      setError(err.message || 'Erro ao realizar pesquisa');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="text"
          placeholder="Digite sua consulta..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Pesquisando...' : 'Pesquisar'}
        </Button>
      </form>
      
      <Tabs defaultValue="filters" className="w-full">
        <TabsList>
          <TabsTrigger value="filters">Filtros</TabsTrigger>
          <TabsTrigger value="results">
            Resultados {results.length > 0 && `(${results.length})`}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="filters" className="space-y-4">
          <div>
            <label className="text-sm font-medium">Coleção</label>
            <Select
              value={collectionId}
              onValueChange={setCollectionId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as coleções" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as coleções</SelectItem>
                {collections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Categorias</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
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
          </div>
        </TabsContent>
        
        <TabsContent value="results">
          {error && (
            <div className="p-4 mb-4 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          
          {results.length === 0 && !loading && !error ? (
            <div className="text-center py-8 text-muted-foreground">
              {query.trim() ? 'Nenhum resultado encontrado' : 'Digite uma consulta para pesquisar'}
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="p-4 border rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onResultSelect(result)}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{result.title}</h3>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(result.similarity * 100)}% relevante
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {result.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
