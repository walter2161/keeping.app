import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, Save, Download, FileText, FileSpreadsheet,
  LayoutGrid, GanttChart as GanttChartIcon, Calendar, Loader2, Check
} from 'lucide-react';

import KanbanBoard from '../components/kanban/KanbanBoard';
import GanttChartComponent from '../components/gantt/GanttChart';
import CronogramaBoard from '../components/cronograma/CronogramaBoard';

const fileTypeConfig = {
  docx: { icon: FileText, color: 'text-blue-600', label: 'Documento' },
  xlsx: { icon: FileSpreadsheet, color: 'text-green-600', label: 'Planilha' },
  kbn: { icon: LayoutGrid, color: 'text-purple-600', label: 'Kanban' },
  gnt: { icon: GanttChartIcon, color: 'text-orange-600', label: 'Gantt' },
  crn: { icon: Calendar, color: 'text-pink-600', label: 'Cronograma' },
};

export default function FileViewer() {
  const urlParams = new URLSearchParams(window.location.search);
  const fileId = urlParams.get('id');
  
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localContent, setLocalContent] = useState(null);
  const [fileName, setFileName] = useState('');
  
  const queryClient = useQueryClient();

  const { data: file, isLoading, error } = useQuery({
    queryKey: ['file', fileId],
    queryFn: async () => {
      const files = await base44.entities.File.filter({ id: fileId });
      return files[0];
    },
    enabled: !!fileId,
  });

  useEffect(() => {
    if (file) {
      setFileName(file.name);
      if (file.content) {
        try {
          setLocalContent(JSON.parse(file.content));
        } catch {
          setLocalContent(file.content);
        }
      } else {
        setLocalContent(file.type === 'docx' || file.type === 'xlsx' ? '' : {});
      }
    }
  }, [file]);

  const updateFileMutation = useMutation({
    mutationFn: (data) => base44.entities.File.update(fileId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file', fileId] });
      setHasChanges(false);
    },
  });

  const handleContentChange = (newContent) => {
    setLocalContent(newContent);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const contentToSave = typeof localContent === 'object' 
      ? JSON.stringify(localContent) 
      : localContent;
    
    await updateFileMutation.mutateAsync({ 
      name: fileName,
      content: contentToSave 
    });
    setSaving(false);
  };

  const handleExport = () => {
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
          <Link to={createPageUrl('Drive')}>
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
        
        {(file.type === 'docx' || file.type === 'xlsx') && (
          <div className="p-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <Textarea
                value={typeof localContent === 'string' ? localContent : ''}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder={file.type === 'docx' 
                  ? 'Escreva seu documento aqui...' 
                  : 'Cole dados da planilha aqui ou escreva em formato CSV...'
                }
                className="min-h-[500px] font-mono text-sm resize-none border-none focus-visible:ring-0"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}