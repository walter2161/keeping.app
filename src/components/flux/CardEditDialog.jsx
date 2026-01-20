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
import { 
  Calendar as CalendarIcon, 
  Plus, 
  X, 
  Check,
  Upload,
  Image as ImageIcon,
  Paperclip
} from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';

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
    attachments: [],
  });
  
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  
  // Update editData when dialog opens with new data
  React.useEffect(() => {
    if (open && data) {
      setEditData({
        title: data.title || '',
        description: data.description || '',
        priority: data.priority || 'medium',
        coverType: data.coverType || 'none',
        coverColor: data.coverColor || coverColors[0],
        coverImage: data.coverImage || '',
        attachments: data.attachments || [],
      });
      setIsEditingDescription(false);
    }
  }, [open, data]);
  
  const [uploadingFile, setUploadingFile] = useState(false);

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

  const handleSave = () => {
    onSave(editData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Card</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Lado esquerdo: Configurações */}
          <div className="space-y-4">
            <Input
              placeholder="Título"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
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
                    <div className="relative">
                      <img src={editData.coverImage} className="w-full aspect-square object-cover rounded" />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => setEditData({ ...editData, coverImage: '' })}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded cursor-pointer hover:bg-gray-50">
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">Clique para adicionar imagem</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                      />
                    </label>
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
              <label className="flex items-center gap-2 p-3 border-2 border-dashed rounded cursor-pointer hover:bg-gray-50">
                <Paperclip className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Adicionar arquivo</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                />
              </label>
              {editData.attachments && editData.attachments.length > 0 && (
                <div className="space-y-1">
                  {editData.attachments.map(att => (
                    <div key={att.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                      <a href={att.url} target="_blank" className="text-blue-600 hover:underline truncate flex-1">
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

          {/* Lado direito: Descrição com Toggle Preview/Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Descrição (suporta Markdown)</label>
              {!isEditingDescription ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingDescription(true)}
                >
                  Editar Descrição
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setIsEditingDescription(false)}
                >
                  Salvar Edição
                </Button>
              )}
            </div>
            
            <div 
              className="w-full aspect-square border-2 border-gray-200 rounded-lg overflow-auto bg-white"
              style={{ maxHeight: '500px' }}
            >
              {isEditingDescription ? (
                <Textarea
                  placeholder="**Negrito** _Itálico_ `Código`&#10;- Item lista&#10;1. Item numerado"
                  value={editData.description || ''}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="w-full h-full resize-none border-0 focus-visible:ring-0 font-mono text-sm"
                  style={{ minHeight: '500px' }}
                />
              ) : (
                <div className="p-4">
                  {editData.description ? (
                    <div className="markdown-preview">
                      <style>{`
                        .markdown-preview h1 {
                          font-size: 1.5rem;
                          font-weight: 700;
                          margin-top: 1.5rem;
                          margin-bottom: 0.75rem;
                          color: #1e293b;
                        }
                        .markdown-preview h2 {
                          font-size: 1.25rem;
                          font-weight: 600;
                          margin-top: 1.25rem;
                          margin-bottom: 0.5rem;
                          color: #334155;
                        }
                        .markdown-preview h3 {
                          font-size: 1.1rem;
                          font-weight: 600;
                          margin-top: 1rem;
                          margin-bottom: 0.5rem;
                          color: #475569;
                        }
                        .markdown-preview p {
                          margin-bottom: 0.75rem;
                          line-height: 1.6;
                          color: #475569;
                        }
                        .markdown-preview ul, .markdown-preview ol {
                          margin-left: 1.5rem;
                          margin-bottom: 0.75rem;
                        }
                        .markdown-preview li {
                          margin-bottom: 0.25rem;
                          line-height: 1.5;
                        }
                        .markdown-preview strong {
                          font-weight: 700;
                          color: #1e293b;
                        }
                        .markdown-preview em {
                          font-style: italic;
                        }
                        .markdown-preview code {
                          background: #f1f5f9;
                          padding: 0.125rem 0.375rem;
                          border-radius: 0.25rem;
                          font-family: monospace;
                          font-size: 0.875rem;
                          color: #dc2626;
                        }
                        .markdown-preview pre {
                          background: #f1f5f9;
                          padding: 0.75rem;
                          border-radius: 0.5rem;
                          overflow-x: auto;
                          margin-bottom: 0.75rem;
                        }
                        .markdown-preview pre code {
                          background: transparent;
                          padding: 0;
                          color: #1e293b;
                        }
                        .markdown-preview blockquote {
                          border-left: 4px solid #e2e8f0;
                          padding-left: 1rem;
                          color: #64748b;
                          margin-bottom: 0.75rem;
                        }
                        .markdown-preview hr {
                          border: none;
                          border-top: 2px solid #e2e8f0;
                          margin: 1.5rem 0;
                        }
                      `}</style>
                      <ReactMarkdown>{editData.description}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">Clique em "Editar Descrição" para adicionar conteúdo...</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!editData.title}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}