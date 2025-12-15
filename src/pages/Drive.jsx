import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Loader2, FolderOpen, AlertCircle } from 'lucide-react';

import Toolbar from '../components/drive/Toolbar';
import Breadcrumb from '../components/drive/Breadcrumb';
import FolderCard from '../components/drive/FolderCard';
import FileCard from '../components/drive/FileCard';
import CreateDialog from '../components/drive/CreateDialog';
import ImportExportDialog from '../components/drive/ImportExportDialog';
import Sidebar from '../components/drive/Sidebar';
import ListView from '../components/drive/ListView';
import UploadDialog from '../components/drive/UploadDialog';
import AIAssistant from '../components/ai/AIAssistant';

export default function Drive() {
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialog, setCreateDialog] = useState({ open: false, type: null });
  const [importDialog, setImportDialog] = useState(false);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [renameDialog, setRenameDialog] = useState({ open: false, item: null, isFolder: false });
  const [viewMode, setViewMode] = useState('grid');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [clipboard, setClipboard] = useState({ type: null, item: null });
  
  const queryClient = useQueryClient();

  // Fetch folders
  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['folders'],
    queryFn: () => base44.entities.Folder.list(),
  });

  // Fetch files
  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ['files'],
    queryFn: () => base44.entities.File.list(),
  });

  // Mutations
  const createFolderMutation = useMutation({
    mutationFn: (data) => base44.entities.Folder.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['folders'] }),
  });

  const createFileMutation = useMutation({
    mutationFn: (data) => base44.entities.File.create(data),
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

  const updateFolderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Folder.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['folders'] }),
  });

  const updateFileMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.File.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files'] }),
  });

  // Build breadcrumb path
  const breadcrumbPath = useMemo(() => {
    const path = [];
    let current = currentFolderId;
    while (current) {
      const folder = folders.find(f => f.id === current);
      if (folder) {
        path.unshift(folder);
        current = folder.parent_id;
      } else {
        break;
      }
    }
    return path;
  }, [currentFolderId, folders]);

  // Filter items for current folder
  const currentFolders = useMemo(() => {
    return folders
      .filter(f => f.parent_id === currentFolderId)
      .filter(f => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [folders, currentFolderId, searchQuery]);

  const currentFiles = useMemo(() => {
    return files
      .filter(f => f.folder_id === currentFolderId)
      .filter(f => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [files, currentFolderId, searchQuery]);

  // Handlers
  const handleCreateFolder = (name) => {
    createFolderMutation.mutate({
      name,
      parent_id: currentFolderId,
      order: currentFolders.length,
    });
    setCreateDialog({ open: false, type: null });
  };

  const handleCreateFile = (name, type) => {
    const defaultContent = {
      kbn: JSON.stringify({ columns: [], cards: [] }),
      gnt: JSON.stringify({ tasks: [] }),
      crn: JSON.stringify({ groups: [], items: [] }),
      docx: '',
      xlsx: '',
    };

    createFileMutation.mutate({
      name,
      type,
      folder_id: currentFolderId,
      content: defaultContent[type] || '',
      order: currentFiles.length,
    });
    setCreateDialog({ open: false, type: null });
  };

  const handleNewFile = (type) => {
    setCreateDialog({ open: true, type });
  };

  const handleDeleteFolder = async (folder) => {
    // Delete all children recursively
    const childFolders = folders.filter(f => f.parent_id === folder.id);
    const childFiles = files.filter(f => f.folder_id === folder.id);
    
    for (const child of childFolders) {
      await handleDeleteFolder(child);
    }
    for (const file of childFiles) {
      await deleteFileMutation.mutateAsync(file.id);
    }
    
    await deleteFolderMutation.mutateAsync(folder.id);
  };

  const handleRenameFolder = (folder) => {
    const newName = prompt('Novo nome:', folder.name);
    if (newName && newName.trim()) {
      updateFolderMutation.mutate({ id: folder.id, data: { name: newName.trim() } });
    }
  };

  const handleRenameFile = (file) => {
    const newName = prompt('Novo nome:', file.name);
    if (newName && newName.trim()) {
      updateFileMutation.mutate({ id: file.id, data: { name: newName.trim() } });
    }
  };

  const handleExportFile = (file) => {
    const exportData = {
      type: 'single_file',
      file: {
        name: file.name,
        type: file.type,
        content: file.content,
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAll = async () => {
    const buildStructure = (parentId = null) => {
      const foldersList = folders.filter(f => f.parent_id === parentId);
      const filesList = files.filter(f => f.folder_id === parentId);
      
      return {
        folders: foldersList.map(folder => ({
          name: folder.name,
          color: folder.color,
          children: buildStructure(folder.id),
        })),
        files: filesList.map(file => ({
          name: file.name,
          type: file.type,
          content: file.content,
        })),
      };
    };

    const exportData = {
      type: 'full_drive',
      exported_at: new Date().toISOString(),
      structure: buildStructure(null),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drive_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (data) => {
    const importStructure = async (structure, parentId = null) => {
      // Import folders
      for (const folder of structure.folders || []) {
        const newFolder = await base44.entities.Folder.create({
          name: folder.name,
          parent_id: parentId,
          color: folder.color,
        });
        
        if (folder.children) {
          await importStructure(folder.children, newFolder.id);
        }
      }
      
      // Import files
      for (const file of structure.files || []) {
        await base44.entities.File.create({
          name: file.name,
          type: file.type,
          folder_id: parentId,
          content: file.content,
        });
      }
    };

    if (data.type === 'full_drive') {
      await importStructure(data.structure, currentFolderId);
    } else if (data.type === 'single_file') {
      await base44.entities.File.create({
        name: data.file.name,
        type: data.file.type,
        folder_id: currentFolderId,
        content: data.file.content,
      });
    }
    
    queryClient.invalidateQueries({ queryKey: ['folders'] });
    queryClient.invalidateQueries({ queryKey: ['files'] });
  };

  const handleFileClick = (file) => {
    // Navigate to file viewer/editor
    window.location.href = createPageUrl(`FileViewer?id=${file.id}`);
  };

  const handleCopyFolder = (folder) => {
    setClipboard({ type: 'folder', item: folder });
  };

  const handleCopyFile = (file) => {
    setClipboard({ type: 'file', item: file });
  };

  const handlePaste = async () => {
    if (!clipboard.item) return;

    if (clipboard.type === 'folder') {
      await createFolderMutation.mutateAsync({
        name: `${clipboard.item.name} (cópia)`,
        parent_id: currentFolderId,
        color: clipboard.item.color,
        order: currentFolders.length,
      });
    } else if (clipboard.type === 'file') {
      await createFileMutation.mutateAsync({
        name: `${clipboard.item.name} (cópia)`,
        type: clipboard.item.type,
        folder_id: currentFolderId,
        content: clipboard.item.content,
        file_url: clipboard.item.file_url,
        order: currentFiles.length,
      });
    }
  };

  const isLoading = foldersLoading || filesLoading;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toolbar
        onNewFolder={() => setCreateDialog({ open: true, type: 'folder' })}
        onNewFile={handleNewFile}
        onUpload={() => setUploadDialog(true)}
        onImport={() => setImportDialog(true)}
        onExportAll={handleExportAll}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onPaste={clipboard.item ? handlePaste : null}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          folders={folders}
          currentFolderId={currentFolderId}
          onFolderSelect={setCurrentFolderId}
          isOpen={sidebarOpen}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Breadcrumb 
            path={breadcrumbPath} 
            onNavigate={setCurrentFolderId} 
          />
          
          <div className="flex-1 p-6 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : currentFolders.length === 0 && currentFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <FolderOpen className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">Esta pasta está vazia</p>
            <p className="text-sm mt-1">Crie uma nova pasta ou arquivo para começar</p>
          </div>
        ) : viewMode === 'list' ? (
          <ListView
            folders={currentFolders}
            files={currentFiles}
            onFolderClick={setCurrentFolderId}
            onFileClick={handleFileClick}
            onFolderDelete={handleDeleteFolder}
            onFolderRename={handleRenameFolder}
            onFolderCopy={handleCopyFolder}
            onFileDelete={(id) => deleteFileMutation.mutate(id)}
            onFileRename={handleRenameFile}
            onFileExport={handleExportFile}
            onFileCopy={handleCopyFile}
          />
        ) : (
          <>
            {/* Folders */}
            {currentFolders.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Pastas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {currentFolders.map(folder => (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      onClick={() => setCurrentFolderId(folder.id)}
                      onDelete={() => handleDeleteFolder(folder)}
                      onRename={() => handleRenameFolder(folder)}
                      onCopy={() => handleCopyFolder(folder)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Files */}
            {currentFiles.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Arquivos
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {currentFiles.map(file => (
                    <FileCard
                      key={file.id}
                      file={file}
                      onClick={() => handleFileClick(file)}
                      onDelete={() => deleteFileMutation.mutate(file.id)}
                      onRename={() => handleRenameFile(file)}
                      onExport={() => handleExportFile(file)}
                      onCopy={() => handleCopyFile(file)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
          </div>
        </div>
      </div>

      {/* Create Dialog */}
      <CreateDialog
        type={createDialog.type}
        open={createDialog.open}
        onOpenChange={(open) => setCreateDialog({ ...createDialog, open })}
        onSubmit={(name) => {
          if (createDialog.type === 'folder') {
            handleCreateFolder(name);
          } else {
            handleCreateFile(name, createDialog.type);
          }
        }}
      />

      {/* Import Dialog */}
      <ImportExportDialog
        open={importDialog}
        onOpenChange={setImportDialog}
        onImport={handleImport}
      />

      {/* Upload Dialog */}
      <UploadDialog
        open={uploadDialog}
        onOpenChange={setUploadDialog}
        onUploadComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['files'] });
        }}
        folderId={currentFolderId}
      />

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  );
}