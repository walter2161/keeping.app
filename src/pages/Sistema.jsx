import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Folder, File, FileText, FileSpreadsheet, Presentation, LayoutGrid, 
  GanttChart, Calendar, ArrowRight, Sparkles, Users, MessageCircle,
  Settings, Trash2, User, HardDrive, Image, Video, Terminal, BookOpen
} from 'lucide-react';

const fileTypeIcons = {
  docx: FileText,
  xlsx: FileSpreadsheet,
  pptx: Presentation,
  kbn: LayoutGrid,
  gnt: GanttChart,
  crn: Calendar,
  flux: ArrowRight,
  psd: Sparkles,
  img: Image,
  video: Video,
};

export default function Sistema() {
  const [currentTime, setCurrentTime] = useState(new Date());

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

  const myFolders = folders.filter(f => f.owner === user?.email && !f.deleted);
  const myFiles = files.filter(f => f.owner === user?.email && !f.deleted);
  const myTeams = teams.filter(t => t.members?.includes(user?.email));

  const shortcuts = [
    { name: 'Drive', icon: HardDrive, link: 'Drive', color: 'bg-blue-500' },
    { name: 'Chat', icon: MessageCircle, link: 'Chat', color: 'bg-green-500' },
    { name: 'Equipes', icon: Users, link: 'Drive', color: 'bg-purple-500' },
    { name: 'Terminal', icon: Terminal, link: 'Terminal', color: 'bg-gray-700' },
    { name: 'Wiki', icon: BookOpen, link: 'Wiki', color: 'bg-amber-500' },
    { name: 'Lixeira', icon: Trash2, link: 'Trash', color: 'bg-red-500' },
    { name: 'Perfil', icon: User, link: 'Profile', color: 'bg-indigo-500' },
    { name: 'Assistente', icon: Settings, link: 'AssistantSettings', color: 'bg-teal-500' },
  ];

  const recentFiles = myFiles
    .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date))
    .slice(0, 6);

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 p-8"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1557683316-973673baf926?w=1920)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40" />
      
      {/* System Title */}
      <div className="relative z-10 mb-8">
        <h1 className="text-4xl font-bold text-white drop-shadow-lg">Sistema</h1>
      </div>

      {/* Desktop Icons */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 mb-16">
        {shortcuts.map((shortcut) => (
          <Link
            key={shortcut.name}
            to={createPageUrl(shortcut.link)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-white/10 dark:hover:bg-white/5 transition-all group"
          >
            <div className={`${shortcut.color} p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform`}>
              <shortcut.icon className="w-8 h-8 text-white" />
            </div>
            <span className="text-white text-sm font-medium text-center drop-shadow-lg">
              {shortcut.name}
            </span>
          </Link>
        ))}
      </div>

      {/* Recent Files Widget */}
      {recentFiles.length > 0 && (
        <div className="relative z-10 max-w-2xl mx-auto mb-8">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Arquivos Recentes
            </h2>
            <div className="space-y-2">
              {recentFiles.map((file) => {
                const Icon = fileTypeIcons[file.type] || File;
                return (
                  <Link
                    key={file.id}
                    to={createPageUrl(`FileViewer?id=${file.id}`)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(file.updated_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Stats Widget */}
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl p-6">
            <Folder className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{myFolders.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pastas</p>
          </div>
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl p-6">
            <File className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{myFiles.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Arquivos</p>
          </div>
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl p-6">
            <Users className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" />
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{myTeams.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Equipes</p>
          </div>
        </div>
      </div>

      {/* Taskbar */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 px-4 py-2">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('Drive')}>
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69402d779871a62c237ae85d/4b6abf78c_logo-horizontal-onhub.png"
                  alt="onHub"
                  className="h-8 w-auto"
                />
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {currentTime.toLocaleDateString('pt-BR')}
                </p>
              </div>
              {user?.profile_picture ? (
                <img 
                  src={user.profile_picture} 
                  alt="Perfil"
                  className="w-10 h-10 rounded-full border-2 border-blue-600"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}