import React, { useMemo, useState } from 'react';
import { onhub } from '@/api/onhubClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Trash2, ArrowLeft, RotateCcw, Loader2, AlertCircle, FolderOpen,
  Folder, FileText, FileSpreadsheet, LayoutGrid, GanttChart, Calendar,
  Image, Video, File, ChevronRight, ChevronDown
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

// Componente recursivo para renderizar árvore de pastas
function FolderTreeItem({ 
  folder, 
  level, 
  expanded, 
  onToggle, 
  onRestore, 
  onDelete,
  getSubfolders,
  getFolderFiles,
  expandedFolders,
  toggleFolder,
  handleRestoreFolder,
  handleDeleteFolderPermanently,
  handleRestoreFile,
  deleteFileMutation
}) {
  const subfolders = getSubfolders(folder.id);
  const folderFiles = getFolderFiles(folder.id);
  const hasChildren = subfolders.length > 0 || folderFiles.length > 0;
  
  return (
    <div className="space-y-2">
      <div
        className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
        style={{ marginLeft: `${level * 24}px` }}
      >
        {hasChildren && (
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-200 rounded"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}
          </button>
        )}
        
        {!hasChildren && <div className="w-6" />}
        
        <div className="p-2 rounded-lg bg-gray-100 text-gray-500">
          <Folder className="w-5 h-5" fill="currentColor" />
        </div>
        
        <div className="flex-1 min-w-0">
          <span className="font-medium text-gray-800 truncate text-sm block">
            {folder.name}
          </span>
          <span className="text-xs text-gray-400">
            Pasta • {new Date(folder.deleted_at).toLocaleDateString('pt-BR')}
          </span>
        </div>

        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-green-600 hover:bg-green-50"
            onClick={onRestore}
            title="Restaurar pasta e todo seu conteúdo"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-red-600 hover:bg-red-50"
            onClick={onDelete}
            title="Excluir permanentemente"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Conteúdo expandido */}
      {expanded && (
        <div className="space-y-2">
          {/* Subpastas */}
          {subfolders.map(subfolder => (
            <FolderTreeItem
              key={subfolder.id}
              folder={subfolder}
              level={level + 1}
              expanded={expandedFolders[subfolder.id]}
              onToggle={() => toggleFolder(subfolder.id)}
              onRestore={() => handleRestoreFolder(subfolder)}
              onDelete={() => handleDeleteFolderPermanently(subfolder)}
              getSubfolders={getSubfolders}
              getFolderFiles={getFolderFiles}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              handleRestoreFolder={handleRestoreFolder}
              handleDeleteFolderPermanently={handleDeleteFolderPermanently}
              handleRestoreFile={handleRestoreFile}
              deleteFileMutation={deleteFileMutation}
            />
          ))}

          {/* Arquivos da pasta */}
          {folderFiles.map(file => {
            const config = fileTypeConfig[file.type] || fileTypeConfig.other;
            const Icon = config.icon;
            return (
              <div
                key={file.id}
                className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
                style={{ marginLeft: `${(level + 1) * 24}px` }}
              >
                <div className="w-6" />
                
                <div className={`p-2 rounded-lg ${config.bg} ${config.color}`}>
                  <Icon className="w-5 h-5" />
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
      )}
    </div>
  );
}

export default function Trash() {
  const [emptyDialog, setEmptyDialog] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [restoreDialog, setRestoreDialog] = useState({ open: false, file: null, parentFolder: null });
  const queryClient = useQueryClient();

  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['folders'],
    queryFn: () => onhub.entities.Folder.list(),
  });

  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ['files'],
    queryFn: () => onhub.entities.File.list(),
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ id, data }) => onhub.entities.Folder.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['folders'] }),
  });

  const updateFileMutation = useMutation({
    mutationFn: ({ id, data }) => onhub.entities.File.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files'] }),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id) => onhub.entities.Folder.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['folders'] }),
  });

  const deleteFileMutation = useMutation({
    mutationFn: (id) => onhub.entities.File.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files'] }),
  });

  // Apenas pastas raiz deletadas (que não têm parent deletado)
  const deletedRootFolders = useMemo(() => {
    return folders.filter(f => f.deleted && (!f.parent_id || !folders.find(p => p.id === f.parent_id && p.deleted)));
  }, [folders]);

  // Apenas arquivos raiz deletados (que não têm folder deletada)
  const deletedRootFiles = useMemo(() => {
    return files.filter(f => f.deleted && (!f.folder_id || !folders.find(p => p.id === f.folder_id && p.deleted)));
  }, [files, folders]);

  // Função para pegar subpastas de uma pasta
  const getSubfolders = (folderId) => {
    return folders.filter(f => f.parent_id === folderId);
  };

  // Função para pegar arquivos de uma pasta
  const getFolderFiles = (folderId) => {
    return files.filter(f => f.folder_id === folderId);
  };

  // Toggle expansão de pasta
  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const handleRestoreFolder = async (folder) => {
    // Restaurar pasta e todos seus filhos recursivamente
    await updateFolderMutation.mutateAsync({
      id: folder.id,
      data: {
        deleted: false,
        deleted_at: null,
        parent_id: folder.original_parent_id || null,
        original_parent_id: null,
      }
    });

    // Restaurar subpastas
    const subfolders = getSubfolders(folder.id);
    for (const subfolder of subfolders) {
      await handleRestoreFolder(subfolder);
    }

    // Restaurar arquivos da pasta
    const folderFiles = getFolderFiles(folder.id);
    for (const file of folderFiles) {
      await updateFileMutation.mutateAsync({
        id: file.id,
        data: {
          deleted: false,
          deleted_at: null,
          folder_id: file.original_folder_id || null,
          original_folder_id: null,
        }
      });
    }
  };

  const handleRestoreFile = async (file, restoreOnlyFile = false) => {
    // Verificar se a pasta pai está deletada
    const parentFolder = folders.find(f => f.id === file.folder_id);
    
    if (parentFolder && parentFolder.deleted && !restoreOnlyFile) {
      // Mostrar dialog de escolha
      setRestoreDialog({ open: true, file, parentFolder });
      return;
    }

    // Se for para restaurar só o arquivo, buscar a pasta "avô"
    let targetFolderId = file.original_folder_id || null;
    
    if (restoreOnlyFile && parentFolder) {
      // Buscar a pasta pai da pasta deletada (a pasta "avô")
      targetFolderId = parentFolder.original_parent_id || null;
    }

    await updateFileMutation.mutateAsync({
      id: file.id,
      data: {
        deleted: false,
        deleted_at: null,
        folder_id: targetFolderId,
        original_folder_id: null,
      }
    });
  };

  const handleRestoreFileWithFolder = async (file, parentFolder) => {
    // Restaurar toda a pasta
    await handleRestoreFolder(parentFolder);
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
    // Deletar apenas pastas raiz (isso vai deletar recursivamente os filhos)
    for (const folder of deletedRootFolders) {
      await handleDeleteFolderPermanently(folder);
    }
    // Deletar apenas arquivos raiz
    for (const file of deletedRootFiles) {
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

        {(deletedRootFolders.length > 0 || deletedRootFiles.length > 0) && (
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
        ) : deletedRootFolders.length === 0 && deletedRootFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Trash2 className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">A lixeira está vazia</p>
            <p className="text-sm mt-1">Itens excluídos aparecerão aqui</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Renderizar pastas com hierarquia */}
            {deletedRootFolders.map(folder => (
              <FolderTreeItem
                key={folder.id}
                folder={folder}
                level={0}
                expanded={expandedFolders[folder.id]}
                onToggle={() => toggleFolder(folder.id)}
                onRestore={() => handleRestoreFolder(folder)}
                onDelete={() => handleDeleteFolderPermanently(folder)}
                getSubfolders={getSubfolders}
                getFolderFiles={getFolderFiles}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                handleRestoreFolder={handleRestoreFolder}
                handleDeleteFolderPermanently={handleDeleteFolderPermanently}
                handleRestoreFile={handleRestoreFile}
                deleteFileMutation={deleteFileMutation}
              />
            ))}

            {/* Arquivos raiz */}
            {deletedRootFiles.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Arquivos
                </h3>
                <div className="space-y-2">
                  {deletedRootFiles.map(file => {
                    const config = fileTypeConfig[file.type] || fileTypeConfig.other;
                    const Icon = config.icon;
                    return (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
                      >
                        <div className={`p-2 rounded-lg ${config.bg} ${config.color}`}>
                          <Icon className="w-5 h-5" />
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
          </div>
        )}
      </div>

      {/* Dialog Esvaziar Lixeira */}
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

      {/* Dialog Restaurar Arquivo */}
      <AlertDialog open={restoreDialog.open} onOpenChange={(open) => !open && setRestoreDialog({ open: false, file: null, parentFolder: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Como deseja restaurar?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                O arquivo <strong>{restoreDialog.file?.name}</strong> está dentro da pasta deletada{' '}
                <strong>{restoreDialog.parentFolder?.name}</strong>.
              </p>
              <p className="mt-3">Escolha como restaurar:</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              onClick={() => {
                handleRestoreFile(restoreDialog.file, true);
                setRestoreDialog({ open: false, file: null, parentFolder: null });
              }}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              Somente o Arquivo
            </Button>
            <Button
              onClick={() => {
                handleRestoreFileWithFolder(restoreDialog.file, restoreDialog.parentFolder);
                setRestoreDialog({ open: false, file: null, parentFolder: null });
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Pasta Completa
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
