import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
        ArrowLeft, Save, Download, FileText, FileSpreadsheet,
        LayoutGrid, GanttChart as GanttChartIcon, Calendar, Loader2, Check, 
        Image as ImageIcon, Video, ArrowRight, Upload, Presentation
      } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

import KanbanBoard from '../components/kanban/KanbanBoard';
import GanttChartComponent from '../components/gantt/GanttChart';
import CronogramaBoard from '../components/cronograma/CronogramaBoard';
import FluxMap from '../components/flux/FluxMap';
import DocxEditor from '../components/editors/DocxEditor';
import XlsxEditor from '../components/editors/XlsxEditor';
import PptxEditor from '../components/editors/PptxEditor';
import AIAssistant from '../components/ai/AIAssistant';

const fileTypeConfig = {
  docx: { icon: FileText, color: 'text-blue-600', label: 'Documento' },
  xlsx: { icon: FileSpreadsheet, color: 'text-green-600', label: 'Planilha' },
  pptx: { icon: Presentation, color: 'text-amber-600', label: 'Apresentação' },
  kbn: { icon: LayoutGrid, color: 'text-purple-600', label: 'Kanban' },
  gnt: { icon: GanttChartIcon, color: 'text-orange-600', label: 'Gantt' },
  crn: { icon: Calendar, color: 'text-pink-600', label: 'Cronograma' },
  flux: { icon: ArrowRight, color: 'text-teal-600', label: 'FluxMap' },
  img: { icon: ImageIcon, color: 'text-cyan-600', label: 'Imagem' },
  video: { icon: Video, color: 'text-purple-600', label: 'Vídeo' },
};

export default function FileViewer() {
  const urlParams = new URLSearchParams(window.location.search);
  const fileId = urlParams.get('id');
  
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localContent, setLocalContent] = useState(null);
  const [fileName, setFileName] = useState('');
  const [mediaPopup, setMediaPopup] = useState({ open: false, url: '', type: '' });
  const pptxEditorRef = useRef(null);
  
  const queryClient = useQueryClient();

  const { data: file, isLoading, error } = useQuery({
    queryKey: ['file', fileId],
    queryFn: async () => {
      const files = await base44.entities.File.list();
      const file = files.find(f => f.id === fileId);
      console.log('Loaded file from DB:', file);
      console.log('Content length:', file?.content?.length || 0);
      return file;
    },
    enabled: !!fileId,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    staleTime: 0,
    cacheTime: 0,
  });

  useEffect(() => {
    if (file) {
      setFileName(file.name);
      setHasChanges(false);
      
      if (file.content) {
        if (file.type === 'docx' || file.type === 'xlsx') {
          setLocalContent(file.content);
        } else if (file.type === 'pptx') {
          try {
            const parsed = JSON.parse(file.content);
            setLocalContent(parsed);
          } catch (e) {
            setLocalContent({ slides: [{ title: '', content: '' }] });
          }
        } else {
          try {
            const parsed = JSON.parse(file.content);
            setLocalContent(parsed);
          } catch (e) {
            setLocalContent(file.content);
          }
        }
      } else {
        if (file.type === 'docx' || file.type === 'xlsx') {
          setLocalContent('');
        } else if (file.type === 'pptx') {
          setLocalContent({ slides: [{ title: '', content: '' }] });
        } else if (file.type === 'flux') {
          setLocalContent({ drawflow: { Home: { data: {} } } });
        } else {
          setLocalContent({});
        }
      }
    }
  }, [file]);

  const updateFileMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Updating file with data:', data);
      const result = await base44.entities.File.update(fileId, data);
      console.log('Update result:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('File saved successfully:', data);
      setHasChanges(false);
    },
  });

  const handleContentChange = (newContent) => {
    setLocalContent(newContent);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const contentToSave = (file.type === 'docx' || file.type === 'xlsx')
        ? (localContent || '')
        : (typeof localContent === 'object' && localContent !== null
          ? JSON.stringify(localContent) 
          : (localContent || ''));
      
      await updateFileMutation.mutateAsync({ 
        name: fileName,
        content: contentToSave 
      });
      
      queryClient.invalidateQueries({ queryKey: ['file', fileId] });
      alert('Arquivo salvo com sucesso!');
    } catch (error) {
      alert('Erro ao salvar o arquivo: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    // Para imagens, vídeos e PDFs, fazer download direto do arquivo original
    if ((file.type === 'img' || file.type === 'video' || file.type === 'pdf') && file.file_url) {
      const a = document.createElement('a');
      a.href = file.file_url;
      a.download = file.name;
      a.target = '_blank';
      a.click();
      return;
    }
    
    // Para docx, exportar como texto
    if (file.type === 'docx') {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = localContent || '';
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      
      const blob = new Blob([textContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    
    // Para xlsx, exportar como CSV
    if (file.type === 'xlsx') {
      const blob = new Blob([localContent || ''], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // Para pptx, chamar a função de exportar do editor
    if (file.type === 'pptx' && pptxEditorRef.current) {
      pptxEditorRef.current.exportPptx();
      return;
    }
    
    // Para outros tipos (kbn, gnt, crn, flux), exportar como JSON
    const exportData = {
      type: 'single_file',
      file: {
        name: file.name,
        type: file.type,
        content: file.content,
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e) => {
    const importFile = e.target.files[0];
    if (!importFile) return;

    const fileName = importFile.name.toLowerCase();

    // Para arquivos docx/txt
    if (file.type === 'docx' && (fileName.endsWith('.txt') || fileName.endsWith('.doc') || fileName.endsWith('.docx'))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLocalContent(event.target.result);
        setHasChanges(true);
      };
      reader.readAsText(importFile);
      e.target.value = '';
      return;
    }

    // Para arquivos xlsx/csv
    if (file.type === 'xlsx' && (fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls'))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLocalContent(event.target.result);
        setHasChanges(true);
      };
      reader.readAsText(importFile);
      e.target.value = '';
      return;
    }

    // Para arquivos pptx nativos usando IA do assistente
    if (file.type === 'pptx' && (fileName.endsWith('.pptx') || fileName.endsWith('.ppt'))) {
      const handlePptxImport = async () => {
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: importFile });
          
          const user = await base44.auth.me();
          
          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `Você é um especialista em extração de dados de apresentações PowerPoint. Extraia o conteúdo deste arquivo PPTX e retorne no formato JSON especificado. Para cada slide, extraia o texto e organize-o em elementos de texto/título com posições aproximadas.`,
            response_json_schema: {
              type: "object",
              properties: {
                slides: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      background: { type: "string", default: "#ffffff" },
                      elements: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            type: { type: "string" },
                            content: { type: "string" },
                            x: { type: "number", default: 100 },
                            y: { type: "number", default: 100 },
                            width: { type: "number", default: 400 },
                            height: { type: "number", default: 100 },
                            fontSize: { type: "number", default: 24 },
                            fontWeight: { type: "string", default: "normal" },
                            fontStyle: { type: "string", default: "normal" },
                            textDecoration: { type: "string", default: "none" },
                            color: { type: "string", default: "#000000" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            file_urls: [file_url]
          });
          
          if (result && result.slides) {
            setLocalContent(result);
            setHasChanges(true);
            alert('Arquivo importado com sucesso!');
          } else {
            alert('Não foi possível extrair dados do arquivo.');
          }
        } catch (error) {
          alert('Erro ao importar: ' + error.message);
        }
      };
      
      handlePptxImport();
      e.target.value = '';
      return;
    }

    // Para outros tipos (JSON)
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (importedData.type === 'single_file' && importedData.file) {
          if (importedData.file.type === file.type) {
            const content = importedData.file.content;
            try {
              setLocalContent(JSON.parse(content));
            } catch {
              setLocalContent(content);
            }
            setHasChanges(true);
          } else {
            alert('Tipo de arquivo incompatível!');
          }
        } else {
          alert('Formato de arquivo inválido!');
        }
      } catch (error) {
        alert('Erro ao ler o arquivo. Certifique-se de que é um JSON válido.');
      }
    };
    reader.readAsText(importFile);
    e.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">Arquivo não encontrado</p>
        <Link to={createPageUrl('Drive')}>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Drive
          </Button>
        </Link>
      </div>
    );
  }

  const config = fileTypeConfig[file.type] || fileTypeConfig.docx;
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
            <Link to={createPageUrl(`Drive${file.folder_id ? `?folder=${file.folder_id}` : ''}`)}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
          <div className={`p-2 rounded-lg bg-gray-100 ${config.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <Input
              value={fileName}
              onChange={(e) => {
                setFileName(e.target.value);
                setHasChanges(true);
              }}
              className="font-semibold text-gray-800 border-none bg-transparent p-0 h-auto text-lg focus-visible:ring-0"
            />
            <span className={`text-xs ${config.color} font-medium`}>
              {config.label}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-sm text-amber-600 font-medium mr-2">
              Alterações não salvas
            </span>
          )}
          <input
            type="file"
            accept={file.type === 'docx' ? '.txt,.doc,.docx' : file.type === 'xlsx' ? '.csv,.xlsx,.xls' : file.type === 'pptx' ? '.pptx,.ppt' : '.json'}
            onChange={handleImportFile}
            className="hidden"
            id="import-file"
          />
          <label htmlFor="import-file">
            <Button variant="outline" asChild>
              <span className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </span>
            </Button>
          </label>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : hasChanges ? (
              <Save className="w-4 h-4 mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            {saving ? 'Salvando...' : hasChanges ? 'Salvar' : 'Salvo'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {file.type === 'kbn' && localContent && (
          <KanbanBoard 
            data={localContent} 
            onChange={handleContentChange}
          />
        )}
        
        {file.type === 'gnt' && localContent && (
          <GanttChartComponent 
            data={localContent} 
            onChange={handleContentChange}
          />
        )}
        
        {file.type === 'crn' && localContent && (
          <CronogramaBoard 
            data={localContent} 
            onChange={handleContentChange}
          />
        )}
        
        {file.type === 'flux' && (
          <FluxMap 
            data={localContent} 
            onChange={handleContentChange}
            onImport={(importedData) => {
              setLocalContent(importedData);
              setHasChanges(true);
            }}
          />
        )}
        
        {file.type === 'docx' && (
          <div className="p-6 max-w-5xl mx-auto">
            <DocxEditor
              value={typeof localContent === 'string' ? localContent : ''}
              onChange={handleContentChange}
            />
          </div>
        )}

        {file.type === 'xlsx' && (
          <XlsxEditor
            value={localContent || ''}
            onChange={handleContentChange}
          />
        )}

        {file.type === 'pptx' && (
          <PptxEditor
            ref={pptxEditorRef}
            value={typeof localContent === 'object' ? JSON.stringify(localContent) : (localContent || '')}
            onChange={handleContentChange}
            fileName={fileName}
          />
        )}

        {file.type === 'img' && file.file_url && (
          <div className="p-6 flex items-center justify-center min-h-[500px]">
            <img
              src={file.file_url}
              alt={file.name}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-lg cursor-pointer"
              onClick={() => setMediaPopup({ open: true, url: file.file_url, type: 'img' })}
            />
          </div>
        )}

        {file.type === 'video' && file.file_url && (
          <div className="p-6 flex items-center justify-center min-h-[500px]">
            <video
              src={file.file_url}
              controls
              className="max-w-full max-h-[80vh] rounded-lg shadow-lg cursor-pointer"
              onClick={() => setMediaPopup({ open: true, url: file.file_url, type: 'video' })}
            >
              Seu navegador não suporta a reprodução de vídeos.
            </video>
          </div>
        )}
      </div>

      {/* Media Popup */}
      <Dialog open={mediaPopup.open} onOpenChange={(open) => setMediaPopup({ ...mediaPopup, open })}>
        <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0">
          <div className="w-full h-full flex items-center justify-center bg-black">
            {mediaPopup.type === 'img' && (
              <img src={mediaPopup.url} alt="Preview" className="max-w-full max-h-full object-contain" />
            )}
            {mediaPopup.type === 'video' && (
              <video src={mediaPopup.url} controls autoPlay className="max-w-full max-h-full">
                Seu navegador não suporta a reprodução de vídeos.
              </video>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Assistant with file context */}
      <AIAssistant 
        fileContext={localContent} 
        fileType={file.type}
        currentFolderId={file.folder_id}
        currentPage="FileViewer"
      />
    </div>
  );
}