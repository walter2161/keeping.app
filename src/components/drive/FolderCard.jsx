import React from 'react';
import { Folder, MoreVertical, Trash2, Edit2, Copy, Download, Palette, Share2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export default function FolderCard({ folder, onClick, onDelete, onRename, onCopy, onExport, onColorChange, onShare, isOwner, provided, isDragging, onExternalDrop }) {
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
          onClick={handleCardClick}
          onContextMenu={handleContextMenu}
          onDragOver={handleExternalDragOver}
          onDragLeave={handleExternalDragLeave}
          onDrop={handleExternalDrop}
        >
      <div className={`p-2 rounded-lg bg-gray-100 group-hover:bg-blue-50 transition-colors ${folderColors[folder.color] || folderColors.default}`}>
        <Folder className="w-6 h-6" fill="currentColor" />
      </div>
      
      <span className="flex-1 font-medium text-gray-800 truncate text-sm">
        {folder.name}
      </span>

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
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare?.(folder); }}>
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCopy?.(folder); }}>
            <Copy className="w-4 h-4 mr-2" />
            Copiar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onExport?.(folder); }}>
            <Download className="w-4 h-4 mr-2" />
            Exportar (.zip)
          </DropdownMenuItem>
          {isOwner && (
            <DropdownMenuItem 
              className="text-red-600" 
              onClick={(e) => { e.stopPropagation(); onDelete?.(folder); }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <FolderColorPicker
        folder={folder}
        open={colorPickerOpen}
        onOpenChange={setColorPickerOpen}
        onColorSelect={onColorChange}
      />
      
      <div style={{ display: 'none' }}>{droppableProvided.placeholder}</div>
        </div>
      )}
    </Droppable>
  );
}