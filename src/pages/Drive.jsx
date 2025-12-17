import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Loader2, FolderOpen, AlertCircle, Upload as UploadIcon } from 'lucide-react';
import JSZip from 'jszip';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Toaster } from 'react-hot-toast';
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
import TeamDialog from '../components/drive/TeamDialog';
import MoveDialog from '../components/drive/MoveDialog';

export default function Drive() {
  const urlParams = new URLSearchParams(window.location.search);
  const folderParam = urlParams.get('folder');
  const teamParam = urlParams.get('team');
  const [currentFolderId, setCurrentFolderId] = useState(folderParam);
  const [selectedTeamId, setSelectedTeamId] = useState(teamParam);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialog, setCreateDialog] = useState({ open: false, type: null });
  const [teamDialog, setTeamDialog] = useState({ open: false, team: null });
  const [importDialog, setImportDialog] = useState(false);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [moveConfirmDialog, setMoveConfirmDialog] = useState({ open: false, data: null });
  const [moveDialog, setMoveDialog] = useState({ open: false, item: null, type: null });
  
  const queryClient = useQueryClient();

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch teams
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
    enabled: !!user,
  });

  // User's teams
  const userTeams = useMemo(() => {
    if (!user || !teams.length) return [];
    return teams.filter(t => t.members && t.members.includes(user.email));
  }, [teams, user]);

  // Auto-refresh based on user settings
  React.useEffect(() => {
    if (!user?.auto_refresh_interval) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
    }, (user.auto_refresh_interval || 120) * 1000);

    return () => clearInterval(interval);
  }, [user?.auto_refresh_interval, queryClient]);

  // Fetch folders
  const { data: allFolders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['folders'],
    queryFn: () => base44.entities.Folder.list(),
    enabled: !!user,
  });

  // Fetch files
  const { data: allFiles = [], isLoading: filesLoading } = useQuery({
    queryKey: ['files'],
    queryFn: () => base44.entities.File.list(),
    enabled: !!user,
  });

  // Get folder's team
  const getFolderTeam = (folderId) => {
    if (!folderId) return null;
    const folder = allFolders.find(f => f.id === folderId);
    if (!folder) return null;
    if (folder.team_id) return folder.team_id;
    return getFolderTeam(folder.parent_id);
  };

  // Check if user has access to folder
  const hasAccessToFolder = (folder) => {
    if (folder.owner === user?.email) return true;
    if (folder.team_id) {
      const team = teams.find(t => t.id === folder.team_id);
      return team && team.members && team.members.includes(user?.email);
    }
    return false;
  };

  // Check if user has access to file
  const hasAccessToFile = (file) => {
    if (file.owner === user?.email) return true;
    if (file.team_id) {
      const team = teams.find(t => t.id === file.team_id);
      return team && team.members && team.members.includes(user?.email);
    }
    if (file.folder_id) {
      const folderTeamId = getFolderTeam(file.folder_id);
      if (folderTeamId) {
        const team = teams.find(t => t.id === folderTeamId);
        return team && team.members && team.members.includes(user?.email);
      }
    }
    return false;
  };

  const folders = useMemo(() => {
    if (!user || !allFolders.length) return [];
    return allFolders.filter(hasAccessToFolder);
  }, [allFolders, user, teams]);

  const files = useMemo(() => {
    if (!user || !allFiles.length) return [];
    return allFiles.filter(hasAccessToFile);
  }, [allFiles, user, teams, allFolders]);

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
    
    // Se tem equipe selecionada, adiciona no início
    if (selectedTeamId) {
      const team = teams.find(t => t.id === selectedTeamId);
      if (team) {
        path.push({ id: `team-${selectedTeamId}`, name: team.name, isTeam: true });
      }
    }
    
    let current = currentFolderId;
    while (current) {
      const folder = folders.find(f => f.id === current);
      if (folder) {
        path.push(folder);
        current = folder.parent_id;
      } else {
        break;
      }
    }
    return path;
  }, [currentFolderId, selectedTeamId, folders, teams]);

  // Filter items for current folder
  const currentFolders = useMemo(() => {
    if (!user) return [];
    return folders
      .filter(f => !f.deleted)
      .filter(f => {
        // Se está visualizando uma equipe (sem pasta específica)
        if (selectedTeamId && !currentFolderId) {
          return f.team_id === selectedTeamId && !f.parent_id;
        }
        // Filtro normal por pasta
        return f.parent_id === currentFolderId;
      })
      .filter(f => {
        // Se está na raiz (Meu Drive), mostrar apenas pastas sem team_id
        if (currentFolderId === null && !selectedTeamId) {
          return !f.team_id && f.owner === user.email;
        }
        // Se está dentro de uma pasta, mostrar apenas se tiver acesso
        return hasAccessToFolder(f);
      })
      .filter(f => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [folders, currentFolderId, selectedTeamId, searchQuery, user]);

  const currentFiles = useMemo(() => {
    if (!user) return [];
    return files
      .filter(f => !f.deleted)
      .filter(f => {
        // Se está visualizando uma equipe (sem pasta específica)
        if (selectedTeamId && !currentFolderId) {
          return f.team_id === selectedTeamId && !f.folder_id;
        }
        // Filtro normal por pasta
        return f.folder_id === currentFolderId;
      })
      .filter(f => {
        // Se está na raiz (Meu Drive), mostrar apenas arquivos sem team_id
        if (currentFolderId === null && !selectedTeamId) {
          return !f.team_id && f.owner === user.email;
        }
        // Se está dentro de uma pasta, mostrar apenas se tiver acesso
        return hasAccessToFile(f);
      })
      .filter(f => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [files, currentFolderId, selectedTeamId, searchQuery, user]);

  // Handlers
  const logTeamActivity = async (teamId, actionType, itemName, itemId) => {
    if (teamId && user) {
      try {
        await base44.entities.TeamActivity.create({
          team_id: teamId,
          user_email: user.email,
          action_type: actionType,
          item_name: itemName,
          item_id: itemId,
        });
      } catch (error) {
        console.error('Erro ao registrar atividade:', error);
      }
    }
  };

  const handleRefreshClick = () => {
    queryClient.invalidateQueries({ queryKey: ['folders'] });
    queryClient.invalidateQueries({ queryKey: ['files'] });
    queryClient.invalidateQueries({ queryKey: ['teams'] });
  };

  const handleCreateFolder = async (name, color) => {
    if (!user) return;
    try {
      let folderColor = color;
      let teamId = selectedTeamId || null;
      
      if (currentFolderId) {
        const parentFolder = folders.find(f => f.id === currentFolderId);
        
        // Herdar cor
        if (parentFolder && parentFolder.color && !color) {
          folderColor = parentFolder.color;
        }
        
        // Herdar team_id
        teamId = getFolderTeam(currentFolderId);
      }
      
      const newFolder = await createFolderMutation.mutateAsync({
        name,
        parent_id: currentFolderId,
        team_id: teamId,
        color: folderColor,
        order: currentFolders.length,
        owner: user.email,
      });
      
      await logTeamActivity(teamId, 'create_folder', name, newFolder.id);
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

    // Herdar team_id da pasta pai ou usar selectedTeamId
    const teamId = selectedTeamId || getFolderTeam(currentFolderId);

    try {
      const newFile = await createFileMutation.mutateAsync({
        name,
        type,
        folder_id: currentFolderId,
        team_id: teamId,
        content: defaultContent[type] || '',
        order: currentFiles.length,
        owner: user.email,
      });
      
      await logTeamActivity(teamId, 'create_file', name, newFile.id);
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

  const handleRenameFolder = async (folder) => {
    const newName = prompt('Novo nome:', folder.name);
    if (newName && newName.trim()) {
      await updateFolderMutation.mutateAsync({ id: folder.id, data: { name: newName.trim() } });
      await logTeamActivity(folder.team_id, 'update_folder', newName.trim(), folder.id);
    }
  };

  const handleRenameFile = async (file) => {
    const newName = prompt('Novo nome:', file.name);
    if (newName && newName.trim()) {
      await updateFileMutation.mutateAsync({ id: file.id, data: { name: newName.trim() } });
      await logTeamActivity(file.team_id, 'update_file', newName.trim(), file.id);
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

  const handleMoveFolder = (folder) => {
    setMoveDialog({ open: true, item: folder, type: 'folder' });
  };

  const handleMoveFile = (file) => {
    setMoveDialog({ open: true, item: file, type: 'file' });
  };

  const handleMoveDialogSubmit = async (targetFolderId) => {
    const { item, type } = moveDialog;

    try {
      if (type === 'folder') {
        const teamId = getFolderTeam(targetFolderId);

        await updateFolderMutation.mutateAsync({
          id: item.id,
          data: { 
            parent_id: targetFolderId,
            team_id: teamId
          }
        });

        // Atualizar recursivamente todos os arquivos e subpastas
        const updateChildrenTeam = async (folderId, newTeamId) => {
          const childFolders = folders.filter(f => f.parent_id === folderId);
          const childFiles = files.filter(f => f.folder_id === folderId);

          for (const folder of childFolders) {
            await updateFolderMutation.mutateAsync({
              id: folder.id,
              data: { team_id: newTeamId }
            });
            await updateChildrenTeam(folder.id, newTeamId);
          }

          for (const file of childFiles) {
            await updateFileMutation.mutateAsync({
              id: file.id,
              data: { team_id: newTeamId }
            });
          }
        };

        await updateChildrenTeam(item.id, teamId);

      } else if (type === 'file') {
        const teamId = getFolderTeam(targetFolderId);
        await updateFileMutation.mutateAsync({
          id: item.id,
          data: { 
            folder_id: targetFolderId,
            team_id: teamId
          }
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['folders'] });
      await queryClient.invalidateQueries({ queryKey: ['files'] });

    } catch (error) {
      console.error('Erro ao mover item:', error);
      alert('Erro ao mover item: ' + error.message);
    }
  };

    const handleConfirmMove = async () => {
      if (!moveConfirmDialog.data) return;
      const { type, item, targetFolderId } = moveConfirmDialog.data;
      
      try {
        if (type === 'folder') {
          const teamId = getFolderTeam(targetFolderId);
          
          // Atualizar a pasta
          await updateFolderMutation.mutateAsync({
            id: item.id,
            data: { 
              parent_id: targetFolderId,
              team_id: teamId
            }
          });
          
          // Atualizar recursivamente todos os arquivos e subpastas
          const updateChildrenTeam = async (folderId, newTeamId) => {
            const childFolders = folders.filter(f => f.parent_id === folderId);
            const childFiles = files.filter(f => f.folder_id === folderId);
            
            for (const folder of childFolders) {
              await updateFolderMutation.mutateAsync({
                id: folder.id,
                data: { team_id: newTeamId }
              });
              await updateChildrenTeam(folder.id, newTeamId);
            }
            
            for (const file of childFiles) {
              await updateFileMutation.mutateAsync({
                id: file.id,
                data: { team_id: newTeamId }
              });
            }
          };
          
          await updateChildrenTeam(item.id, teamId);
          
        } else if (type === 'file') {
          const teamId = getFolderTeam(targetFolderId);
          await updateFileMutation.mutateAsync({
            id: item.id,
            data: { 
              folder_id: targetFolderId,
              team_id: teamId
            }
          });
        }
        
        // Invalidar queries para atualizar a UI
        await queryClient.invalidateQueries({ queryKey: ['folders'] });
        await queryClient.invalidateQueries({ queryKey: ['files'] });
        
      } catch (error) {
        console.error('Erro ao mover item:', error);
        alert('Erro ao mover item: ' + error.message);
      } finally {
        setMoveConfirmDialog({ open: false, data: null });
      }
    };



  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId, type } = result;

    // Handle drops into folders (both sidebar and grid)
    if (destination.droppableId.startsWith('folder-') || destination.droppableId.startsWith('sidebar-folder-') || destination.droppableId.startsWith('sidebar-file-')) {
      const targetFolderId = destination.droppableId
        .replace('folder-', '')
        .replace('sidebar-folder-', '')
        .replace('sidebar-file-', '');
      const finalFolderId = targetFolderId === 'root' ? null : targetFolderId;

      if (type === 'FOLDER') {
        const folder = folders.find(f => f.id === draggableId);
        if (folder && folder.parent_id !== finalFolderId) {
          const targetFolder = finalFolderId ? folders.find(f => f.id === finalFolderId) : null;
          setMoveConfirmDialog({
            open: true,
            data: {
              type: 'folder',
              item: folder,
              targetFolderId: finalFolderId,
              targetFolderName: targetFolder ? targetFolder.name : 'Meu Drive'
            }
          });
        }
      } else if (type === 'FILE') {
        const file = files.find(f => f.id === draggableId);
        if (file && file.folder_id !== finalFolderId) {
          const targetFolder = finalFolderId ? folders.find(f => f.id === finalFolderId) : null;
          setMoveConfirmDialog({
            open: true,
            data: {
              type: 'file',
              item: file,
              targetFolderId: finalFolderId,
              targetFolderName: targetFolder ? targetFolder.name : 'Meu Drive'
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

    const folderId = targetFolderId || currentFolderId;
    const teamId = getFolderTeam(folderId);

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
          team_id: teamId,
          file_url: file_url,
          order: currentFiles.length + successCount,
          owner: user.email,
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

  const isLoading = foldersLoading || filesLoading || teamsLoading || !user;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Toolbar
          onNewFolder={() => setCreateDialog({ open: true, type: 'folder' })}
          onNewFile={handleNewFile}
          onNewTeam={() => setTeamDialog({ open: true, team: null })}
          onUpload={() => setUploadDialog(true)}
          onImport={() => setImportDialog(true)}
          onExportAll={handleExportAll}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onRefresh={handleRefreshClick}
          />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          folders={folders}
          teams={userTeams}
          currentFolderId={currentFolderId}
          selectedTeamId={selectedTeamId}
          onFolderSelect={(folderId) => {
            setCurrentFolderId(folderId);
            const params = new URLSearchParams(window.location.search);
            if (folderId) {
              params.set('folder', folderId);
              params.delete('team');
              window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
            } else if (selectedTeamId) {
              params.delete('folder');
              params.set('team', selectedTeamId);
              window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
            } else {
              window.history.pushState({}, '', window.location.pathname);
            }
            if (folderId === null) {
              setSelectedTeamId(null);
            }
          }}
          onTeamSelect={(teamId) => {
            setSelectedTeamId(teamId);
            setCurrentFolderId(null);
          }}
          onTeamEdit={(team) => setTeamDialog({ open: true, team })}
          isOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          currentUserEmail={user?.email}
        />
        
        <div 
          className="flex-1 flex flex-col overflow-hidden"
          onDragOver={handleExternalDragOver}
          onDrop={(e) => handleExternalDrop(e, currentFolderId)}
        >
          <Breadcrumb 
            path={breadcrumbPath} 
            onNavigate={(folderId, teamId) => {
              if (teamId) {
                setSelectedTeamId(teamId);
                setCurrentFolderId(null);
              } else {
                setCurrentFolderId(folderId);
                if (folderId === null) {
                  setSelectedTeamId(null);
                }
              }
            }} 
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
            onFolderClick={(folderId) => {
              setCurrentFolderId(folderId);
              setSelectedTeamId(null);
              window.history.pushState({}, '', createPageUrl(`Drive?folder=${folderId}`));
            }}
            onFileClick={handleFileClick}
            onFolderDelete={handleDeleteFolder}
            onFolderRename={handleRenameFolder}
            onFolderExport={handleExportFolder}
            onFolderColorChange={(folder, color) => updateFolderMutation.mutate({ id: folder.id, data: { color } })}
            onFolderMove={handleMoveFolder}
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
            onFileMove={handleMoveFile}
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
                              onClick={() => {
                                setCurrentFolderId(folder.id);
                                setSelectedTeamId(null);
                                window.history.pushState({}, '', createPageUrl(`Drive?folder=${folder.id}`));
                              }}
                              onDelete={() => handleDeleteFolder(folder)}
                              onRename={() => handleRenameFolder(folder)}
                              onExport={() => handleExportFolder(folder)}
                              onColorChange={(folder, color) => updateFolderMutation.mutate({ id: folder.id, data: { color } })}
                              onMove={() => handleMoveFolder(folder)}
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
                              onMove={() => handleMoveFile(file)}
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

      {/* Team Dialog */}
      <TeamDialog
        open={teamDialog.open}
        onOpenChange={(open) => setTeamDialog({ ...teamDialog, open })}
        team={teamDialog.team}
        currentUserEmail={user?.email}
      />

      {/* AI Assistant */}
      <AIAssistant 
        currentFolderId={currentFolderId}
        currentPage="Drive"
      />

      {/* Toast Container */}
      <Toaster />

      {/* Move Confirmation Dialog (Drag and Drop) */}
      <AlertDialog open={moveConfirmDialog.open} onOpenChange={(open) => !open && setMoveConfirmDialog({ open: false, data: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar movimentação</AlertDialogTitle>
            <AlertDialogDescription>
              {moveConfirmDialog.data && (
                <>
                  Deseja mover {moveConfirmDialog.data.type === 'folder' ? 'a pasta' : 'o arquivo'}{' '}
                  <strong>"{moveConfirmDialog.data.item?.name}"</strong> para{' '}
                  <strong>"{moveConfirmDialog.data.targetFolderName}"</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmMove}>Sim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move Dialog (Menu Option) */}
      <MoveDialog
        open={moveDialog.open}
        onOpenChange={(open) => setMoveDialog({ ...moveDialog, open })}
        item={moveDialog.item}
        itemType={moveDialog.type}
        folders={folders}
        teams={userTeams}
        currentUserEmail={user?.email}
        onMove={handleMoveDialogSubmit}
      />
      </div>
      </DragDropContext>
      );
      }