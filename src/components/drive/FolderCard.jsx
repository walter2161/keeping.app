import React from 'react';
import { Folder, MoreVertical, Trash2, Edit2, Download, Palette, Users, ArrowRight, Archive, Check } from 'lucide-react';
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
import { Droppable } from '@hello-pangea/dnd';
import FolderColorPicker from './FolderColorPicker';

const folderColors = {
  default: 'text-gray-500',
  blue: 'text-blue-500',
  green: 'text-green-500',
  orange: 'text-orange-500',
  purple: 'text-purple-500',
  red: 'text-red-500',
};

export default function FolderCard({ folder, onClick, onDelete, onRename, onExport, onCompress, onColorChange, onMove, isOwner, provided, isDragging, onExternalDrop, selectionMode = false, isSelected = false, onToggleSelection }) {
  const [colorPickerOpen, setColorPickerOpen] = React.useState(false);
  const [clickCount, setClickCount] = React.useState(0);
  const clickTimer = React.useRef(null);
  const [isDragOver, setIsDragOver] = React.useState(false);
  
  const handleCardClick = (e) => {
    if (e.defaultPrevented) return;
    
    setClickCount(prev => prev + 1);
    
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
    }
    
    clickTimer.current = setTimeout(() => {
      if (clickCount === 0) {
        // Double click
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

  const handleExternalDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleExternalDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleExternalDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (onExternalDrop) {
      onExternalDrop(e, folder.id);
    }
  };
  
  return (
    <Droppable droppableId={`folder-${folder.id}`} type="FILE">
      {(droppableProvided, droppableSnapshot) => (
        <TooltipProvider>
          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
        <div
          ref={(el) => {
            droppableProvided.innerRef(el);
            if (provided?.innerRef) provided.innerRef(el);
          }}
          {...provided?.draggableProps}
          {...provided?.dragHandleProps}
          {...droppableProvided.droppableProps}
          className={`group relative flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer ${
            isDragging ? 'opacity-50 shadow-2xl' : ''
          } ${droppableSnapshot.isDraggingOver || isDragOver ? 'bg-blue-100 border-blue-400 border-2' : ''}`}
          onClick={selectionMode ? onToggleSelection : handleCardClick}
          onContextMenu={handleContextMenu}
          onDragOver={handleExternalDragOver}
          onDragLeave={handleExternalDragLeave}
          onDrop={handleExternalDrop}
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
      <div className="relative">
        <div className={`p-2 rounded-lg bg-gray-100 group-hover:bg-blue-50 transition-colors ${folderColors[folder.color] || folderColors.default}`}>
          <Folder className="w-6 h-6" fill="currentColor" />
        </div>
        {isOwner && folder.shared_with && folder.shared_with.length > 0 && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white">
            <Users className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
      
      <span className="flex-1 font-medium text-gray-800 truncate text-sm">
        {folder.name}
      </span>

      {!selectionMode && (
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" data-dropdown-trigger>
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename?.(folder); }}>
            <Edit2 className="w-4 h-4 mr-2" />
            Renomear
          </DropdownMenuItem>
          {isOwner && (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setColorPickerOpen(true); }}>
              <Palette className="w-4 h-4 mr-2" />
              Mudar Cor
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onExport?.(folder); }}>
            <Download className="w-4 h-4 mr-2" />
            Exportar (.zip)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCompress?.(folder); }}>
            <Archive className="w-4 h-4 mr-2" />
            Compactar (.zip)
          </DropdownMenuItem>
          {isOwner && (
            <>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMove?.(folder); }}>
                <ArrowRight className="w-4 h-4 mr-2" />
                Mover
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600" 
                onClick={(e) => { e.stopPropagation(); onDelete?.(folder); }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      )}

      <FolderColorPicker
        folder={folder}
        open={colorPickerOpen}
        onOpenChange={setColorPickerOpen}
        onColorSelect={onColorChange}
      />
      
      <div style={{ display: 'none' }}>{droppableProvided.placeholder}</div>
        </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{folder.name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </Droppable>
  );
}