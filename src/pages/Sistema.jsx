import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Folder, File, FileText, FileSpreadsheet, Presentation, LayoutGrid, 
  GanttChart, Calendar, ArrowRight, Sparkles, Users, MessageCircle,
  Settings, Trash2, User, HardDrive, Image as ImageIcon, Video, Terminal, BookOpen,
  Menu, Search, Power, ChevronRight, Plus
} from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const fileTypeIcons = {
  docx: FileText,
  xlsx: FileSpreadsheet,
  pptx: Presentation,
  kbn: LayoutGrid,
  gnt: GanttChart,
  crn: Calendar,
  flux: ArrowRight,
  psd: Sparkles,
  img: ImageIcon,
  video: Video,
};

const defaultShortcuts = [
  { id: 'drive', name: 'Meu Drive', icon: 'HardDrive', link: 'Drive', color: 'bg-blue-500', x: 20, y: 20 },
  { id: 'trash', name: 'Lixeira', icon: 'Trash2', link: 'Trash', color: 'bg-red-500', x: 20, y: 140 },
];

export default function Sistema() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState([]);
  const [draggedIcon, setDraggedIcon] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [wallpaper, setWallpaper] = useState('https://images.unsplash.com/photo-1557683316-973673baf926?w=1920');
  const [createShortcutDialog, setCreateShortcutDialog] = useState(false);
  const [changeWallpaperDialog, setChangeWallpaperDialog] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [newWallpaperUrl, setNewWallpaperUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['folders'],
    queryFn: () => base44.entities.Folder.list(),
    enabled: !!user,
  });

  const { data: files = [] } = useQuery({
    queryKey: ['files'],
    queryFn: () => base44.entities.File.list(),
    enabled: !!user,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
    enabled: !!user,
  });

  // Load shortcuts and wallpaper from user settings
  useEffect(() => {
    if (user) {
      const savedShortcuts = user.desktop_shortcuts || defaultShortcuts;
      setShortcuts(savedShortcuts);
      setWallpaper(user.desktop_wallpaper || wallpaper);
    }
  }, [user]);

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  const saveShortcuts = (newShortcuts) => {
    setShortcuts(newShortcuts);
    updateUserMutation.mutate({ desktop_shortcuts: newShortcuts });
  };

  const saveWallpaper = (url) => {
    setWallpaper(url);
    updateUserMutation.mutate({ desktop_wallpaper: url });
  };

  const myFolders = folders.filter(f => f.owner === user?.email && !f.deleted);
  const myFiles = files.filter(f => f.owner === user?.email && !f.deleted);
  const myTeams = teams.filter(t => t.members?.includes(user?.email));

  const allApps = [
    { name: 'Drive', icon: HardDrive, link: 'Drive' },
    { name: 'Chat', icon: MessageCircle, link: 'Chat' },
    { name: 'Terminal', icon: Terminal, link: 'Terminal' },
    { name: 'Wiki', icon: BookOpen, link: 'Wiki' },
    { name: 'Lixeira', icon: Trash2, link: 'Trash' },
    { name: 'Perfil', icon: User, link: 'Profile' },
    { name: 'Assistente IA', icon: Settings, link: 'AssistantSettings' },
  ];

  const filteredFolders = myFolders.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFiles = myFiles.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredApps = allApps.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMouseDown = (e, shortcut) => {
    if (e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setDraggedIcon(shortcut);
  };

  const handleMouseMove = (e) => {
    if (!draggedIcon) return;
    
    const newShortcuts = shortcuts.map(s => {
      if (s.id === draggedIcon.id) {
        return {
          ...s,
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        };
      }
      return s;
    });
    setShortcuts(newShortcuts);
  };

  const handleMouseUp = () => {
    if (draggedIcon) {
      saveShortcuts(shortcuts);
      setDraggedIcon(null);
    }
  };

  const handleCreateShortcut = () => {
    if (selectedFolder) {
      const newShortcut = {
        id: `folder-${selectedFolder.id}`,
        name: selectedFolder.name,
        icon: 'Folder',
        link: `Drive?folder=${selectedFolder.id}`,
        color: 'bg-yellow-500',
        x: 20,
        y: shortcuts.length * 120 + 20,
        type: 'folder'
      };
      saveShortcuts([...shortcuts, newShortcut]);
      setCreateShortcutDialog(false);
      setSelectedFolder(null);
    } else if (selectedFile) {
      const newShortcut = {
        id: `file-${selectedFile.id}`,
        name: selectedFile.name,
        icon: fileTypeIcons[selectedFile.type]?.name || 'File',
        link: `FileViewer?id=${selectedFile.id}`,
        color: 'bg-green-500',
        x: 20,
        y: shortcuts.length * 120 + 20,
        type: 'file'
      };
      saveShortcuts([...shortcuts, newShortcut]);
      setCreateShortcutDialog(false);
      setSelectedFile(null);
    }
  };

  const handleChangeWallpaper = () => {
    if (newWallpaperUrl.trim()) {
      saveWallpaper(newWallpaperUrl.trim());
      setChangeWallpaperDialog(false);
      setNewWallpaperUrl('');
    }
  };

  const getIconComponent = (iconName) => {
    const icons = { HardDrive, Trash2, Folder, File, FileText, FileSpreadsheet, 
      Presentation, LayoutGrid, GanttChart, Calendar, ArrowRight, Sparkles, 
      ImageIcon, Video };
    return icons[iconName] || Folder;
  };

  return (
    <div 
      className="h-screen w-screen overflow-hidden fixed inset-0"
      style={{
        backgroundImage: `url(${wallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40" />

      {/* Desktop Icons */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="absolute inset-0 pb-16">
            {shortcuts.map((shortcut) => {
              const IconComponent = getIconComponent(shortcut.icon);
              return (
                <div
                  key={shortcut.id}
                  className="absolute cursor-move select-none"
                  style={{
                    left: `${shortcut.x}px`,
                    top: `${shortcut.y}px`,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, shortcut)}
                >
                  <Link
                    to={createPageUrl(shortcut.link)}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white/20 transition-all w-24"
                    draggable={false}
                  >
                    <div className={`${shortcut.color} p-3 rounded-xl shadow-lg`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-white text-xs font-medium text-center drop-shadow-lg line-clamp-2">
                      {shortcut.name}
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuItem onClick={() => setCreateShortcutDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Atalho
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setChangeWallpaperDialog(true)}>
            <ImageIcon className="w-4 h-4 mr-2" />
            Alterar Papel de Parede
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Taskbar */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 px-2 py-1.5">
          <div className="flex items-center justify-between">
            {/* Start Button */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setStartMenuOpen(!startMenuOpen)}
                className="h-10 w-10 hover:bg-blue-500/20"
              >
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69402d779871a62c237ae85d/4b6abf78c_logo-horizontal-onhub.png"
                  alt="onHub"
                  className="h-6 w-auto"
                />
              </Button>
            </div>

            {/* Clock & User */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-medium text-gray-900 dark:text-white leading-none">
                  {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">
                  {currentTime.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </p>
              </div>
              <Link to={createPageUrl('Profile')}>
                {user?.profile_picture ? (
                  <img 
                    src={user.profile_picture} 
                    alt="Perfil"
                    className="w-8 h-8 rounded-full border-2 border-blue-500 hover:border-blue-600 transition-colors"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold hover:scale-105 transition-transform">
                    {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Start Menu */}
      {startMenuOpen && (
        <div className="fixed bottom-16 left-2 z-50 w-[640px] h-[600px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Pesquisar aplicativos, pastas e arquivos..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* Applications */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Aplicativos
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {filteredApps.map((app) => (
                  <Link
                    key={app.name}
                    to={createPageUrl(app.link)}
                    onClick={() => setStartMenuOpen(false)}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl">
                      <app.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-900 dark:text-white text-center line-clamp-2">
                      {app.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Folders */}
            {filteredFolders.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  Pastas Recentes
                </h3>
                <div className="space-y-1">
                  {filteredFolders.slice(0, 5).map((folder) => (
                    <Link
                      key={folder.id}
                      to={createPageUrl(`Drive?folder=${folder.id}`)}
                      onClick={() => setStartMenuOpen(false)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Folder className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm text-gray-900 dark:text-white truncate flex-1">
                        {folder.name}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Files */}
            {filteredFiles.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  Arquivos Recentes
                </h3>
                <div className="space-y-1">
                  {filteredFiles.slice(0, 5).map((file) => {
                    const Icon = fileTypeIcons[file.type] || File;
                    return (
                      <Link
                        key={file.id}
                        to={createPageUrl(`FileViewer?id=${file.id}`)}
                        onClick={() => setStartMenuOpen(false)}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Icon className="w-5 h-5 text-blue-500" />
                        <span className="text-sm text-gray-900 dark:text-white truncate flex-1">
                          {file.name}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <Link
              to={createPageUrl('Profile')}
              onClick={() => setStartMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">{user?.full_name || 'Perfil'}</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => base44.auth.logout()}
              className="h-9 w-9"
              title="Sair"
            >
              <Power className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Shortcut Dialog */}
      <Dialog open={createShortcutDialog} onOpenChange={setCreateShortcutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Atalho na Área de Trabalho</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Selecione uma Pasta:</h4>
              <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2">
                {myFolders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => {
                      setSelectedFolder(folder);
                      setSelectedFile(null);
                    }}
                    className={`w-full flex items-center gap-2 p-2 rounded hover:bg-gray-100 ${
                      selectedFolder?.id === folder.id ? 'bg-blue-100' : ''
                    }`}
                  >
                    <Folder className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm truncate">{folder.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Ou selecione um Arquivo:</h4>
              <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2">
                {myFiles.slice(0, 20).map((file) => {
                  const Icon = fileTypeIcons[file.type] || File;
                  return (
                    <button
                      key={file.id}
                      onClick={() => {
                        setSelectedFile(file);
                        setSelectedFolder(null);
                      }}
                      className={`w-full flex items-center gap-2 p-2 rounded hover:bg-gray-100 ${
                        selectedFile?.id === file.id ? 'bg-blue-100' : ''
                      }`}
                    >
                      <Icon className="w-4 h-4 text-blue-500" />
                      <span className="text-sm truncate">{file.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <Button
              onClick={handleCreateShortcut}
              disabled={!selectedFolder && !selectedFile}
              className="w-full"
            >
              Criar Atalho
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Wallpaper Dialog */}
      <Dialog open={changeWallpaperDialog} onOpenChange={setChangeWallpaperDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Papel de Parede</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Cole a URL da imagem aqui..."
              value={newWallpaperUrl}
              onChange={(e) => setNewWallpaperUrl(e.target.value)}
            />
            <div className="grid grid-cols-3 gap-2">
              {[
                'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920',
                'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920',
                'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920',
                'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=1920',
                'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920',
                'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920',
              ].map((url, i) => (
                <button
                  key={i}
                  onClick={() => setNewWallpaperUrl(url)}
                  className={`aspect-video rounded-lg border-2 overflow-hidden ${
                    newWallpaperUrl === url ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <img src={url} alt={`Wallpaper ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <Button onClick={handleChangeWallpaper} className="w-full">
              Aplicar Papel de Parede
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}