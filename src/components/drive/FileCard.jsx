import React from 'react';
import { 
  FileText, FileSpreadsheet, LayoutGrid, GanttChart, Calendar,
  MoreVertical, Trash2, Edit2, Download, Image, File, Video, ArrowRight, Users, Presentation, Archive, Sparkles, Check, Link
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

// Helper to resolve local:// URLs to data URLs
const resolveFileUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('local://')) {
    const key = url.replace('local://', '');
    return localStorage.getItem(key) || null;
  }
  return url;
};

const fileTypeConfig = {
  docx: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Documento' },
  xlsx: { icon: FileSpreadsheet, color: 'text-green-600', bg: 'bg-green-50', label: 'Planilha' },
  pptx: { icon: Presentation, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Apresentação' },
  kbn: { icon: LayoutGrid, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Kanban' },
  gnt: { icon: GanttChart, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Gantt' },
  crn: { icon: Calendar, color: 'text-pink-600', bg: 'bg-pink-50', label: 'Cronograma' },
  flux: { icon: ArrowRight, color: 'text-teal-600', bg: 'bg-teal-50', label: 'FluxMap' },
  psd: { icon: Sparkles, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'PhotoSmart' },
  pdf: { icon: FileText, color: 'text-red-600', bg: 'bg-red-50', label: 'PDF' },
  img: { icon: Image, color: 'text-cyan-600', bg: 'bg-cyan-50', label: 'Imagem' },
  video: { icon: Video, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Vídeo' },
  other: { icon: File, color: 'text-gray-600', bg: 'bg-gray-50', label: 'Arquivo' },
};

export default function FileCard({ file, onClick, onDelete, onRename, onExport, onMove, onExtract, onCreateShortcut, isOwner, provided, isDragging, selectionMode = false, isSelected = false, onToggleSelection }) {
  const config = fileTypeConfig[file.type] || fileTypeConfig.other;
  const Icon = config.icon;
  const [clickCount, setClickCount] = React.useState(0);
  const clickTimer = React.useRef(null);
  
  const handleCardClick = (e) => {
    if (e.defaultPrevented) return;
    
    setClickCount(prev => prev + 1);
    
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
    }
    
    clickTimer.current = setTimeout(() => {
      if (clickCount === 0) {
        onClick();
      }
      setClickCount(0);
    }, 250);
  };
  
  const handleContextMenu = (e) => {
    e.preventDefault();
    const button = e.currentTarget.querySelector('button[data-dropdown-trigger]');
    if (button) {
      button.click();
    }
  };

  const renderThumbnail = () => {
    const thumbnailContent = () => {
      const resolvedUrl = resolveFileUrl(file.file_url);
      
      if (file.type === 'img' && resolvedUrl) {
        return (
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <img 
              src={resolvedUrl} 
              alt={file.name}
              className="w-full h-full object-cover"
            />
          </div>
        );
      }
      
      if (file.type === 'video' && resolvedUrl) {
        return (
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
            <video 
              src={resolvedUrl}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Video className="w-6 h-6 text-white" />
            </div>
          </div>
        );
      }
      
      if (file.type === 'pdf' && resolvedUrl) {
        return (
          <div className="w-16 h-16 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
            <FileText className="w-8 h-8 text-red-600" />
          </div>
        );
      }
      
      return (
        <div className={`p-2 rounded-lg ${config.bg} ${config.color}`}>
          <Icon className="w-6 h-6" />
        </div>
      );
    };

    return (
      <div className="relative">
        {thumbnailContent()}
        {isOwner && file.shared_with && file.shared_with.length > 0 && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white">
            <Users className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={500}>
        <TooltipTrigger asChild>
          <div
            ref={provided?.innerRef}
            {...provided?.draggableProps}
            {...provided?.dragHandleProps}
            className={`group relative flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer ${
              isDragging ? 'opacity-50 shadow-2xl' : ''
            }`}
            onClick={selectionMode ? onToggleSelection : handleCardClick}
            onContextMenu={handleContextMenu}
            title=""
          >
            {selectionMode && (
              <div 
                className={`absolute top-2 left-2 w-6 h-6 rounded border-2 flex items-center justify-center z-10 ${
                  isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
                }`}
              >
                {isSelected && <Check className="w-4 h-4 text-white" />}
              </div>
            )}
            {renderThumbnail()}
            
            <div className="flex-1 min-w-0">
              <span className="font-medium text-gray-800 truncate text-sm block">
                {file.name}
              </span>
              <span className={`text-xs ${config.color} font-medium`}>
                {config.label}
              </span>
            </div>

      {!selectionMode && (
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" data-dropdown-trigger>
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename?.(file); }}>
            <Edit2 className="w-4 h-4 mr-2" />
            Renomear
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onExport?.(file); }}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </DropdownMenuItem>
          {file.name.toLowerCase().endsWith('.zip') && file.file_url && (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onExtract?.(file); }}>
              <Archive className="w-4 h-4 mr-2" />
              Descompactar Aqui
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCreateShortcut?.(file); }}>
            <Link className="w-4 h-4 mr-2" />
            Criar Atalho
          </DropdownMenuItem>
          {isOwner && (
            <>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMove?.(file); }}>
                <ArrowRight className="w-4 h-4 mr-2" />
                Mover
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600" 
                onClick={(e) => { e.stopPropagation(); onDelete?.(file); }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{file.name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
