import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Loader2, FolderOpen, AlertCircle, Upload as UploadIcon } from 'lucide-react';
import JSZip from 'jszip';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Toaster } from 'react-hot-toast';

import Toolbar from '../components/drive/Toolbar';
import Breadcrumb from '../components/drive/Breadcrumb';
import FolderCard from '../components/drive/FolderCard';
import FileCard from '../components/drive/FileCard';
import CreateDialog from '../components/drive/CreateDialog';
import ImportExportDialog from '../components/drive/ImportExportDialog';
import Sidebar from '../components/drive/Sidebar';
import ListView from '../components/drive/ListView';
import UploadDialog from '../components/drive/UploadDialog';
import ShareDialog from '../components/drive/ShareDialog';
import AIAssistant from '../components/ai/AIAssistant';

export default function Drive() {
  const urlParams = new URLSearchParams(window.location.search);
  const folderParam = urlParams.get('folder');
  const viewFilter = urlParams.get('view') || 'myDrive'; // 'myDrive' ou 'shared'
  const [currentFolderId, setCurrentFolderId] = useState(folderParam);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialog, setCreateDialog] = useState({ open: false, type: null });
  const [importDialog, setImportDialog] = useState(false);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [renameDialog, setRenameDialog] = useState({ open: false, item: null, isFolder: false });
  const [viewMode, setViewMode] = useState('grid');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [clipboard, setClipboard] = useState({ type: null, item: null });
  const [dragOverFolder, setDragOverFolder] = useState(null);
  const [shareDialog, setShareDialog] = useState({ open: false, item: null, type: null });
  const [isChangingView, setIsChangingView] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch folders (apenas do usuário ou compartilhadas com ele)
  const { data: allFolders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['folders'],
    queryFn: () => base44.entities.Folder.list(),
    enabled: !!user,
  });

  const folders = useMemo(() => {
    if (!user || !allFolders.length) return [];
    return allFolders.filter(f => 
      f.owner === user.email || 
      (f.shared_with && f.shared_with.includes(user.email))
    );
  }, [allFolders, user]);

  // Fetch files (apenas do usuário ou compartilhados com ele)
  const { data: allFiles = [], isLoading: filesLoading } = useQuery({
    queryKey: ['files'],
    queryFn: () => base44.entities.File.list(),
    enabled: !!user,
  });

  // Helper function to check if a folder is shared with the user
  const isFolderSharedWithUser = (folderId) => {
    if (!folderId) return false;
    const folder = allFolders.find(f => f.id === folderId);
    if (!folder) return false;
    
    // Check if this folder is shared
    if (folder.shared_with && folder.shared_with.includes(user?.email)) {
      return true;
    }
    
    // Check parent folders recursively
    return isFolderSharedWithUser(folder.parent_id);
  };

  const files = useMemo(() => {
    if (!user || !allFiles.length) return [];
    return allFiles.filter(f => {
      // Own files
      if (f.owner === user.email) return true;
      
      // Files explicitly shared with user
      if (f.shared_with && f.shared_with.includes(user.email)) return true;
      
      // Files inside folders shared with user
      if (f.folder_id && isFolderSharedWithUser(f.folder_id)) return true;
      
      return false;
    });
  }, [allFiles, user, allFolders]);

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
    if (!user) return [];
    let filtered = folders.filter(f => !f.deleted);
    
    // Aplicar filtro de view (Meu Drive ou Compartilhado comigo)
    if (viewFilter === 'shared') {
      // Compartilhado comigo: pastas que OUTROS criaram e compartilharam comigo
      filtered = filtered.filter(f => f.owner !== user.email && f.shared_with && f.shared_with.includes(user.email));
    } else {
      // Meu Drive: pastas que EU criei
      filtered = filtered.filter(f => f.owner === user.email);
    }
    
    return filtered
      .filter(f => f.parent_id === currentFolderId)
      .filter(f => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [folders, currentFolderId, searchQuery, viewFilter, user]);

  const currentFiles = useMemo(() => {
    if (!user) return [];
    let filtered = files.filter(f => !f.deleted);
    
    // Aplicar filtro de view (Meu Drive ou Compartilhado comigo)
    if (viewFilter === 'shared') {
      // Compartilhado comigo: arquivos em pastas que OUTROS criaram e compartilharam comigo
      filtered = filtered.filter(f => {
        // Files explicitly shared with me by others
        if (f.owner !== user.email && f.shared_with && f.shared_with.includes(user.email)) return true;
        
        // Files in folders created by others and shared with me
        if (f.folder_id) {
          const folder = allFolders.find(fld => fld.id === f.folder_id);
          if (folder && folder.owner !== user.email && folder.shared_with && folder.shared_with.includes(user.email)) {
            return true;
          }
        }
        
        return false;
      });
    } else {
      // Meu Drive: arquivos que eu criei OU arquivos em pastas que EU possuo (independente de quem criou)
      filtered = filtered.filter(f => {
        // My own files
        if (f.owner === user.email) return true;
        
        // Files in folders that I own (even if created by others who have access)
        if (f.folder_id) {
          const folder = allFolders.find(fld => fld.id === f.folder_id);
          if (folder && folder.owner === user.email) return true;
        }
        
        return false;
      });
    }
    
    return filtered
      .filter(f => f.folder_id === currentFolderId)
      .filter(f => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [files, currentFolderId, searchQuery, viewFilter, user, allFolders]);

  // Handlers
  const handleCreateFolder = async (name, color) => {
    if (!user) return;
    try {
      // Se estiver dentro de uma pasta pai, herdar a cor dela
      let folderColor = color;
      let sharedWith = [];
      
      if (currentFolderId) {
        const parentFolder = folders.find(f => f.id === currentFolderId);
        
        // Herdar cor
        if (parentFolder && parentFolder.color && !color) {
          folderColor = parentFolder.color;
        }
        
        // Herdar compartilhamento recursivamente
        let checkFolderId = currentFolderId;
        while (checkFolderId) {
          const folder = folders.find(f => f.id === checkFolderId);
          if (folder && folder.shared_with && folder.shared_with.length > 0) {
            folder.shared_with.forEach(email => {
              if (!sharedWith.includes(email)) {
                sharedWith.push(email);
              }
            });
          }
          checkFolderId = folder?.parent_id;
        }
      }
      
      await createFolderMutation.mutateAsync({
        name,
        parent_id: currentFolderId,
        color: folderColor,
        order: currentFolders.length,
        owner: user.email,
        shared_with: sharedWith,
      });
      setCreateDialog({ open: false, type: null });
    } catch (error) {
      console.error('Erro ao criar pasta:', error);
      alert('Erro ao criar pasta: ' + error.message);
    }
  };

  const handleCreateFile = async (name, type) => {
    if (!user) return;
    const defaultContent = {
      kbn: JSON.stringify({ columns: [], cards: [] }),
      gnt: JSON.stringify({ tasks: [] }),
      crn: JSON.stringify({ groups: [], items: [] }),
      flux: JSON.stringify({ drawflow: { Home: { data: {} } } }),
      docx: '',
      xlsx: '',
      pptx: JSON.stringify({ slides: [{ title: '', content: '' }] }),
    };

    // Herdar compartilhamento da pasta pai recursivamente
    let sharedWith = [];
    let checkFolderId = currentFolderId;
    
    while (checkFolderId) {
      const folder = folders.find(f => f.id === checkFolderId);
      if (folder && folder.shared_with && folder.shared_with.length > 0) {
        // Adicionar todos os usuários compartilhados sem duplicatas
        folder.shared_with.forEach(email => {
          if (!sharedWith.includes(email)) {
            sharedWith.push(email);
          }
        });
      }
      checkFolderId = folder?.parent_id;
    }

    try {
      await createFileMutation.mutateAsync({
        name,
        type,
        folder_id: currentFolderId,
        content: defaultContent[type] || '',
        order: currentFiles.length,
        owner: user.email,
        shared_with: sharedWith,
      });
      setCreateDialog({ open: false, type: null });
    } catch (error) {
      console.error('Erro ao criar arquivo:', error);
      alert('Erro ao criar arquivo: ' + error.message);
    }
  };

  const handleNewFile = (type) => {
    setCreateDialog({ open: true, type });
  };

  const handleDeleteFolder = async (folder) => {
    // Apenas o proprietário pode excluir
    if (!user || folder.owner !== user.email) {
      alert('Apenas o proprietário pode excluir esta pasta.');
      return;
    }
    
    // Move to trash instead of deleting
    await updateFolderMutation.mutateAsync({
      id: folder.id,
      data: {
        deleted: true,
        deleted_at: new Date().toISOString(),
        original_parent_id: folder.parent_id,
      }
    });

    // Also move all children to trash
    const childFolders = folders.filter(f => f.parent_id === folder.id);
    const childFiles = files.filter(f => f.folder_id === folder.id);
    
    for (const child of childFolders) {
      await handleDeleteFolder(child);
    }
    for (const file of childFiles) {
      await updateFileMutation.mutateAsync({
        id: file.id,
        data: {
          deleted: true,
          deleted_at: new Date().toISOString(),
          original_folder_id: file.folder_id,
        }
      });
    }
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

  const handleExportFile = async (file) => {
    // Export media files in original format
    if ((file.type === 'img' || file.type === 'video') && file.file_url) {
      const a = document.createElement('a');
      a.href = file.file_url;
      a.download = file.name;
      a.click();
      return;
    }

    // Export docx/xlsx/pptx with content
    if (file.type === 'docx' || file.type === 'xlsx' || file.type === 'pptx') {
      const mimeTypes = {
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      };
      const blob = new Blob([file.content || ''], { type: mimeTypes[file.type] });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name}.${file.type}`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // Export other files as JSON
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

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId, type } = result;

    // Handle drops into folders (both sidebar and grid)
    if (destination.droppableId.startsWith('folder-') || destination.droppableId.startsWith('sidebar-folder-')) {
      const targetFolderId = destination.droppableId.replace('folder-', '').replace('sidebar-folder-', '');
      const finalFolderId = targetFolderId === 'root' ? null : targetFolderId;

      if (type === 'FOLDER') {
        const folder = folders.find(f => f.id === draggableId);
        if (folder && folder.parent_id !== finalFolderId) {
          await updateFolderMutation.mutateAsync({
            id: draggableId,
            data: { parent_id: finalFolderId }
          });
        }
      } else if (type === 'FILE') {
        const file = files.find(f => f.id === draggableId);
        if (file && file.folder_id !== finalFolderId) {
          // Herdar compartilhamento da pasta de destino recursivamente
          let sharedWith = [];

          if (finalFolderId) {
            let checkFolderId = finalFolderId;
            while (checkFolderId) {
              const folder = folders.find(f => f.id === checkFolderId);
              if (folder && folder.shared_with && folder.shared_with.length > 0) {
                folder.shared_with.forEach(email => {
                  if (!sharedWith.includes(email)) {
                    sharedWith.push(email);
                  }
                });
              }
              checkFolderId = folder?.parent_id;
            }
          }

          await updateFileMutation.mutateAsync({
            id: draggableId,
            data: { 
              folder_id: finalFolderId,
              shared_with: sharedWith
            }
          });
        }
      }
      return;
    }

    // Reordering in same list
    if (source.droppableId === destination.droppableId) {
      if (type === 'FOLDER') {
        const items = Array.from(currentFolders);
        const [reordered] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reordered);
        
        // Update order for all affected folders
        const updates = items.map((item, index) => 
          updateFolderMutation.mutateAsync({ id: item.id, data: { order: index } })
        );
        await Promise.all(updates);
      } else if (type === 'FILE') {
        const items = Array.from(currentFiles);
        const [reordered] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reordered);
        
        const updates = items.map((item, index) => 
          updateFileMutation.mutateAsync({ id: item.id, data: { order: index } })
        );
        await Promise.all(updates);
      }
    }
  };

  const handleExportFolder = async (folder) => {
    const zip = new JSZip();
    
    const addFolderToZip = async (folderId, zipFolder) => {
      const subFolders = folders.filter(f => f.parent_id === folderId);
      const folderFiles = files.filter(f => f.folder_id === folderId);
      
      for (const file of folderFiles) {
        if ((file.type === 'img' || file.type === 'video') && file.file_url) {
          try {
            const response = await fetch(file.file_url);
            const blob = await response.blob();
            zipFolder.file(file.name, blob);
          } catch (error) {
            console.error('Error downloading file:', error);
          }
        } else if (file.type === 'docx' || file.type === 'xlsx' || file.type === 'pptx') {
          zipFolder.file(`${file.name}.${file.type}`, file.content || '');
        } else {
          zipFolder.file(`${file.name}.json`, JSON.stringify({
            name: file.name,
            type: file.type,
            content: file.content
          }, null, 2));
        }
      }
      
      for (const subFolder of subFolders) {
        const subZipFolder = zipFolder.folder(subFolder.name);
        await addFolderToZip(subFolder.id, subZipFolder);
      }
    };
    
    await addFolderToZip(folder.id, zip);
    
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${folder.name}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Drag and drop externo (do PC para o navegador)
  const handleExternalDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleExternalDrop = async (e, targetFolderId = null) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (!droppedFiles.length) return;

    const toast = (await import('react-hot-toast')).default;
    
    const uploadToastId = toast.loading(
      `Importando ${droppedFiles.length} arquivo${droppedFiles.length > 1 ? 's' : ''}...`,
      { position: 'bottom-left' }
    );

    // Herdar compartilhamento da pasta pai recursivamente
    let sharedWith = [];
    const folderId = targetFolderId || currentFolderId;
    
    if (folderId) {
      let checkFolderId = folderId;
      while (checkFolderId) {
        const folder = folders.find(f => f.id === checkFolderId);
        if (folder && folder.shared_with && folder.shared_with.length > 0) {
          folder.shared_with.forEach(email => {
            if (!sharedWith.includes(email)) {
              sharedWith.push(email);
            }
          });
        }
        checkFolderId = folder?.parent_id;
      }
    }

    try {
      let successCount = 0;
      
      for (const file of droppedFiles) {
        const fileType = detectFileType(file);
        
        // Upload do arquivo
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        
        // Criar registro no banco
        await createFileMutation.mutateAsync({
          name: file.name,
          type: fileType,
          folder_id: folderId,
          file_url: file_url,
          order: currentFiles.length + successCount,
          owner: user.email,
          shared_with: sharedWith,
        });
        
        successCount++;
        
        toast.loading(
          `Importando ${successCount}/${droppedFiles.length} arquivos...`,
          { id: uploadToastId, position: 'bottom-left' }
        );
      }

      toast.success(
        `${successCount} arquivo${successCount > 1 ? 's importados' : ' importado'} com sucesso!`,
        { id: uploadToastId, position: 'bottom-left', duration: 3000 }
      );
      
      queryClient.invalidateQueries({ queryKey: ['files'] });
    } catch (error) {
      toast.error('Erro ao importar arquivos', { 
        id: uploadToastId, 
        position: 'bottom-left' 
      });
    }
  };

  const detectFileType = (file) => {
    const name = file.name.toLowerCase();
    if (name.endsWith('.docx') || name.endsWith('.doc')) return 'docx';
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) return 'xlsx';
    if (name.endsWith('.pptx') || name.endsWith('.ppt')) return 'pptx';
    if (name.endsWith('.pdf')) return 'pdf';
    if (name.match(/\.(jpg|jpeg|png|gif|bmp|svg|webp)$/)) return 'img';
    if (name.match(/\.(mp4|avi|mov|wmv|flv|webm)$/)) return 'video';
    if (name.endsWith('.kbn')) return 'kbn';
    if (name.endsWith('.gnt')) return 'gnt';
    if (name.endsWith('.crn')) return 'crn';
    return 'other';
  };

  const handleShareItem = (item, type) => {
    setShareDialog({ open: true, item, type });
  };

  const handleGenerateShareLink = async (item, type) => {
    const token = Math.random().toString(36).substr(2, 16);
    const mutation = type === 'folder' ? updateFolderMutation : updateFileMutation;
    await mutation.mutateAsync({
      id: item.id,
      data: { share_token: token }
    });
    const shareUrl = `${window.location.origin}${createPageUrl('Drive')}?share=${token}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Link de compartilhamento copiado!');
  };

  const handleShareWithEmail = async (item, type, email) => {
    if (!email || !email.includes('@')) {
      alert('Email inválido');
      return;
    }
    const mutation = type === 'folder' ? updateFolderMutation : updateFileMutation;
    const currentShared = item.shared_with || [];
    if (currentShared.includes(email)) {
      alert('Este usuário já tem acesso');
      return;
    }
    await mutation.mutateAsync({
      id: item.id,
      data: { shared_with: [...currentShared, email] }
    });
    alert('Compartilhado com sucesso!');
  };

  const handleRemoveShare = async (item, type, email) => {
    const mutation = type === 'folder' ? updateFolderMutation : updateFileMutation;
    const currentShared = item.shared_with || [];
    await mutation.mutateAsync({
      id: item.id,
      data: { shared_with: currentShared.filter(e => e !== email) }
    });
  };

  const handleLeaveShare = async (item, type) => {
    if (!user) return;
    const mutation = type === 'folder' ? updateFolderMutation : updateFileMutation;
    const currentShared = item.shared_with || [];
    await mutation.mutateAsync({
      id: item.id,
      data: { shared_with: currentShared.filter(e => e !== user.email) }
    });
  };

  // Handle view change loading
  useEffect(() => {
    if (viewFilter) {
      setIsChangingView(true);
      const timer = setTimeout(() => setIsChangingView(false), 300);
      return () => clearTimeout(timer);
    }
  }, [viewFilter]);

  // Handle shared link access
  useEffect(() => {
    const shareToken = urlParams.get('share');
    if (shareToken && user) {
      const sharedFolder = allFolders.find(f => f.share_token === shareToken);
      const sharedFile = allFiles.find(f => f.share_token === shareToken);
      
      if (sharedFolder) {
        const currentShared = sharedFolder.shared_with || [];
        if (!currentShared.includes(user.email) && sharedFolder.owner !== user.email) {
          updateFolderMutation.mutate({
            id: sharedFolder.id,
            data: { shared_with: [...currentShared, user.email] }
          });
        }
        window.history.replaceState({}, '', createPageUrl(`Drive?folder=${sharedFolder.id}`));
      } else if (sharedFile) {
        const currentShared = sharedFile.shared_with || [];
        if (!currentShared.includes(user.email) && sharedFile.owner !== user.email) {
          updateFileMutation.mutate({
            id: sharedFile.id,
            data: { shared_with: [...currentShared, user.email] }
          });
        }
        window.history.replaceState({}, '', createPageUrl(`FileViewer?id=${sharedFile.id}`));
      }
    }
  }, [urlParams, user, allFolders, allFiles]);

  const isLoading = foldersLoading || filesLoading || !user;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
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
        onPaste={clipboard.item ? handlePaste : null}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        viewFilter={viewFilter}
        onRefresh={() => {
          queryClient.invalidateQueries({ queryKey: ['folders'] });
          queryClient.invalidateQueries({ queryKey: ['files'] });
        }}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          folders={folders}
          currentFolderId={currentFolderId}
          onFolderSelect={setCurrentFolderId}
          isOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          currentUserEmail={user?.email}
          viewFilter={viewFilter}
        />
        
        <div 
          className="flex-1 flex flex-col overflow-hidden"
          onDragOver={handleExternalDragOver}
          onDrop={(e) => handleExternalDrop(e, currentFolderId)}
        >
          <Breadcrumb 
            path={breadcrumbPath} 
            onNavigate={setCurrentFolderId} 
          />

          <div className="flex-1 p-6 overflow-y-auto">
          {isLoading || isChangingView ? (
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
            onFolderExport={handleExportFolder}
            onFolderColorChange={(folder, color) => updateFolderMutation.mutate({ id: folder.id, data: { color } })}
            onFileDelete={(file) => {
              if (file.owner !== user?.email) {
                alert('Apenas o proprietário pode excluir este arquivo.');
                return;
              }
              updateFileMutation.mutate({
                id: file.id,
                data: {
                  deleted: true,
                  deleted_at: new Date().toISOString(),
                  original_folder_id: file.folder_id,
                }
              });
            }}
            onFileRename={handleRenameFile}
            onFileExport={handleExportFile}
            onFileCopy={handleCopyFile}
            onFileShare={(file) => handleShareItem(file, 'file')}
            onFolderShare={(folder) => handleShareItem(folder, 'folder')}
            currentUserEmail={user?.email}
            allFolders={folders.filter(f => !f.deleted)}
            allFiles={files.filter(f => !f.deleted)}
          />
        ) : (
          <>
            {/* Folders */}
            {currentFolders.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Pastas
                </h3>
                <Droppable droppableId="folders" type="FOLDER">
                  {(provided) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
                    >
                      {currentFolders.map((folder, index) => (
                        <Draggable key={folder.id} draggableId={folder.id} index={index}>
                          {(provided, snapshot) => (
                            <FolderCard
                              folder={folder}
                              onClick={() => setCurrentFolderId(folder.id)}
                              onDelete={() => handleDeleteFolder(folder)}
                              onRename={() => handleRenameFolder(folder)}
                              onCopy={() => handleCopyFolder(folder)}
                              onExport={() => handleExportFolder(folder)}
                              onColorChange={(folder, color) => updateFolderMutation.mutate({ id: folder.id, data: { color } })}
                              onShare={() => handleShareItem(folder, 'folder')}
                              onLeaveShare={() => handleLeaveShare(folder, 'folder')}
                              isOwner={folder.owner === user?.email}
                              provided={provided}
                              isDragging={snapshot.isDragging}
                              onExternalDrop={handleExternalDrop}
                            />
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )}
            
            {/* Files */}
            {currentFiles.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Arquivos
                </h3>
                <Droppable droppableId="files" type="FILE">
                  {(provided) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
                    >
                      {currentFiles.map((file, index) => (
                        <Draggable key={file.id} draggableId={file.id} index={index}>
                          {(provided, snapshot) => (
                            <FileCard
                              file={file}
                              onClick={() => handleFileClick(file)}
                              onDelete={() => {
                                if (file.owner !== user?.email) {
                                  alert('Apenas o proprietário pode excluir este arquivo.');
                                  return;
                                }
                                updateFileMutation.mutate({
                                  id: file.id,
                                  data: {
                                    deleted: true,
                                    deleted_at: new Date().toISOString(),
                                    original_folder_id: file.folder_id,
                                  }
                                });
                              }}
                              onRename={() => handleRenameFile(file)}
                              onExport={() => handleExportFile(file)}
                              onCopy={() => handleCopyFile(file)}
                              onShare={() => handleShareItem(file, 'file')}
                              onLeaveShare={() => handleLeaveShare(file, 'file')}
                              isOwner={file.owner === user?.email}
                              provided={provided}
                              isDragging={snapshot.isDragging}
                            />
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
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
        onSubmit={(name, color) => {
          if (createDialog.type === 'folder') {
            handleCreateFolder(name, color);
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
        folders={folders}
      />

      {/* Share Dialog */}
      <ShareDialog
        open={shareDialog.open}
        onOpenChange={(open) => setShareDialog({ ...shareDialog, open })}
        item={shareDialog.item}
        type={shareDialog.type}
        onGenerateLink={handleGenerateShareLink}
        onShareWithEmail={handleShareWithEmail}
        onRemoveShare={handleRemoveShare}
        currentUserEmail={user?.email}
      />

      {/* AI Assistant */}
      <AIAssistant 
        currentFolderId={currentFolderId}
        currentPage="Drive"
      />

      {/* Toast Container */}
      <Toaster />
      </div>
      </DragDropContext>
      );
      }