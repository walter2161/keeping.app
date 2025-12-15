import React from 'react';
import { Folder, MoreVertical, Trash2, Edit2, Copy, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const folderColors = {
  default: 'text-gray-500',
  blue: 'text-blue-500',
  green: 'text-green-500',
  orange: 'text-orange-500',
  purple: 'text-purple-500',
  red: 'text-red-500',
};

export default function FolderCard({ folder, onClick, onDelete, onRename, onCopy, onExport }) {
  return (
    <div
      className="group relative flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className={`p-2 rounded-lg bg-gray-100 group-hover:bg-blue-50 transition-colors ${folderColors[folder.color] || folderColors.default}`}>
        <Folder className="w-6 h-6" fill="currentColor" />
      </div>
      
      <span className="flex-1 font-medium text-gray-800 truncate text-sm">
        {folder.name}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename?.(folder); }}>
            <Edit2 className="w-4 h-4 mr-2" />
            Renomear
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCopy?.(folder); }}>
            <Copy className="w-4 h-4 mr-2" />
            Copiar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onExport?.(folder); }}>
            <Download className="w-4 h-4 mr-2" />
            Exportar (.zip)
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-red-600" 
            onClick={(e) => { e.stopPropagation(); onDelete?.(folder); }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}