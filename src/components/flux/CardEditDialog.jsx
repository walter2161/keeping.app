import React, { useState, useEffect } from 'react';
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
  Paperclip,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Loader2,
  Download
} from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { useQuery } from '@tanstack/react-query';
import { Link as LinkIcon } from 'lucide-react';
import { createPageUrl } from '@/utils';

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
        coverImageZoom: data.coverImageZoom || 100,
        attachments: data.attachments || [],
      });
      setIsEditingDescription(false);
    }
  }, [open, data]);
  
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showInternalFiles, setShowInternalFiles] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allFolders = [] } = useQuery({
    queryKey: ['all-folders'],
    queryFn: () => base44.entities.Folder.list(),
  });

  const { data: allFiles = [] } = useQuery({
    queryKey: ['all-files'],
    queryFn: () => base44.entities.File.list(),
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
  });

  const myTeams = teams.filter(t => t.members?.includes(user?.email));
  const accessibleFolders = allFolders.filter(f => 
    !f.deleted && (!f.team_id || myTeams.some(t => t.id === f.team_id))
  );
  const accessibleFiles = allFiles.filter(f => 
    !f.deleted && (!f.team_id || myTeams.some(t => t.id === f.team_id))
  );

  const currentFolders = accessibleFolders.filter(f => f.parent_id === currentFolderId);
  const currentFiles = accessibleFiles.filter(f => f.folder_id === currentFolderId);

  const getCurrentFolderPath = () => {
    if (!currentFolderId) return [];
    const path = [];
    let folderId = currentFolderId;
    while (folderId) {
      const folder = accessibleFolders.find(f => f.id === folderId);
      if (folder) {
        path.unshift(folder);
        folderId = folder.parent_id;
      } else {
        break;
      }
    }
    return path;
  };

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

  const removeAttachment = (attachmentId) => {
    const updatedAttachments = editData.attachments.filter(a => a.id !== attachmentId);
    setEditData({ ...editData, attachments: updatedAttachments });
  };

  const addInternalFileLink = (file) => {
    const newAttachment = {
      id: Date.now().toString(),
      name: file.name,
      url: `/file/${file.id}`,
      isInternal: true,
      fileId: file.id
    };
    setEditData({ 
      ...editData, 
      attachments: [...(editData.attachments || []), newAttachment]
    });
    setShowInternalFiles(false);
  };

  const handleSave = () => {
    onSave(editData);
    onOpenChange(false);
  };

  const handleAttachmentClick = (att) => {
    if (att.isInternal) {
      // Navegar para FileViewer com o fileId correto
      window.location.href = createPageUrl(`FileViewer?id=${att.fileId}`);
    } else if (att.url?.match(/\.(jpg|jpeg|png|gif|webp|mp4|webm|mov)$/i)) {
      // Abrir popup de mídia
      const event = new CustomEvent('openMediaPopup', { 
        detail: { 
          url: att.url, 
          type: att.url.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image' 
        }
      });
      window.dispatchEvent(event);
    } else {
      // Outros arquivos - abrir em nova aba
      window.open(att.url, '_blank');
    }
  };

  // Listener para o evento de abrir mídia popup
  useEffect(() => {
    const handleOpenMediaPopup = (e) => {
      const { url, type } = e.detail;
      // Trigger o popup nativo do FileViewer se existir
      const event = new CustomEvent('openMedia', {
        detail: { url, type: type === 'video' ? 'video' : 'img' }
      });
      window.dispatchEvent(event);
    };

    window.addEventListener('openMediaPopup', handleOpenMediaPopup);
    return () => window.removeEventListener('openMediaPopup', handleOpenMediaPopup);
  }, []);

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
                    <div className="space-y-2">
                      <div className="relative overflow-hidden rounded bg-gray-100" style={{ height: '300px' }}>
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
                              transform: `scale(${editData.coverImageZoom / 100})`,
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
                          onClick={() => setEditData({ ...editData, coverImageZoom: Math.max(50, editData.coverImageZoom - 10) })}
                          disabled={editData.coverImageZoom <= 50}
                        >
                          <ZoomOut className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-medium text-gray-600 min-w-[50px] text-center">
                          {editData.coverImageZoom}%
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditData({ ...editData, coverImageZoom: Math.min(200, editData.coverImageZoom + 10) })}
                          disabled={editData.coverImageZoom >= 200}
                        >
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded cursor-pointer hover:bg-gray-50">
                        <ImageIcon className="w-5 h-5 text-gray-400" />
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
                  <span className="text-sm text-gray-600">Upload</span>
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
                  onClick={() => setShowInternalFiles(!showInternalFiles)}
                >
                  <LinkIcon className="w-4 h-4" />
                </Button>
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
              
              {showInternalFiles && (
                <div className="border rounded p-3 max-h-80 overflow-y-auto space-y-2">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                    {currentFolderId && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const currentFolder = accessibleFolders.find(f => f.id === currentFolderId);
                          setCurrentFolderId(currentFolder?.parent_id || null);
                        }}
                      >
                        ← Voltar
                      </Button>
                    )}
                    <div className="flex items-center gap-1 text-xs text-gray-500 flex-1">
                      <button onClick={() => setCurrentFolderId(null)} className="hover:text-gray-700">
                        Drive
                      </button>
                      {getCurrentFolderPath().map(folder => (
                        <React.Fragment key={folder.id}>
                          <span>/</span>
                          <button 
                            onClick={() => setCurrentFolderId(folder.id)}
                            className="hover:text-gray-700 truncate max-w-[100px]"
                          >
                            {folder.name}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {currentFolders.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400 mb-1">Pastas:</p>
                      {currentFolders.map(folder => (
                        <button
                          key={folder.id}
                          className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded text-left text-sm"
                          onClick={() => setCurrentFolderId(folder.id)}
                        >
                          <span className="text-lg">📁</span>
                          <span className="truncate flex-1">{folder.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {currentFiles.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400 mb-1">Arquivos:</p>
                      {currentFiles.map(file => (
                        <button
                          key={file.id}
                          className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded text-left text-sm"
                          onClick={() => addInternalFileLink(file)}
                        >
                          <span className="text-lg">{file.type === 'kbn' ? '📋' : file.type === 'gnt' ? '📊' : file.type === 'docx' ? '📄' : file.type === 'xlsx' ? '📈' : file.type === 'pptx' ? '📽️' : file.type === 'flux' ? '🌊' : '📎'}</span>
                          <span className="truncate flex-1">{file.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {currentFolders.length === 0 && currentFiles.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Pasta vazia</p>
                  )}
                </div>
              )}
              
              {editData.attachments && editData.attachments.length > 0 && (
                <div className="space-y-1">
                  {editData.attachments.map(att => (
                    <div key={att.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                      <button
                        onClick={() => handleAttachmentClick(att)}
                        className="text-blue-600 hover:underline truncate flex-1 text-left flex items-center gap-1"
                      >
                        {att.isInternal && <LinkIcon className="w-3 h-3" />}
                        {att.name}
                      </button>
                      <div className="flex gap-1">
                        {!att.isInternal && (
                          <a
                            href={att.url}
                            download={att.name}
                            target="_blank"
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </a>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeAttachment(att.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
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