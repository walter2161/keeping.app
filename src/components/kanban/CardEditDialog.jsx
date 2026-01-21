import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Image, Paperclip, X, Sparkles, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const priorityColors = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

const coverColors = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'
];

export default function CardEditDialog({ open, onOpenChange, data, onSave }) {
  const [editData, setEditData] = useState(data || {
    title: '',
    description: '',
    priority: 'medium',
    coverType: 'none',
    coverColor: coverColors[0],
    coverImage: '',
    coverImageZoom: 100,
    attachments: [],
  });
  
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);

  React.useEffect(() => {
    if (data) {
      setEditData(data);
    }
  }, [data]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (editData.coverType === 'image') {
        setEditData({ ...editData, coverImage: file_url });
      } else {
        const newAttachment = {
          id: Date.now().toString(),
          name: file.name,
          url: file_url
        };
        setEditData({ 
          ...editData, 
          attachments: [...(editData.attachments || []), newAttachment]
        });
      }
    } finally {
      setUploadingFile(false);
    }
  };

  const removeAttachment = (attachmentId) => {
    const updatedAttachments = editData.attachments.filter(a => a.id !== attachmentId);
    setEditData({ ...editData, attachments: updatedAttachments });
  };

  const generateAIImage = async () => {
    if (!aiPrompt.trim()) return;

    setGeneratingAI(true);
    try {
      const result = await base44.integrations.Core.GenerateImage({
        prompt: aiPrompt
      });

      if (result?.url) {
        if (editData.coverType === 'image') {
          setEditData({ ...editData, coverImage: result.url });
        } else {
          const newAttachment = {
            id: Date.now().toString(),
            name: `AI: ${aiPrompt.substring(0, 30)}...`,
            url: result.url
          };
          setEditData({ 
            ...editData, 
            attachments: [...(editData.attachments || []), newAttachment]
          });
        }
        setAiPrompt('');
        setShowAIGenerator(false);
      }
    } catch (error) {
      alert('Erro ao gerar imagem: ' + error.message);
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSave = () => {
    onSave(editData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data?.id ? 'Editar Cartão' : 'Novo Cartão'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Input
            placeholder="Título"
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
          />
          
          <Textarea
            placeholder="Descrição"
            value={editData.description || ''}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          />
          
          <select
            className="w-full p-2 border rounded-md"
            value={editData.priority || 'medium'}
            onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
          >
            <option value="low">Prioridade Baixa</option>
            <option value="medium">Prioridade Média</option>
            <option value="high">Prioridade Alta</option>
          </select>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Capa do Cartão:</label>
              <select
                className="text-sm p-1 border rounded"
                value={editData.coverType || 'none'}
                onChange={(e) => setEditData({ ...editData, coverType: e.target.value })}
              >
                <option value="none">Sem capa</option>
                <option value="color">Cor</option>
                <option value="image">Imagem</option>
              </select>
            </div>

            {editData.coverType === 'color' && (
              <div className="flex gap-2 flex-wrap">
                {coverColors.map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded border-2 ${
                      editData.coverColor === color ? 'border-blue-500' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditData({ ...editData, coverColor: color })}
                  />
                ))}
              </div>
            )}

            {editData.coverType === 'image' && (
              <div className="space-y-3">
                {editData.coverImage ? (
                  <div className="space-y-2">
                    <div className="relative overflow-hidden rounded bg-gray-100" style={{ height: '200px' }}>
                      <div style={{ 
                        width: '100%', 
                        height: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        overflow: 'hidden'
                      }}>
                        <img 
                          src={editData.coverImage} 
                          style={{ 
                            maxWidth: '100%',
                            maxHeight: '100%',
                            width: 'auto',
                            height: 'auto',
                            objectFit: 'contain',
                            transform: `scale(${(editData.coverImageZoom || 100) / 100})`,
                            transformOrigin: 'center center'
                          }}
                        />
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => setEditData({ ...editData, coverImage: '', coverImageZoom: 100 })}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditData({ ...editData, coverImageZoom: Math.max(50, (editData.coverImageZoom || 100) - 10) })}
                        disabled={(editData.coverImageZoom || 100) <= 50}
                      >
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                      <span className="text-sm font-medium text-gray-600 min-w-[50px] text-center">
                        {editData.coverImageZoom || 100}%
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditData({ ...editData, coverImageZoom: Math.min(200, (editData.coverImageZoom || 100) + 10) })}
                        disabled={(editData.coverImageZoom || 100) >= 200}
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded cursor-pointer hover:bg-gray-50">
                      <Image className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">Upload imagem</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                      />
                    </label>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowAIGenerator(!showAIGenerator)}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Gerar com IA
                    </Button>

                    {showAIGenerator && (
                      <div className="p-3 border rounded space-y-2">
                        <Input
                          placeholder="Descreva a imagem que deseja gerar..."
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && generateAIImage()}
                        />
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={generateAIImage}
                          disabled={generatingAI || !aiPrompt.trim()}
                        >
                          {generatingAI ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Gerando...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Gerar Imagem
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                
                {editData.attachments && editData.attachments.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Ou escolha um anexo como capa:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {editData.attachments
                        .filter(att => att.url && (att.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || att.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)))
                        .map(att => (
                          <button
                            key={att.id}
                            className={`relative aspect-square border-2 rounded overflow-hidden hover:border-blue-500 transition-colors ${
                              editData.coverImage === att.url ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
                            }`}
                            onClick={() => setEditData({ ...editData, coverImage: att.url })}
                          >
                            <img src={att.url} className="w-full h-full object-cover" alt={att.name} />
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Anexos:</label>
            <div className="flex gap-2">
              <label className="flex-1 flex items-center gap-2 p-3 border-2 border-dashed rounded cursor-pointer hover:bg-gray-50">
                <Paperclip className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Upload arquivo</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                />
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAIGenerator(!showAIGenerator)}
              >
                <Sparkles className="w-4 h-4" />
              </Button>
            </div>
            
            {showAIGenerator && (
              <div className="p-3 border rounded space-y-2">
                <Input
                  placeholder="Descreva a imagem para anexar..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && generateAIImage()}
                />
                <Button
                  size="sm"
                  className="w-full"
                  onClick={generateAIImage}
                  disabled={generatingAI || !aiPrompt.trim()}
                >
                  {generatingAI ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Gerar e Anexar
                    </>
                  )}
                </Button>
              </div>
            )}
            {editData.attachments && editData.attachments.length > 0 && (
              <div className="space-y-1">
                {editData.attachments.map(att => (
                  <div key={att.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate flex-1">
                      {att.name}
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeAttachment(att.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!editData.title}>
            {data?.id ? 'Salvar' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}