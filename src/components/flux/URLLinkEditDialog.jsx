import React, { useState, useEffect } from 'react';
import { onhub } from '@/api/onhubClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function URLLinkEditDialog({ open, onOpenChange, data, onSave }) {
  const [formData, setFormData] = useState(data);
  const [loading, setLoading] = useState(false);
  const [autoFetchTimeout, setAutoFetchTimeout] = useState(null);

  const handleFetchMetadata = async () => {
    if (!formData.url) return;
    
    setLoading(true);
    try {
      const prompt = `Você DEVE acessar a página web ${formData.url} e extrair EXATAMENTE as seguintes meta tags HTML:

IMPORTANTE: Extraia os valores EXATOS das meta tags, não invente informações.

Procure estas meta tags no HTML da página:
1. IMAGEM DE DESTAQUE (PRIORIDADE MÁXIMA - procure nesta ordem):
   - <meta property="og:image" content="URL_DA_IMAGEM">
   - <meta name="twitter:image" content="URL_DA_IMAGEM">
   - <meta property="og:image:secure_url" content="URL_DA_IMAGEM">
   - <link rel="image_src" href="URL_DA_IMAGEM">

2. TÍTULO (procure nesta ordem):
   - <meta property="og:title" content="TITULO">
   - <meta name="twitter:title" content="TITULO">
   - <title>TITULO</title>

3. DESCRIÇÃO (procure nesta ordem):
   - <meta property="og:description" content="DESCRICAO">
   - <meta name="description" content="DESCRICAO">
   - <meta name="twitter:description" content="DESCRICAO">

4. OUTRAS INFORMAÇÕES:
   - <meta property="og:site_name" content="...">
   - <meta property="og:type" content="...">
   - <link rel="canonical" href="...">
   - <meta name="author" content="...">
   - <meta property="article:published_time" content="...">

RETORNE APENAS os valores ENCONTRADOS nas meta tags. Se não encontrar, deixe vazio.
A URL da imagem DEVE ser completa (começar com http:// ou https://).`;

      const schema = {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          image: { type: "string" },
          site_name: { type: "string" },
          type: { type: "string" },
          canonical_url: { type: "string" },
          author: { type: "string" },
          published_date: { type: "string" }
        }
      };

      const result = await onhub.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: schema
      });

      setFormData({
        ...formData,
        title: result.title || formData.title || 'Link',
        description: result.description || formData.description || '',
        image: result.image || formData.image || '',
        site_name: result.site_name || formData.site_name || '',
        type: result.type || formData.type || '',
        canonical_url: result.canonical_url || formData.canonical_url || '',
        author: result.author || formData.author || '',
        published_date: result.published_date || formData.published_date || ''
      });
    } catch (error) {
      console.error('Erro ao buscar metadados:', error);
      alert('Não foi possível carregar as informações do site. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    onSave(formData);
  };

  // Auto-fetch metadata when URL changes
  useEffect(() => {
    if (formData.url && formData.url.startsWith('http')) {
      if (autoFetchTimeout) clearTimeout(autoFetchTimeout);
      
      const timeout = setTimeout(() => {
        handleFetchMetadata();
      }, 1500); // Wait 1.5s after user stops typing
      
      setAutoFetchTimeout(timeout);
    }
    
    return () => {
      if (autoFetchTimeout) clearTimeout(autoFetchTimeout);
    };
  }, [formData.url]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Link/URL</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">URL {loading && <span className="text-xs text-blue-600 ml-2">(carregando informações...)</span>}</label>
            <div className="flex gap-2">
              <Input
                value={formData.url || ''}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://exemplo.com"
                className="flex-1"
                disabled={loading}
              />
              <Button
                variant="outline"
                onClick={() => window.open(formData.url || 'https://google.com', '_blank')}
                disabled={!formData.url}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Cole a URL e aguarde o carregamento automático das informações</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Título</label>
              <Input
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título do link"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Nome do Site</label>
              <Input
                value={formData.site_name || ''}
                onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                placeholder="Nome do site"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Descrição</label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição do conteúdo"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">URL da Imagem de Destaque</label>
            <Input
              value={formData.image || ''}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://exemplo.com/imagem.jpg"
            />
            {formData.image && (
              <div className="mt-2 border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center" style={{ height: '200px' }}>
                <img 
                  src={formData.image} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Conteúdo</label>
              <Input
                value={formData.type || ''}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="article, website, etc"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Autor</label>
              <Input
                value={formData.author || ''}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="Nome do autor"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">URL Canônica</label>
              <Input
                value={formData.canonical_url || ''}
                onChange={(e) => setFormData({ ...formData, canonical_url: e.target.value })}
                placeholder="https://exemplo.com/artigo"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Data de Publicação</label>
              <Input
                value={formData.published_date || ''}
                onChange={(e) => setFormData({ ...formData, published_date: e.target.value })}
                placeholder="2024-01-01"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Preview do Site (iframe)</label>
            <div className="border rounded-lg overflow-hidden" style={{ height: '400px' }}>
              <iframe
                src={formData.url || 'https://google.com'}
                className="w-full h-full"
                title="Preview"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
