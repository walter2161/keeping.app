import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  FolderPlus, FilePlus, Upload, Download, LayoutGrid, 
  GanttChart, Calendar, FileText, FileSpreadsheet, Search,
  List, Grid3x3, Copy,
  Bell, User, Settings, Trash2
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  onPaste
}) {
  return (
    <TooltipProvider>
      <div className="flex items-center justify-between gap-3 px-4 h-14 bg-white border-b sticky top-0 z-30">
        {/* Left Section */}
        <div className="flex items-center gap-3">
        <Link to={createPageUrl('Drive')} className="flex items-center gap-2 flex-shrink-0">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69402d779871a62c237ae85d/ae7dc63b6_logo-keepai-BABgUd28.png"
            alt="keeping"
            className="w-8 h-8 rounded-lg"
          />
          <div className="hidden md:block">
            <h1 className="font-bold text-gray-900 text-base leading-tight">keeping</h1>
          </div>
        </Link>

        <div className="h-6 w-px bg-gray-200 hidden sm:block" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              onClick={onNewFolder}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white hidden sm:flex"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Nova Pasta</p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" className="hidden sm:flex">
                  <FilePlus className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Novo Arquivo</p>
              </TooltipContent>
            </Tooltip>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => onNewFile?.('kbn')}>
              <LayoutGrid className="w-4 h-4 mr-2 text-purple-600" />
              Kanban
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNewFile?.('gnt')}>
              <GanttChart className="w-4 h-4 mr-2 text-orange-600" />
              Gantt
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNewFile?.('crn')}>
              <Calendar className="w-4 h-4 mr-2 text-pink-600" />
              Cronograma
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onNewFile?.('docx')}>
              <FileText className="w-4 h-4 mr-2 text-blue-600" />
              Documento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNewFile?.('xlsx')}>
              <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
              Planilha
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button size="sm" variant="outline" onClick={onUpload} className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300 hidden sm:flex">
          <Upload className="w-3.5 h-3.5 sm:mr-1.5" />
          <span className="hidden xl:inline">Upload</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="hidden md:flex">
              <Download className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={onImport}>
              <Download className="w-4 h-4 mr-2 rotate-180" />
              Importar JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportAll}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Tudo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {onPaste && (
          <Button size="sm" variant="outline" onClick={onPaste} className="hidden lg:flex">
            <Copy className="w-3.5 h-3.5" />
          </Button>
        )}

        <div className="flex items-center gap-0.5 border border-gray-300 rounded-md p-0.5">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            className="h-6 w-6"
            onClick={() => onViewModeChange?.('grid')}
          >
            <Grid3x3 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            className="h-6 w-6"
            onClick={() => onViewModeChange?.('list')}
          >
            <List className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-8 w-48 h-8 text-sm"
          />
        </div>

        <Link to={createPageUrl('Trash')}>
          <Button variant="ghost" size="icon" className="text-gray-500 h-8 w-8">
            <Trash2 className="w-4 h-4" />
          </Button>
        </Link>

        <Button variant="ghost" size="icon" className="text-gray-500 h-8 w-8">
          <Bell className="w-4 h-4" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  );
}