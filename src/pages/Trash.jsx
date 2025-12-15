import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Trash2, ArrowLeft, RotateCcw, Loader2, AlertCircle, FolderOpen,
  Folder, FileText, FileSpreadsheet, LayoutGrid, GanttChart, Calendar,
  Image, Video, File
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const fileTypeConfig = {
  docx: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
  xlsx: { icon: FileSpreadsheet, color: 'text-green-600', bg: 'bg-green-50' },
  kbn: { icon: LayoutGrid, color: 'text-purple-600', bg: 'bg-purple-50' },
  gnt: { icon: GanttChart, color: 'text-orange-600', bg: 'bg-orange-50' },
  crn: { icon: Calendar, color: 'text-pink-600', bg: 'bg-pink-50' },
  img: { icon: Image, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  video: { icon: Video, color: 'text-purple-600', bg: 'bg-purple-50' },
  other: { icon: File, color: 'text-gray-600', bg: 'bg-gray-50' },
};

export default function Trash() {
  const [emptyDialog, setEmptyDialog] = React.useState(false);
  const queryClient = useQueryClient();

  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['folders'],
    queryFn: () => base44.entities.Folder.list(),
  });

  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ['files'],
    queryFn: () => base44.entities.File.list(),
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Folder.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['folders'] }),
  });

  const updateFileMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.File.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files'] }),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id) => base44.entities.Folder.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['folders'] }),
  });

  const deleteFileMutation = useMutation({
    mutationFn: (id) => base44.entities.File.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files'] }),
  });

  const deletedFolders = useMemo(() => {
    return folders.filter(f => f.deleted);
  }, [folders]);

  const deletedFiles = useMemo(() => {
    return files.filter(f => f.deleted);
  }, [files]);

  const handleRestoreFolder = async (folder) => {
    await updateFolderMutation.mutateAsync({
      id: folder.id,
      data: {
        deleted: false,
        deleted_at: null,
        parent_id: folder.original_parent_id || null,
        original_parent_id: null,
      }
    });
  };

  const handleRestoreFile = async (file) => {
    await updateFileMutation.mutateAsync({
      id: file.id,
      data: {
        deleted: false,
        deleted_at: null,
        folder_id: file.original_folder_id || null,
        original_folder_id: null,
      }
    });
  };

  const handleDeleteFolderPermanently = async (folder) => {
    // Delete all children recursively
    const childFolders = folders.filter(f => f.parent_id === folder.id);
    const childFiles = files.filter(f => f.folder_id === folder.id);
    
    for (const child of childFolders) {
      await handleDeleteFolderPermanently(child);
    }
    for (const file of childFiles) {
      await deleteFileMutation.mutateAsync(file.id);
    }
    
    await deleteFolderMutation.mutateAsync(folder.id);
  };

  const handleEmptyTrash = async () => {
    for (const folder of deletedFolders) {
      await handleDeleteFolderPermanently(folder);
    }
    for (const file of deletedFiles) {
      await deleteFileMutation.mutateAsync(file.id);
    }
    setEmptyDialog(false);
  };

  const isLoading = foldersLoading || filesLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Drive')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="p-2 rounded-lg bg-red-100 text-red-600">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-800 text-lg">Lixeira</h1>
            <p className="text-xs text-gray-500">
              Itens são excluídos automaticamente após 24 horas
            </p>
          </div>
        </div>

        {(deletedFolders.length > 0 || deletedFiles.length > 0) && (
          <Button 
            variant="outline" 
            className="text-red-600 border-red-300 hover:bg-red-50"
            onClick={() => setEmptyDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Esvaziar Lixeira
          </Button>
        )}
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : deletedFolders.length === 0 && deletedFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Trash2 className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">A lixeira está vazia</p>
            <p className="text-sm mt-1">Itens excluídos aparecerão aqui</p>
          </div>
        ) : (
          <>
            {deletedFolders.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Pastas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {deletedFolders.map(folder => (
                    <div
                      key={folder.id}
                      className="relative flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white"
                    >
                      <div className="p-2 rounded-lg bg-gray-100 text-gray-500">
                        <Folder className="w-6 h-6" fill="currentColor" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-800 truncate text-sm block">
                          {folder.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(folder.deleted_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-green-600 hover:bg-green-50"
                          onClick={() => handleRestoreFolder(folder)}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteFolderPermanently(folder)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {deletedFiles.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Arquivos
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {deletedFiles.map(file => {
                    const config = fileTypeConfig[file.type] || fileTypeConfig.other;
                    const Icon = config.icon;
                    return (
                      <div
                        key={file.id}
                        className="relative flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white"
                      >
                        <div className={`p-2 rounded-lg ${config.bg} ${config.color}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-gray-800 truncate text-sm block">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(file.deleted_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-green-600 hover:bg-green-50"
                            onClick={() => handleRestoreFile(file)}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                            onClick={() => deleteFileMutation.mutate(file.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AlertDialog open={emptyDialog} onOpenChange={setEmptyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Esvaziar lixeira?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os itens na lixeira serão excluídos permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleEmptyTrash}
              className="bg-red-600 hover:bg-red-700"
            >
              Esvaziar Lixeira
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}