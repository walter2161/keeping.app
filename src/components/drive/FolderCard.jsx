import React from 'react';
import { Folder, MoreVertical, Trash2, Edit2, Copy, Download, Palette } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const folderColors = {
  default: 'text-gray-500',
  blue: 'text-blue-500',
  green: 'text-green-500',
  orange: 'text-orange-500',
  purple: 'text-purple-500',
  red: 'text-red-500',
};

const colors = [
  { value: 'blue', label: 'Azul', class: 'bg-blue-500' },
  { value: 'green', label: 'Verde', class: 'bg-green-500' },
  { value: 'orange', label: 'Laranja', class: 'bg-orange-500' },
  { value: 'purple', label: 'Roxo', class: 'bg-purple-500' },
  { value: 'red', label: 'Vermelho', class: 'bg-red-500' },
  { value: 'default', label: 'Cinza', class: 'bg-gray-500' },
];

export default function FolderCard({ folder, onClick, onDelete, onRename, onCopy, onExport, onColorChange }) {
  const [colorPickerOpen, setColorPickerOpen] = React.useState(false);
  
  const handleCardClick = (e) => {
    // Only open folder if not clicking on dropdown or dialog
    if (!e.defaultPrevented) {
      onClick();
    }
  };
  
  return (
    <div
      className="group relative flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={handleCardClick}
    >
      <div className={`p-2 rounded-lg bg-gray-100 group-hover:bg-blue-50 transition-colors ${folderColors[folder.color] || folderColors.default}`}>
        <Folder className="w-6 h-6" fill="currentColor" />
      </div>
      
      <span className="flex-1 font-medium text-gray-800 truncate text-sm">
        {folder.name}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename?.(folder); }}>
            <Edit2 className="w-4 h-4 mr-2" />
            Renomear
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setColorPickerOpen(true); }}>
            <Palette className="w-4 h-4 mr-2" />
            Mudar Cor
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

      <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
        <PopoverTrigger asChild>
          <div style={{ display: 'none' }} />
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-3" 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium mb-1">Escolha a cor</p>
            <div className="flex gap-2">
              {colors.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onColorChange?.(folder, c.value);
                    setColorPickerOpen(false);
                  }}
                  className={`w-8 h-8 rounded-full ${c.class} ${
                    folder.color === c.value ? 'ring-2 ring-offset-2 ring-blue-600' : ''
                  } hover:scale-110 transition-transform`}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}