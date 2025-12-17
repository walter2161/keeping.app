import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  FolderPlus, FilePlus, Upload, Download, LayoutGrid, 
  GanttChart, Calendar, FileText, FileSpreadsheet, Search,
  List, Grid3x3, Copy, ArrowRight,
  Bot, User, Settings, Trash2, PanelLeftOpen, BookOpen, Presentation, Users, RefreshCw
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
import NotificationBell from './NotificationBell';

export default function Toolbar({ 
  onNewFolder, 
  onNewFile,
  onNewTeam,
  onUpload,
  onImport, 
  onExportAll,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onPaste,
  sidebarOpen,
  onToggleSidebar,
  onRefresh
}) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between gap-3 px-4 h-14 bg-white border-b sticky top-0 z-30">
        {/* Left Section */}
        <div className="flex items-center gap-3">
        {!sidebarOpen && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onToggleSidebar}
                className="h-8 w-8 flex-shrink-0"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Mostrar Sidebar</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        <Link to={createPageUrl('Drive')} className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69402d779871a62c237ae85d/ae7dc63b6_logo-keepai-BABgUd28.png"
            alt="Keeping"
            className="w-8 h-8 rounded-lg"
          />
          <div className="hidden md:block">
            <h1 className="font-bold text-gray-900 text-base leading-tight">Keeping</h1>
          </div>
        </Link>

        <div className="h-6 w-px bg-gray-200 hidden sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white hidden sm:flex"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={onNewFolder}>
              <FolderPlus className="w-4 h-4 mr-2 text-gray-600" />
              Nova Pasta
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onNewTeam}>
              <Users className="w-4 h-4 mr-2 text-purple-600" />
              Nova Equipe
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="hidden sm:flex">
              <FilePlus className="w-3.5 h-3.5" />
            </Button>
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
            <DropdownMenuItem onClick={() => onNewFile?.('flux')}>
              <ArrowRight className="w-4 h-4 mr-2 text-teal-600" />
              FluxMap
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
            <DropdownMenuItem onClick={() => onNewFile?.('pptx')}>
              <Presentation className="w-4 h-4 mr-2 text-amber-600" />
              Apresentação
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

        <NotificationBell currentUserEmail={user?.email} />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gray-500 h-8 w-8" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Atualizar</p>
          </TooltipContent>
        </Tooltip>

        <Link to={createPageUrl('Trash')}>
          <Button variant="ghost" size="icon" className="text-gray-500 h-8 w-8">
            <Trash2 className="w-4 h-4" />
          </Button>
        </Link>

        <Link to={createPageUrl('AssistantSettings')}>
          <Button variant="ghost" size="icon" className="text-gray-500 h-8 w-8">
            <Bot className="w-4 h-4" />
          </Button>
        </Link>

        <Link to={createPageUrl('Wiki')}>
          <Button variant="ghost" size="icon" className="text-gray-500 h-8 w-8">
            <BookOpen className="w-4 h-4" />
          </Button>
        </Link>
        
        <Link to={createPageUrl('Profile')}>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 p-0">
            {user?.profile_picture ? (
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-blue-600">
                <img 
                  src={user.profile_picture} 
                  alt="Perfil"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </Button>
        </Link>
      </div>
      </div>
    </TooltipProvider>
  );
}