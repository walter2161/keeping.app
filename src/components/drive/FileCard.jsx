import React from 'react';
import { 
  FileText, FileSpreadsheet, LayoutGrid, GanttChart, Calendar,
  MoreVertical, Trash2, Edit2, Download, Image, File, Video, Copy, ArrowRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const fileTypeConfig = {
  docx: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Documento' },
  xlsx: { icon: FileSpreadsheet, color: 'text-green-600', bg: 'bg-green-50', label: 'Planilha' },
  kbn: { icon: LayoutGrid, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Kanban' },
  gnt: { icon: GanttChart, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Gantt' },
  crn: { icon: Calendar, color: 'text-pink-600', bg: 'bg-pink-50', label: 'Cronograma' },
  flux: { icon: ArrowRight, color: 'text-teal-600', bg: 'bg-teal-50', label: 'FluxMap' },
  pdf: { icon: FileText, color: 'text-red-600', bg: 'bg-red-50', label: 'PDF' },
  img: { icon: Image, color: 'text-cyan-600', bg: 'bg-cyan-50', label: 'Imagem' },
  video: { icon: Video, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Vídeo' },
  other: { icon: File, color: 'text-gray-600', bg: 'bg-gray-50', label: 'Arquivo' },
};

export default function FileCard({ file, onClick, onDelete, onRename, onExport, onCopy, provided, isDragging }) {
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

  return (
    <div
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      className={`group relative flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer ${
        isDragging ? 'opacity-50 shadow-2xl' : ''
      }`}
      onClick={handleCardClick}
      onContextMenu={handleContextMenu}
    >
      <div className={`p-2 rounded-lg ${config.bg} ${config.color}`}>
        <Icon className="w-6 h-6" />
      </div>
      
      <div className="flex-1 min-w-0">
        <span className="font-medium text-gray-800 truncate text-sm block">
          {file.name}
        </span>
        <span className={`text-xs ${config.color} font-medium`}>
          {config.label}
        </span>
      </div>

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
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCopy?.(file); }}>
            <Copy className="w-4 h-4 mr-2" />
            Copiar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onExport?.(file); }}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-red-600" 
            onClick={(e) => { e.stopPropagation(); onDelete?.(file); }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}