import React, { useState, useEffect, useRef } from 'react';
import { onhub } from '@/api/onhubClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Save, Loader2, Check, FileText, FileSpreadsheet, Presentation,
  ZoomIn, ZoomOut, FileType, FileImage, Printer
} from 'lucide-react';

import DocxEditor from '../components/editors/DocxEditor';
import XlsxEditor from '../components/editors/XlsxEditor';
import PptxEditor from '../components/editors/PptxEditor';

export default function FluxEditor() {
  const urlParams = new URLSearchParams(window.location.search);
  const nodeId = urlParams.get('nodeId');
  const editorType = urlParams.get('type'); // 'docx', 'xlsx', 'pptx'
  const fluxFileId = urlParams.get('fluxFileId');
  
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localContent, setLocalContent] = useState('');
  const [nodeTitle, setNodeTitle] = useState('');
  const [nodeData, setNodeData] = useState(null);
  const [fluxData, setFluxData] = useState(null);
  
  const docxEditorRef = useRef(null);
  const xlsxEditorRef = useRef(null);
  const pptxEditorRef = useRef(null);
  const [docOrientation, setDocOrientation] = useState('portrait');
  const [docZoom, setDocZoom] = useState(100);
  
  const queryClient = useQueryClient();

  const { data: fluxFile, isLoading } = useQuery({
    queryKey: ['flux-file', fluxFileId],
    queryFn: async () => {
      const files = await onhub.entities.File.list();
      return files.find(f => f.id === fluxFileId);
    },
    enabled: !!fluxFileId,
  });

  useEffect(() => {
    if (fluxFile && fluxFile.content) {
      try {
        const parsed = JSON.parse(fluxFile.content);
        setFluxData(parsed);
        
        // Encontrar o node específico
        const node = parsed?.drawflow?.Home?.data?.[nodeId];
        if (node) {
          setNodeData(node.data);
          setNodeTitle(node.data.title || '');
          
          if (editorType === 'presentation' && node.data.content) {
            try {
              const contentParsed = JSON.parse(node.data.content);
              setLocalContent(contentParsed);
            } catch {
              setLocalContent({ slides: [{ background: '#ffffff', elements: [] }] });
            }
          } else {
            setLocalContent(node.data.content || '');
          }
        }
      } catch (e) {
        console.error('Erro ao carregar FluxMap:', e);
      }
    }
  }, [fluxFile, nodeId, editorType]);

  const handleContentChange = (newContent) => {
    setLocalContent(newContent);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Atualizar o node no FluxMap
      const updatedFluxData = { ...fluxData };
      if (updatedFluxData?.drawflow?.Home?.data?.[nodeId]) {
        updatedFluxData.drawflow.Home.data[nodeId].data = {
          ...updatedFluxData.drawflow.Home.data[nodeId].data,
          title: nodeTitle,
          content: editorType === 'presentation' ? JSON.stringify(localContent) : localContent
        };
      }
      
      // Salvar o FluxMap atualizado
      await onhub.entities.File.update(fluxFileId, {
        content: JSON.stringify(updatedFluxData)
      });
      
      await queryClient.invalidateQueries({ queryKey: ['flux-file', fluxFileId] });
      setHasChanges(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const iconMap = {
    docx: { Icon: FileText, color: 'text-blue-600', label: 'Documento' },
    xlsx: { Icon: FileSpreadsheet, color: 'text-green-600', label: 'Planilha' },
    pptx: { Icon: Presentation, color: 'text-amber-600', label: 'Apresentação' },
  };

  const config = iconMap[editorType] || iconMap.docx;
  const Icon = config.Icon;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl(`FileViewer?id=${fluxFileId}`)}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className={`p-2 rounded-lg bg-gray-100 ${config.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <Input
              value={nodeTitle}
              onChange={(e) => {
                setNodeTitle(e.target.value);
                setHasChanges(true);
              }}
              className="font-semibold text-gray-800 border-none bg-transparent p-0 h-auto text-lg focus-visible:ring-0"
              placeholder="Título"
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
          
          {editorType === 'docx' && (
            <>
              <Button
                size="icon"
                variant={docOrientation === 'portrait' ? 'default' : 'outline'}
                onClick={() => {
                  setDocOrientation('portrait');
                  docxEditorRef.current?.setOrientation('portrait');
                }}
                className="h-9 w-9"
                title="A4 Vertical"
              >
                <FileType className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant={docOrientation === 'landscape' ? 'default' : 'outline'}
                onClick={() => {
                  setDocOrientation('landscape');
                  docxEditorRef.current?.setOrientation('landscape');
                }}
                className="h-9 w-9"
                title="A4 Horizontal"
              >
                <FileImage className="w-4 h-4 rotate-90" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setDocZoom(Math.max(50, docZoom - 10))}
                disabled={docZoom <= 50}
                className="h-9 w-9"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-gray-600 min-w-[45px] text-center">
                {docZoom}%
              </span>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setDocZoom(Math.min(200, docZoom + 10))}
                disabled={docZoom >= 200}
                className="h-9 w-9"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </>
          )}
          
          <Button 
            size="icon" 
            variant="outline"
            onClick={() => {
              if (editorType === 'docx') docxEditorRef.current?.print();
              else if (editorType === 'xlsx') xlsxEditorRef.current?.print();
              else if (editorType === 'pptx') pptxEditorRef.current?.print();
            }}
            className="h-9 w-9"
          >
            <Printer className="w-4 h-4" />
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
        {editorType === 'docx' && (
          <div className="p-6 max-w-5xl mx-auto">
            <DocxEditor
              ref={docxEditorRef}
              value={typeof localContent === 'string' ? localContent : ''}
              onChange={handleContentChange}
              zoom={docZoom}
            />
          </div>
        )}

        {editorType === 'xlsx' && (
          <XlsxEditor
            ref={xlsxEditorRef}
            value={localContent || ''}
            onChange={handleContentChange}
          />
        )}

        {editorType === 'pptx' && (
          <PptxEditor
            ref={pptxEditorRef}
            value={typeof localContent === 'object' ? JSON.stringify(localContent) : (localContent || '')}
            onChange={handleContentChange}
            fileName={nodeTitle}
          />
        )}
      </div>
    </div>
  );
}
