import React from 'react';
import { 
  Folder, FileText, FileSpreadsheet, LayoutGrid, GanttChart, Calendar,
  MoreVertical, Trash2, Edit2, Download, ChevronRight, Copy, Image, Video, Palette
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import FolderColorPicker from './FolderColorPicker';

const folderColors = {
  default: 'text-gray-500',
  blue: 'text-blue-500',
  green: 'text-green-500',
  orange: 'text-orange-500',
  purple: 'text-purple-500',
  red: 'text-red-500',
};

const fileTypeConfig = {
  docx: { icon: FileText, color: 'text-blue-600' },
  xlsx: { icon: FileSpreadsheet, color: 'text-green-600' },
  kbn: { icon: LayoutGrid, color: 'text-purple-600' },
  gnt: { icon: GanttChart, color: 'text-orange-600' },
  crn: { icon: Calendar, color: 'text-pink-600' },
  img: { icon: Image, color: 'text-cyan-600' },
  video: { icon: Video, color: 'text-purple-600' },
};

export default function ListView({ 
  folders, 
  files, 
  onFolderClick, 
  onFileClick,
  onFolderDelete,
  onFolderRename,
  onFolderCopy,
  onFolderExport,
  onFolderColorChange,
  onFileDelete,
  onFileRename,
  onFileExport,
  onFileCopy,
  level = 0,
  allFolders = [],
  allFiles = []
}) {
  const [colorPickerState, setColorPickerState] = React.useState({ open: false, folder: null });
  const [expandedFolders, setExpandedFolders] = React.useState({});

  const handleFileDelete = (file) => {
    if (typeof onFileDelete === 'function') {
      onFileDelete(file);
    }
  };

  const toggleFolder = (folderId, e) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const hasContent = (folderId) => {
    const hasSubFolders = allFolders.some(f => f.parent_id === folderId);
    const hasFiles = allFiles.some(f => f.folder_id === folderId);
    return hasSubFolders || hasFiles;
  };
  
  return (
    <>
      <FolderColorPicker
        folder={colorPickerState.folder}
        open={colorPickerState.open}
        onOpenChange={(open) => setColorPickerState({ open, folder: open ? colorPickerState.folder : null })}
        onColorSelect={onFolderColorChange}
      />
      
    
    <div className="bg-white rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase tracking-wide">
        <div className="col-span-5">Nome</div>
        <div className="col-span-2">Tipo</div>
        <div className="col-span-2">Modificado</div>
        <div className="col-span-2">Criado por</div>
        <div className="col-span-1"></div>
      </div>

      {/* Folders */}
      {folders.map((folder) => {
        const folderHasContent = hasContent(folder.id);
        const isExpanded = expandedFolders[folder.id];
        const childFolders = allFolders.filter(f => f.parent_id === folder.id);
        const childFiles = allFiles.filter(f => f.folder_id === folder.id);
        
        return (
          <React.Fragment key={folder.id}>
            <div
              className="grid grid-cols-12 gap-4 px-4 py-3 border-b hover:bg-gray-50 cursor-pointer group items-center"
              onClick={() => onFolderClick(folder.id)}
              style={{ paddingLeft: `${level * 24 + 16}px` }}
            >
              <div className="col-span-5 flex items-center gap-2 min-w-0">
                {folderHasContent ? (
                  <ChevronRight 
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    onClick={(e) => toggleFolder(folder.id, e)}
                  />
                ) : (
                  <div className="w-4 h-4 flex-shrink-0" />
                )}
                <Folder className={`w-5 h-5 ${folderColors[folder.color] || folderColors.default} flex-shrink-0`} fill="currentColor" />
                <span className="font-medium text-gray-800 truncate">{folder.name}</span>
              </div>
          <div className="col-span-2 text-sm text-gray-500">Pasta</div>
          <div className="col-span-2 text-sm text-gray-500">
            {format(new Date(folder.updated_date), "dd/MM/yyyy", { locale: ptBR })}
          </div>
          <div className="col-span-2 text-sm text-gray-500 truncate">{folder.created_by}</div>
          <div className="col-span-1 flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onFolderRename?.(folder); }}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Renomear
                </DropdownMenuItem>
                {onFolderColorChange && (
                  <DropdownMenuItem onClick={(e) => { 
                    e.stopPropagation(); 
                    setColorPickerState({ open: true, folder });
                  }}>
                    <Palette className="w-4 h-4 mr-2" />
                    Mudar Cor
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onFolderCopy?.(folder); }}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onFolderExport?.(folder); }}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar (.zip)
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); onFolderDelete?.(folder); }}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {isExpanded && folderHasContent && (
          <ListView
            folders={childFolders}
            files={childFiles}
            onFolderClick={onFolderClick}
            onFileClick={onFileClick}
            onFolderDelete={onFolderDelete}
            onFolderRename={onFolderRename}
            onFolderCopy={onFolderCopy}
            onFolderExport={onFolderExport}
            onFolderColorChange={onFolderColorChange}
            onFileDelete={onFileDelete}
            onFileRename={onFileRename}
            onFileExport={onFileExport}
            onFileCopy={onFileCopy}
            level={level + 1}
            allFolders={allFolders}
            allFiles={allFiles}
          />
        )}
      </React.Fragment>
      );
      })}

      {/* Files */}
      {files.map((file) => {
        const config = fileTypeConfig[file.type] || fileTypeConfig.docx;
        const Icon = config.icon;
        
        return (
          <div
            key={file.id}
            className="grid grid-cols-12 gap-4 px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer group items-center"
            onClick={() => onFileClick(file)}
            style={{ paddingLeft: `${level * 24 + 16}px` }}
          >
            <div className="col-span-5 flex items-center gap-2 min-w-0">
              <Icon className={`w-5 h-5 flex-shrink-0 ${config.color}`} />
              <span className="text-gray-800 truncate">{file.name}</span>
            </div>
            <div className="col-span-2 text-sm text-gray-500 capitalize">{file.type}</div>
            <div className="col-span-2 text-sm text-gray-500">
              {format(new Date(file.updated_date), "dd/MM/yyyy", { locale: ptBR })}
            </div>
            <div className="col-span-2 text-sm text-gray-500 truncate">{file.created_by}</div>
            <div className="col-span-1 flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onFileRename?.(file); }}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Renomear
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onFileCopy?.(file); }}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onFileExport?.(file); }}>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); handleFileDelete(file); }}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}

      {folders.length === 0 && files.length === 0 && (
        <div className="px-4 py-12 text-center text-gray-400">
          Nenhum item encontrado
        </div>
      )}
    </div>
    </>
  );
}