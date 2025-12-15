import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Folder, FileText, FileSpreadsheet, LayoutGrid, 
  GanttChart, Calendar, Image, Video, TrendingUp, 
  Clock, User, ArrowRight, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const fileTypeConfig = {
  docx: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Documentos' },
  xlsx: { icon: FileSpreadsheet, color: 'text-green-600', bg: 'bg-green-100', label: 'Planilhas' },
  kbn: { icon: LayoutGrid, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Kanbans' },
  gnt: { icon: GanttChart, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Gantts' },
  crn: { icon: Calendar, color: 'text-pink-600', bg: 'bg-pink-100', label: 'Cronogramas' },
  img: { icon: Image, color: 'text-cyan-600', bg: 'bg-cyan-100', label: 'Imagens' },
  video: { icon: Video, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Vídeos' },
};

export default function Dashboard() {
  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['folders'],
    queryFn: () => base44.entities.Folder.list(),
  });

  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ['files'],
    queryFn: () => base44.entities.File.list(),
  });

  const activeFolders = folders.filter(f => !f.deleted);
  const activeFiles = files.filter(f => !f.deleted);

  const stats = useMemo(() => {
    const filesByType = {};
    activeFiles.forEach(file => {
      filesByType[file.type] = (filesByType[file.type] || 0) + 1;
    });

    const recentFiles = [...activeFiles]
      .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date))
      .slice(0, 5);

    return {
      totalFolders: activeFolders.length,
      totalFiles: activeFiles.length,
      filesByType,
      recentFiles,
    };
  }, [activeFolders, activeFiles]);

  const isLoading = foldersLoading || filesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Visão geral do seu keeping</p>
          </div>
          <Link to={createPageUrl('Drive')}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Folder className="w-4 h-4 mr-2" />
              Ir para Drive
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total de Pastas</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalFolders}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Folder className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total de Arquivos</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalFiles}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Kanbans</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.filesByType.kbn || 0}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <LayoutGrid className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Documentos</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.filesByType.docx || 0}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Files by Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Arquivos por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.filesByType).map(([type, count]) => {
                  const config = fileTypeConfig[type] || fileTypeConfig.docx;
                  const Icon = config.icon;
                  return (
                    <div key={type} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${config.bg}`}>
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <span className="font-medium text-gray-700">{config.label}</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-900">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Files */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Arquivos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.recentFiles.map(file => {
                  const config = fileTypeConfig[file.type] || fileTypeConfig.docx;
                  const Icon = config.icon;
                  return (
                    <Link 
                      key={file.id} 
                      to={createPageUrl(`FileViewer?id=${file.id}`)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className={`p-2 rounded-lg ${config.bg}`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(file.updated_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to={createPageUrl('Drive')}>
                <Button variant="outline" className="w-full h-20 flex-col gap-2">
                  <Folder className="w-6 h-6" />
                  <span className="text-sm">Nova Pasta</span>
                </Button>
              </Link>
              <Link to={createPageUrl('Drive')}>
                <Button variant="outline" className="w-full h-20 flex-col gap-2">
                  <LayoutGrid className="w-6 h-6 text-purple-600" />
                  <span className="text-sm">Novo Kanban</span>
                </Button>
              </Link>
              <Link to={createPageUrl('Drive')}>
                <Button variant="outline" className="w-full h-20 flex-col gap-2">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <span className="text-sm">Novo Documento</span>
                </Button>
              </Link>
              <Link to={createPageUrl('Drive')}>
                <Button variant="outline" className="w-full h-20 flex-col gap-2">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  <span className="text-sm">Ver Análises</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}