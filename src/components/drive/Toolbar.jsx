import React, { useState } from 'react';
import { 
  FolderPlus, FilePlus, Upload, Download, LayoutGrid, 
  GanttChart, Calendar, FileText, FileSpreadsheet, Search,
  List, Grid3x3, PanelLeftClose, PanelLeft, Image, Video, Copy
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export default function Toolbar({ 
  onNewFolder, 
  onNewFile, 
  onUpload,
  onImport, 
  onExportAll,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sidebarOpen,
  onToggleSidebar,
  onPaste
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white border-b">
      <Button 
        variant="outline"
        size="icon"
        onClick={onToggleSidebar}
        className="border-gray-300"
      >
        {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
      </Button>

      <div className="h-8 w-px bg-gray-200" />

      <Button 
        onClick={onNewFolder}
        className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
      >
        <FolderPlus className="w-4 h-4 mr-2" />
        Nova Pasta
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="border-gray-300">
            <FilePlus className="w-4 h-4 mr-2" />
            Novo Arquivo
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Arquivos Especiais</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onNewFile?.('kbn')}>
            <LayoutGrid className="w-4 h-4 mr-2 text-purple-600" />
            Kanban (.kbn)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onNewFile?.('gnt')}>
            <GanttChart className="w-4 h-4 mr-2 text-orange-600" />
            Gantt (.gnt)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onNewFile?.('crn')}>
            <Calendar className="w-4 h-4 mr-2 text-pink-600" />
            Cronograma (.crn)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Arquivos Comuns</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onNewFile?.('docx')}>
            <FileText className="w-4 h-4 mr-2 text-blue-600" />
            Documento (.docx)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onNewFile?.('xlsx')}>
            <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
            Planilha (.xlsx)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" onClick={onUpload} className="border-gray-300 bg-green-50 hover:bg-green-100 text-green-700 border-green-300">
        <Upload className="w-4 h-4 mr-2" />
        Upload
      </Button>

      <Button variant="outline" onClick={onImport} className="border-gray-300">
        <Download className="w-4 h-4 mr-2 rotate-180" />
        Importar JSON
      </Button>

      <Button variant="outline" onClick={onExportAll} className="border-gray-300">
        <Download className="w-4 h-4 mr-2" />
        Exportar Tudo
      </Button>

      {onPaste && (
        <Button variant="outline" onClick={onPaste} className="border-gray-300">
          <Copy className="w-4 h-4 mr-2" />
          Colar
        </Button>
      )}

      <div className="h-8 w-px bg-gray-200" />

      <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'ghost'}
          size="icon"
          className="h-7 w-7"
          onClick={() => onViewModeChange?.('grid')}
        >
          <Grid3x3 className="w-4 h-4" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'ghost'}
          size="icon"
          className="h-7 w-7"
          onClick={() => onViewModeChange?.('list')}
        >
          <List className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1" />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar arquivos..."
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="pl-10 w-64 border-gray-300"
        />
      </div>
    </div>
  );
}