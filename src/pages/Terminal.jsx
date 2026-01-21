import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Terminal as TerminalIcon, HelpCircle, X, Copy, Check } from 'lucide-react';
import { useSyncData } from '../components/sync/useSyncData';

export default function Terminal() {
  const [history, setHistory] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentPath, setCurrentPath] = useState('/');
  const [showDocs, setShowDocs] = useState(false);
  const inputRef = useRef(null);
  const terminalRef = useRef(null);
  const queryClient = useQueryClient();
  
  // SYNC DIRECTIVE: Real-time synchronization with database
  useSyncData();

  const { data: folders = [] } = useQuery({
    queryKey: ['folders'],
    queryFn: () => base44.entities.Folder.list(),
  });

  const { data: files = [] } = useQuery({
    queryKey: ['files'],
    queryFn: () => base44.entities.File.list(),
  });

  const createFolderMutation = useMutation({
    mutationFn: (data) => base44.entities.Folder.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['folders'] }),
  });

  const createFileMutation = useMutation({
    mutationFn: (data) => base44.entities.File.create(data),
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

  const deleteFolderMutation = useMutation({
    mutationFn: (id) => base44.entities.Folder.update(id, { deleted: true, deleted_at: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['folders'] }),
  });

  const deleteFileMutation = useMutation({
    mutationFn: (id) => base44.entities.File.update(id, { deleted: true, deleted_at: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files'] }),
  });

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addToHistory = (command, output, error = false) => {
    setHistory(prev => [...prev, { command, output, error, timestamp: new Date() }]);
  };

  const getCurrentFolder = () => {
    if (currentPath === '/') return null;
    return folders.find(f => f.id === currentPath && !f.deleted);
  };

  const getItemsInCurrentPath = () => {
    const currentFolderId = currentPath === '/' ? null : currentPath;
    const foldersInPath = folders.filter(f => f.parent_id === currentFolderId && !f.deleted);
    const filesInPath = files.filter(f => f.folder_id === currentFolderId && !f.deleted);
    return { folders: foldersInPath, files: filesInPath };
  };

  const findFolderByName = (name, parentId = null) => {
    return folders.find(f => f.name === name && f.parent_id === parentId && !f.deleted);
  };

  const findFileByName = (name, folderId = null) => {
    return files.find(f => f.name === name && f.folder_id === folderId && !f.deleted);
  };

  const parseCommand = (input) => {
    const parts = input.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    return parts.map(p => p.replace(/^"(.*)"$/, '$1'));
  };

  const executeCommand = async (input) => {
    const parts = parseCommand(input);
    const cmd = parts[0]?.toLowerCase();
    const args = parts.slice(1);

    setCommandHistory(prev => [...prev, input]);
    setHistoryIndex(-1);

    try {
      switch (cmd) {
        case 'help':
          addToHistory(input, HELP_TEXT);
          break;

        case 'docs':
          setShowDocs(true);
          addToHistory(input, 'Opening full documentation...');
          break;

        case 'clear':
          setHistory([]);
          break;

        case 'macro':
        case 'script': {
          if (!args[0]) {
            addToHistory(input, 'Usage: macro "<cmd1>; <cmd2>; <cmd3>" OR paste multi-line commands', true);
            break;
          }
          const scriptContent = args.join(' ');
          const commands = scriptContent.split(';').map(c => c.trim()).filter(c => c);
          
          addToHistory(input, `Executing ${commands.length} commands...`);
          
          for (const singleCmd of commands) {
            await executeCommand(singleCmd);
            // Small delay to allow UI updates
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          addToHistory('', `✓ Macro completed: ${commands.length} commands executed`);
          break;
        }

        case 'ls':
        case 'dir': {
          const { folders: foldersHere, files: filesHere } = getItemsInCurrentPath();
          let output = '';
          if (foldersHere.length === 0 && filesHere.length === 0) {
            output = 'Empty directory';
          } else {
            if (foldersHere.length > 0) {
              output += 'FOLDERS:\n';
              foldersHere.forEach(f => {
                output += `  📁 ${f.name}\n`;
              });
            }
            if (filesHere.length > 0) {
              output += '\nFILES:\n';
              filesHere.forEach(f => {
                const icon = getFileIcon(f.type);
                output += `  ${icon} ${f.name}.${f.type}\n`;
              });
            }
          }
          addToHistory(input, output);
          break;
        }

        case 'pwd':
          const current = getCurrentFolder();
          addToHistory(input, current ? `/${current.name}` : '/');
          break;

        case 'cd': {
          if (!args[0]) {
            setCurrentPath('/');
            addToHistory(input, 'Changed to root directory');
          } else if (args[0] === '..' || args[0] === '../') {
            const current = getCurrentFolder();
            if (current) {
              setCurrentPath(current.parent_id || '/');
              addToHistory(input, 'Changed to parent directory');
            } else {
              addToHistory(input, 'Already at root', true);
            }
          } else {
            const currentFolderId = currentPath === '/' ? null : currentPath;
            const targetFolder = findFolderByName(args[0], currentFolderId);
            if (targetFolder) {
              setCurrentPath(targetFolder.id);
              addToHistory(input, `Changed to /${targetFolder.name}`);
            } else {
              addToHistory(input, `Folder not found: ${args[0]}`, true);
            }
          }
          break;
        }

        case 'mkdir': {
          if (!args[0]) {
            addToHistory(input, 'Usage: mkdir <folder_name>', true);
            break;
          }
          const currentFolderId = currentPath === '/' ? null : currentPath;
          const user = await base44.auth.me();
          
          // Check for duplicate name
          const existingFolder = folders.find(f => f.name === args[0] && f.parent_id === currentFolderId && !f.deleted);
          if (existingFolder) {
            addToHistory(input, `Folder already exists: ${args[0]}`, true);
            break;
          }
          
          // Get team_id from parent folder
          let team_id = null;
          if (currentFolderId) {
            const parentFolder = folders.find(f => f.id === currentFolderId);
            if (parentFolder) {
              team_id = parentFolder.team_id;
              // Check team permissions
              if (team_id) {
                const { data: teams } = await base44.entities.Team.list();
                const team = teams?.find(t => t.id === team_id);
                if (team && !team.members.includes(user.email) && team.owner !== user.email) {
                  addToHistory(input, 'Permission denied: Not a team member', true);
                  break;
                }
              }
            }
          }
          
          await createFolderMutation.mutateAsync({
            name: args[0],
            parent_id: currentFolderId,
            team_id,
            owner: user.email,
            deleted: false
          });
          addToHistory(input, `Folder created: ${args[0]}`);
          break;
        }

        case 'touch': {
          if (!args[0]) {
            addToHistory(input, 'Usage: touch <file_name> [type]', true);
            break;
          }
          const currentFolderId = currentPath === '/' ? null : currentPath;
          const user = await base44.auth.me();
          const fileType = args[1] || 'other';
          
          // Check for duplicate name
          const existingFile = files.find(f => f.name === args[0] && f.folder_id === currentFolderId && !f.deleted);
          if (existingFile) {
            addToHistory(input, `File already exists: ${args[0]}`, true);
            break;
          }
          
          // Get team_id from parent folder
          let team_id = null;
          if (currentFolderId) {
            const parentFolder = folders.find(f => f.id === currentFolderId);
            if (parentFolder) {
              team_id = parentFolder.team_id;
              // Check team permissions
              if (team_id) {
                const { data: teams } = await base44.entities.Team.list();
                const team = teams?.find(t => t.id === team_id);
                if (team && !team.members.includes(user.email) && team.owner !== user.email) {
                  addToHistory(input, 'Permission denied: Not a team member', true);
                  break;
                }
              }
            }
          }
          
          await createFileMutation.mutateAsync({
            name: args[0],
            folder_id: currentFolderId,
            team_id,
            type: fileType,
            owner: user.email,
            deleted: false
          });
          addToHistory(input, `File created: ${args[0]}.${fileType}`);
          break;
        }

        case 'rm': {
          if (!args[0]) {
            addToHistory(input, 'Usage: rm <name> [-r for folders]', true);
            break;
          }
          const currentFolderId = currentPath === '/' ? null : currentPath;
          const isRecursive = args.includes('-r');
          const user = await base44.auth.me();
          
          const targetFile = findFileByName(args[0], currentFolderId);
          const targetFolder = findFolderByName(args[0], currentFolderId);

          if (targetFile) {
            // Check ownership or team membership
            if (targetFile.owner !== user.email && targetFile.team_id) {
              const { data: teams } = await base44.entities.Team.list();
              const team = teams?.find(t => t.id === targetFile.team_id);
              if (team && !team.members.includes(user.email) && team.owner !== user.email) {
                addToHistory(input, 'Permission denied: Not the owner', true);
                break;
              }
            } else if (targetFile.owner !== user.email) {
              addToHistory(input, 'Permission denied: Not the owner', true);
              break;
            }
            
            await updateFileMutation.mutateAsync({
              id: targetFile.id,
              data: { 
                deleted: true, 
                deleted_at: new Date().toISOString(),
                original_folder_id: targetFile.folder_id
              }
            });
            addToHistory(input, `File deleted: ${args[0]}`);
          } else if (targetFolder && isRecursive) {
            // Check ownership or team membership
            if (targetFolder.owner !== user.email && targetFolder.team_id) {
              const { data: teams } = await base44.entities.Team.list();
              const team = teams?.find(t => t.id === targetFolder.team_id);
              if (team && !team.members.includes(user.email) && team.owner !== user.email) {
                addToHistory(input, 'Permission denied: Not the owner', true);
                break;
              }
            } else if (targetFolder.owner !== user.email) {
              addToHistory(input, 'Permission denied: Not the owner', true);
              break;
            }
            
            await updateFolderMutation.mutateAsync({
              id: targetFolder.id,
              data: { 
                deleted: true, 
                deleted_at: new Date().toISOString(),
                original_parent_id: targetFolder.parent_id
              }
            });
            addToHistory(input, `Folder deleted: ${args[0]}`);
          } else if (targetFolder && !isRecursive) {
            addToHistory(input, 'Use -r flag to delete folders', true);
          } else {
            addToHistory(input, `Not found: ${args[0]}`, true);
          }
          break;
        }

        case 'mv': {
          if (args.length < 2) {
            addToHistory(input, 'Usage: mv <source> <new_name>', true);
            break;
          }
          const currentFolderId = currentPath === '/' ? null : currentPath;
          const user = await base44.auth.me();
          const targetFile = findFileByName(args[0], currentFolderId);
          const targetFolder = findFolderByName(args[0], currentFolderId);

          if (targetFile) {
            // Check ownership
            if (targetFile.owner !== user.email) {
              addToHistory(input, 'Permission denied: Not the owner', true);
              break;
            }
            // Check duplicate
            const existingFile = files.find(f => f.name === args[1] && f.folder_id === currentFolderId && !f.deleted && f.id !== targetFile.id);
            if (existingFile) {
              addToHistory(input, `File with name "${args[1]}" already exists`, true);
              break;
            }
            await updateFileMutation.mutateAsync({
              id: targetFile.id,
              data: { name: args[1] }
            });
            addToHistory(input, `File renamed: ${args[0]} → ${args[1]}`);
          } else if (targetFolder) {
            // Check ownership
            if (targetFolder.owner !== user.email) {
              addToHistory(input, 'Permission denied: Not the owner', true);
              break;
            }
            // Check duplicate
            const existingFolder = folders.find(f => f.name === args[1] && f.parent_id === currentFolderId && !f.deleted && f.id !== targetFolder.id);
            if (existingFolder) {
              addToHistory(input, `Folder with name "${args[1]}" already exists`, true);
              break;
            }
            await updateFolderMutation.mutateAsync({
              id: targetFolder.id,
              data: { name: args[1] }
            });
            addToHistory(input, `Folder renamed: ${args[0]} → ${args[1]}`);
          } else {
            addToHistory(input, `Not found: ${args[0]}`, true);
          }
          break;
        }

        case 'cat': {
          if (!args[0]) {
            addToHistory(input, 'Usage: cat <file_name>', true);
            break;
          }
          const currentFolderId = currentPath === '/' ? null : currentPath;
          const targetFile = findFileByName(args[0], currentFolderId);
          
          if (targetFile) {
            const content = targetFile.content || '(empty file)';
            addToHistory(input, `Content of ${args[0]}:\n${content}`);
          } else {
            addToHistory(input, `File not found: ${args[0]}`, true);
          }
          break;
        }

        case 'echo': {
          if (args.length < 3 || args[args.length - 2] !== '>') {
            addToHistory(input, 'Usage: echo "content" > <file_name> OR paste full JSON', true);
            break;
          }
          const content = args.slice(0, -2).join(' ');
          const fileName = args[args.length - 1];
          const currentFolderId = currentPath === '/' ? null : currentPath;
          const targetFile = findFileByName(fileName, currentFolderId);

          if (targetFile) {
            // Se for JSON, validar
            if (targetFile.type !== 'docx' && targetFile.type !== 'xlsx') {
              try {
                JSON.parse(content); // Valida JSON
              } catch (e) {
                addToHistory(input, `Invalid JSON: ${e.message}`, true);
                break;
              }
            }
            
            await updateFileMutation.mutateAsync({
              id: targetFile.id,
              data: { content }
            });
            addToHistory(input, `Content written to: ${fileName}`);
          } else {
            addToHistory(input, `File not found: ${fileName}. Use 'touch' to create it first.`, true);
          }
          break;
        }

        case 'find': {
          if (!args[0]) {
            addToHistory(input, 'Usage: find <name_pattern>', true);
            break;
          }
          const pattern = args[0].toLowerCase();
          const matchingFolders = folders.filter(f => f.name.toLowerCase().includes(pattern) && !f.deleted);
          const matchingFiles = files.filter(f => f.name.toLowerCase().includes(pattern) && !f.deleted);
          
          let output = '';
          if (matchingFolders.length > 0) {
            output += 'FOLDERS:\n';
            matchingFolders.forEach(f => output += `  📁 ${f.name}\n`);
          }
          if (matchingFiles.length > 0) {
            output += '\nFILES:\n';
            matchingFiles.forEach(f => output += `  ${getFileIcon(f.type)} ${f.name}.${f.type}\n`);
          }
          if (!output) {
            output = 'No matches found';
          }
          addToHistory(input, output);
          break;
        }

        case 'tree': {
          const buildTree = (parentId = null, prefix = '') => {
            const foldersHere = folders.filter(f => f.parent_id === parentId && !f.deleted);
            const filesHere = files.filter(f => f.folder_id === parentId && !f.deleted);
            let output = '';

            foldersHere.forEach((folder, idx) => {
              const isLast = idx === foldersHere.length - 1 && filesHere.length === 0;
              output += `${prefix}${isLast ? '└── ' : '├── '}📁 ${folder.name}\n`;
              output += buildTree(folder.id, prefix + (isLast ? '    ' : '│   '));
            });

            filesHere.forEach((file, idx) => {
              const isLast = idx === filesHere.length - 1;
              output += `${prefix}${isLast ? '└── ' : '├── '}${getFileIcon(file.type)} ${file.name}.${file.type}\n`;
            });

            return output;
          };

          const currentFolderId = currentPath === '/' ? null : currentPath;
          const current = getCurrentFolder();
          let output = current ? `${current.name}/\n` : '/\n';
          output += buildTree(currentFolderId);
          addToHistory(input, output || 'Empty');
          break;
        }

        case 'count': {
          const { folders: foldersHere, files: filesHere } = getItemsInCurrentPath();
          addToHistory(input, `Folders: ${foldersHere.length}\nFiles: ${filesHere.length}\nTotal: ${foldersHere.length + filesHere.length}`);
          break;
        }

        // === KANBAN COMMANDS ===
        case 'kanban-add-list': {
          if (args.length < 2) {
            addToHistory(input, 'Usage: kanban-add-list <file_name> <list_title>', true);
            break;
          }
          const currentFolderId = currentPath === '/' ? null : currentPath;
          const targetFile = findFileByName(args[0], currentFolderId);
          if (!targetFile || targetFile.type !== 'kbn') {
            addToHistory(input, 'File not found or not a kanban file', true);
            break;
          }
          const content = targetFile.content ? JSON.parse(targetFile.content) : { lists: [] };
          const listTitle = args.slice(1).join(' ');
          content.lists.push({ id: Date.now().toString(), title: listTitle, cards: [] });
          await updateFileMutation.mutateAsync({
            id: targetFile.id,
            data: { content: JSON.stringify(content) }
          });
          addToHistory(input, `List "${listTitle}" added to ${args[0]}`);
          break;
        }

        case 'kanban-add-card': {
          if (args.length < 3) {
            addToHistory(input, 'Usage: kanban-add-card <file_name> <list_id> <card_title> [description] [priority:low|medium|high]', true);
            break;
          }
          const currentFolderId = currentPath === '/' ? null : currentPath;
          const targetFile = findFileByName(args[0], currentFolderId);
          if (!targetFile || targetFile.type !== 'kbn') {
            addToHistory(input, 'File not found or not a kanban file', true);
            break;
          }
          const content = JSON.parse(targetFile.content || '{"lists":[]}');
          const listId = args[1];
          const list = content.lists.find(l => l.id === listId);
          if (!list) {
            addToHistory(input, `List ${listId} not found`, true);
            break;
          }
          const cardTitle = args[2];
          const description = args[3] || '';
          const priority = args[4]?.split(':')[1] || 'medium';
          list.cards.push({
            id: Date.now().toString(),
            title: cardTitle,
            description,
            priority,
            labels: [],
            assignees: []
          });
          await updateFileMutation.mutateAsync({
            id: targetFile.id,
            data: { content: JSON.stringify(content) }
          });
          addToHistory(input, `Card "${cardTitle}" added to list ${listId}`);
          break;
        }

        case 'kanban-list': {
          if (!args[0]) {
            addToHistory(input, 'Usage: kanban-list <file_name>', true);
            break;
          }
          const currentFolderId = currentPath === '/' ? null : currentPath;
          const targetFile = findFileByName(args[0], currentFolderId);
          if (!targetFile || targetFile.type !== 'kbn') {
            addToHistory(input, 'File not found or not a kanban file', true);
            break;
          }
          const content = JSON.parse(targetFile.content || '{"lists":[]}');
          let output = `Kanban: ${targetFile.name}\n`;
          content.lists.forEach(list => {
            output += `\nList: ${list.title} (ID: ${list.id})\n`;
            list.cards.forEach(card => {
              output += `  - ${card.title} [${card.priority}]\n`;
            });
          });
          addToHistory(input, output || 'Empty kanban');
          break;
        }

        // === GANTT/CRONOGRAMA COMMANDS ===
        case 'gantt-add-task': {
          if (args.length < 5) {
            addToHistory(input, 'Usage: gantt-add-task <file_name> <task_name> <start_date> <end_date> <progress_percent>', true);
            break;
          }
          const currentFolderId = currentPath === '/' ? null : currentPath;
          const targetFile = findFileByName(args[0], currentFolderId);
          if (!targetFile || (targetFile.type !== 'gnt' && targetFile.type !== 'crn')) {
            addToHistory(input, 'File not found or not a gantt/cronograma file', true);
            break;
          }
          const content = targetFile.content ? JSON.parse(targetFile.content) : { tasks: [] };
          content.tasks.push({
            id: Date.now().toString(),
            name: args[1],
            start: args[2],
            end: args[3],
            progress: parseInt(args[4]),
            dependencies: []
          });
          await updateFileMutation.mutateAsync({
            id: targetFile.id,
            data: { content: JSON.stringify(content) }
          });
          addToHistory(input, `Task "${args[1]}" added`);
          break;
        }

        case 'gantt-add-milestone': {
          if (args.length < 3) {
            addToHistory(input, 'Usage: gantt-add-milestone <file_name> <milestone_name> <date>', true);
            break;
          }
          const currentFolderId = currentPath === '/' ? null : currentPath;
          const targetFile = findFileByName(args[0], currentFolderId);
          if (!targetFile || (targetFile.type !== 'gnt' && targetFile.type !== 'crn')) {
            addToHistory(input, 'File not found or not a gantt/cronograma file', true);
            break;
          }
          const content = JSON.parse(targetFile.content || '{"tasks":[],"milestones":[]}');
          if (!content.milestones) content.milestones = [];
          content.milestones.push({
            id: Date.now().toString(),
            name: args[1],
            date: args[2]
          });
          await updateFileMutation.mutateAsync({
            id: targetFile.id,
            data: { content: JSON.stringify(content) }
          });
          addToHistory(input, `Milestone "${args[1]}" added`);
          break;
        }

        case 'gantt-list': {
          if (!args[0]) {
            addToHistory(input, 'Usage: gantt-list <file_name>', true);
            break;
          }
          const currentFolderId = currentPath === '/' ? null : currentPath;
          const targetFile = findFileByName(args[0], currentFolderId);
          if (!targetFile || (targetFile.type !== 'gnt' && targetFile.type !== 'crn')) {
            addToHistory(input, 'File not found or not a gantt/cronograma file', true);
            break;
          }
          const content = JSON.parse(targetFile.content || '{"tasks":[]}');
          let output = `Gantt: ${targetFile.name}\n\nTasks:\n`;
          (content.tasks || []).forEach(t => {
            output += `  - ${t.name}: ${t.start} → ${t.end} (${t.progress}%)\n`;
          });
          if (content.milestones) {
            output += '\nMilestones:\n';
            content.milestones.forEach(m => {
              output += `  🎯 ${m.name}: ${m.date}\n`;
            });
          }
          addToHistory(input, output);
          break;
        }

        // === AI IMAGE GENERATION ===
        case 'ai-gen-image': {
          if (args.length < 1) {
            addToHistory(input, 'Usage: ai-gen-image "<prompt>"', true);
            break;
          }
          const prompt = args.join(' ');
          addToHistory(input, 'Generating image with AI...');
          
          try {
            const encodedPrompt = encodeURIComponent(prompt);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&model=flux&nologo=true&enhance=true`;
            addToHistory('', `✓ Image generated: ${imageUrl}\nUse this URL in your commands!`);
          } catch (error) {
            addToHistory('', `Error generating image: ${error.message}`, true);
          }
          break;
        }

        // === FLUX COMMANDS ===
        case 'flux-add-node': {
          if (args.length < 4) {
            addToHistory(input, 'Usage: flux-add-node <file_name> <node_type> <x> <y> [text|title] [cover_image_url]', true);
            break;
          }
          const currentFolderId = currentPath === '/' ? null : currentPath;
          const targetFile = findFileByName(args[0], currentFolderId);
          if (!targetFile || targetFile.type !== 'flux') {
            addToHistory(input, 'File not found or not a flux file', true);
            break;
          }
          const content = targetFile.content ? JSON.parse(targetFile.content) : { drawflow: { Home: { data: {} } } };
          const nodeId = Date.now().toString();
          const nodeType = args[1];
          const nodeTitle = args[4] || 'Node';
          const coverImage = args[5] || null;
          
          const nodeData = { 
            text: nodeTitle, 
            title: nodeTitle,
            description: '',
            priority: 'medium',
            coverType: coverImage ? 'image' : 'color',
            coverImage: coverImage,
            coverColor: 'blue',
            coverZoom: 100
          };
          
          content.drawflow.Home.data[nodeId] = {
            id: nodeId,
            name: nodeType,
            data: nodeData,
            class: nodeType,
            html: '',
            typenode: false,
            inputs: {},
            outputs: {},
            pos_x: parseInt(args[2]),
            pos_y: parseInt(args[3])
          };
          await updateFileMutation.mutateAsync({
            id: targetFile.id,
            data: { content: JSON.stringify(content) }
          });
          addToHistory(input, `Node ${nodeId} (${nodeType}) added at (${args[2]}, ${args[3]})${coverImage ? ' with cover image' : ''}`);
          break;
        }

        case 'flux-set-cover': {
          if (args.length < 3) {
            addToHistory(input, 'Usage: flux-set-cover <file_name> <node_id> <image_url>', true);
            break;
          }
          const currentFolderId = currentPath === '/' ? null : currentPath;
          const targetFile = findFileByName(args[0], currentFolderId);
          if (!targetFile || targetFile.type !== 'flux') {
            addToHistory(input, 'File not found or not a flux file', true);
            break;
          }
          const content = JSON.parse(targetFile.content);
          const node = content.drawflow.Home.data[args[1]];
          if (!node) {
            addToHistory(input, 'Node not found', true);
            break;
          }
          node.data.coverType = 'image';
          node.data.coverImage = args[2];
          node.data.coverZoom = 100;
          await updateFileMutation.mutateAsync({
            id: targetFile.id,
            data: { content: JSON.stringify(content) }
          });
          addToHistory(input, `Cover image set for node ${args[1]}`);
          break;
        }

        case 'flux-connect': {
          if (args.length < 3) {
            addToHistory(input, 'Usage: flux-connect <file_name> <node_id_from> <node_id_to>', true);
            break;
          }
          const currentFolderId = currentPath === '/' ? null : currentPath;
          const targetFile = findFileByName(args[0], currentFolderId);
          if (!targetFile || targetFile.type !== 'flux') {
            addToHistory(input, 'File not found or not a flux file', true);
            break;
          }
          const content = JSON.parse(targetFile.content);
          const fromNode = content.drawflow.Home.data[args[1]];
          const toNode = content.drawflow.Home.data[args[2]];
          if (!fromNode || !toNode) {
            addToHistory(input, 'Node(s) not found', true);
            break;
          }
          const outputId = 'output_1';
          const inputId = 'input_1';
          if (!fromNode.outputs[outputId]) fromNode.outputs[outputId] = { connections: [] };
          if (!toNode.inputs[inputId]) toNode.inputs[inputId] = { connections: [] };
          fromNode.outputs[outputId].connections.push({ node: args[2], output: inputId });
          toNode.inputs[inputId].connections.push({ node: args[1], input: outputId });
          await updateFileMutation.mutateAsync({
            id: targetFile.id,
            data: { content: JSON.stringify(content) }
          });
          addToHistory(input, `Connected ${args[1]} → ${args[2]}`);
          break;
        }

        case 'flux-list': {
          if (!args[0]) {
            addToHistory(input, 'Usage: flux-list <file_name>', true);
            break;
          }
          const currentFolderId = currentPath === '/' ? null : currentPath;
          const targetFile = findFileByName(args[0], currentFolderId);
          if (!targetFile || targetFile.type !== 'flux') {
            addToHistory(input, 'File not found or not a flux file', true);
            break;
          }
          const content = JSON.parse(targetFile.content || '{"drawflow":{"Home":{"data":{}}}}');
          let output = `FluxMap: ${targetFile.name}\n\nNodes:\n`;
          Object.values(content.drawflow.Home.data).forEach(node => {
            output += `  - ID: ${node.id}, Type: ${node.name}, Pos: (${node.pos_x}, ${node.pos_y})\n`;
          });
          addToHistory(input, output);
          break;
        }

        // === DOCX COMMANDS ===
        case 'docx-add-text': {
          if (args.length < 2) {
            addToHistory(input, 'Usage: docx-add-text <file_name> <text>', true);
            break;
          }
          const currentFolderId = currentPath === '/' ? null : currentPath;
          const targetFile = findFileByName(args[0], currentFolderId);
          if (!targetFile || targetFile.type !== 'docx') {
            addToHistory(input, 'File not found or not a docx file', true);
            break;
          }
          const content = targetFile.content ? JSON.parse(targetFile.content) : { paragraphs: [] };
          const text = args.slice(1).join(' ');
          content.paragraphs.push({ text, style: 'normal' });
          await updateFileMutation.mutateAsync({
            id: targetFile.id,
            data: { content: JSON.stringify(content) }
          });
          addToHistory(input, `Text added to ${args[0]}`);
          break;
        }

        case 'docx-add-heading': {
          if (args.length < 3) {
            addToHistory(input, 'Usage: docx-add-heading <file_name> <level:1-6> <text>', true);
            break;
          }
          const currentFolderId = currentPath === '/' ? null : currentPath;
          const targetFile = findFileByName(args[0], currentFolderId);
          if (!targetFile || targetFile.type !== 'docx') {
            addToHistory(input, 'File not found or not a docx file', true);
            break;
          }
          const content = JSON.parse(targetFile.content || '{"paragraphs":[]}');
          const level = args[1].split(':')[1] || '1';
          const text = args.slice(2).join(' ');
          content.paragraphs.push({ text, style: `heading${level}` });
          await updateFileMutation.mutateAsync({
            id: targetFile.id,
            data: { content: JSON.stringify(content) }
          });
          addToHistory(input, `Heading added to ${args[0]}`);
          break;
        }

        // === XLSX COMMANDS ===
        case 'xlsx-set-cell': {
          if (args.length < 4) {
            addToHistory(input, 'Usage: xlsx-set-cell <file_name> <row> <col> <value>', true);
            break;
          }
          const currentFolderId = currentPath === '/' ? null : currentPath;
          const targetFile = findFileByName(args[0], currentFolderId);
          if (!targetFile || targetFile.type !== 'xlsx') {
            addToHistory(input, 'File not found or not a xlsx file', true);
            break;
          }
          const content = targetFile.content ? JSON.parse(targetFile.content) : { cells: {} };
          const row = parseInt(args[1]);
          const col = parseInt(args[2]);
          const value = args.slice(3).join(' ');
          if (!content.cells) content.cells = {};
          if (!content.cells[row]) content.cells[row] = {};
          content.cells[row][col] = value;
          await updateFileMutation.mutateAsync({
            id: targetFile.id,
            data: { content: JSON.stringify(content) }
          });
          addToHistory(input, `Cell [${row},${col}] set to "${value}"`);
          break;
        }

        case 'xlsx-add-row': {
          if (args.length < 2) {
            addToHistory(input, 'Usage: xlsx-add-row <file_name> <val1> <val2> <val3> ...', true);
            break;
          }
          const currentFolderId = currentPath === '/' ? null : currentPath;
          const targetFile = findFileByName(args[0], currentFolderId);
          if (!targetFile || targetFile.type !== 'xlsx') {
            addToHistory(input, 'File not found or not a xlsx file', true);
            break;
          }
          const content = JSON.parse(targetFile.content || '{"cells":{}}');
          if (!content.cells) content.cells = {};
          const rows = Object.keys(content.cells).map(k => parseInt(k));
          const newRow = rows.length > 0 ? Math.max(...rows) + 1 : 0;
          content.cells[newRow] = {};
          args.slice(1).forEach((val, idx) => {
            content.cells[newRow][idx] = val;
          });
          await updateFileMutation.mutateAsync({
            id: targetFile.id,
            data: { content: JSON.stringify(content) }
          });
          addToHistory(input, `Row ${newRow} added with ${args.length - 1} values`);
          break;
        }

        case 'xlsx-list': {
          if (!args[0]) {
            addToHistory(input, 'Usage: xlsx-list <file_name>', true);
            break;
          }
          const currentFolderId = currentPath === '/' ? null : currentPath;
          const targetFile = findFileByName(args[0], currentFolderId);
          if (!targetFile || targetFile.type !== 'xlsx') {
            addToHistory(input, 'File not found or not a xlsx file', true);
            break;
          }
          const content = JSON.parse(targetFile.content || '{"cells":{}}');
          let output = `Spreadsheet: ${targetFile.name}\n`;
          Object.keys(content.cells || {}).sort((a, b) => parseInt(a) - parseInt(b)).forEach(row => {
            const cols = content.cells[row];
            const values = Object.keys(cols).sort((a, b) => parseInt(a) - parseInt(b)).map(col => cols[col]);
            output += `Row ${row}: ${values.join(' | ')}\n`;
          });
          addToHistory(input, output || 'Empty spreadsheet');
          break;
        }

        // === CRONOGRAMA COMMANDS ===
        case 'crn-add-group': {
          if (args.length < 2) {
            addToHistory(input, 'Usage: crn-add-group <file_name> <group_name> [color]', true);
            break;
          }
          const currentFolderId = currentPath === '/' ? null : currentPath;
          const targetFile = findFileByName(args[0], currentFolderId);
          if (!targetFile || targetFile.type !== 'crn') {
            addToHistory(input, 'File not found or not a cronograma file', true);
            break;
          }
          const content = targetFile.content ? JSON.parse(targetFile.content) : { groups: [] };
          const groupName = args[1];
          const color = args[2] || 'blue';
          content.groups.push({
            id: Date.now().toString(),
            name: groupName,
            color,
            items: []
          });
          await updateFileMutation.mutateAsync({
            id: targetFile.id,
            data: { content: JSON.stringify(content) }
          });
          addToHistory(input, `Group "${groupName}" added`);
          break;
        }

        case 'crn-add-item': {
          if (args.length < 5) {
            addToHistory(input, 'Usage: crn-add-item <file> <group_id> <name> <start> <end> [responsible]', true);
            break;
          }
          const currentFolderId = currentPath === '/' ? null : currentPath;
          const targetFile = findFileByName(args[0], currentFolderId);
          if (!targetFile || targetFile.type !== 'crn') {
            addToHistory(input, 'File not found or not a cronograma file', true);
            break;
          }
          const content = JSON.parse(targetFile.content || '{"groups":[]}');
          const group = content.groups.find(g => g.id === args[1]);
          if (!group) {
            addToHistory(input, `Group ${args[1]} not found`, true);
            break;
          }
          group.items.push({
            id: Date.now().toString(),
            name: args[2],
            start: args[3],
            end: args[4],
            responsible: args[5] || '',
            status: 'not_started'
          });
          await updateFileMutation.mutateAsync({
            id: targetFile.id,
            data: { content: JSON.stringify(content) }
          });
          addToHistory(input, `Item "${args[2]}" added to group`);
          break;
        }

        case 'crn-list': {
          if (!args[0]) {
            addToHistory(input, 'Usage: crn-list <file_name>', true);
            break;
          }
          const currentFolderId = currentPath === '/' ? null : currentPath;
          const targetFile = findFileByName(args[0], currentFolderId);
          if (!targetFile || targetFile.type !== 'crn') {
            addToHistory(input, 'File not found or not a cronograma file', true);
            break;
          }
          const content = JSON.parse(targetFile.content || '{"groups":[]}');
          let output = `Cronograma: ${targetFile.name}\n`;
          content.groups.forEach(group => {
            output += `\nGroup: ${group.name} (ID: ${group.id})\n`;
            group.items.forEach(item => {
              output += `  - ${item.name}: ${item.start} → ${item.end}\n`;
            });
          });
          addToHistory(input, output || 'Empty cronograma');
          break;
        }

        // === PPTX COMMANDS ===
        case 'pptx-add-slide': {
          if (args.length < 2) {
            addToHistory(input, 'Usage: pptx-add-slide <file_name> <title> [content]', true);
            break;
          }
          const currentFolderId = currentPath === '/' ? null : currentPath;
          const targetFile = findFileByName(args[0], currentFolderId);
          if (!targetFile || targetFile.type !== 'pptx') {
            addToHistory(input, 'File not found or not a pptx file', true);
            break;
          }
          const content = targetFile.content ? JSON.parse(targetFile.content) : { slides: [] };
          const title = args[1];
          const slideContent = args.slice(2).join(' ');
          content.slides.push({
            id: Date.now().toString(),
            title,
            content: slideContent,
            layout: 'title-content'
          });
          await updateFileMutation.mutateAsync({
            id: targetFile.id,
            data: { content: JSON.stringify(content) }
          });
          addToHistory(input, `Slide "${title}" added`);
          break;
        }

        case 'pptx-list': {
          if (!args[0]) {
            addToHistory(input, 'Usage: pptx-list <file_name>', true);
            break;
          }
          const currentFolderId = currentPath === '/' ? null : currentPath;
          const targetFile = findFileByName(args[0], currentFolderId);
          if (!targetFile || targetFile.type !== 'pptx') {
            addToHistory(input, 'File not found or not a pptx file', true);
            break;
          }
          const content = JSON.parse(targetFile.content || '{"slides":[]}');
          let output = `Presentation: ${targetFile.name}\n\nSlides:\n`;
          content.slides.forEach((slide, idx) => {
            output += `  ${idx + 1}. ${slide.title}\n`;
          });
          addToHistory(input, output);
          break;
        }

        default:
          addToHistory(input, `Command not found: ${cmd}\nType 'help' for available commands`, true);
      }
    } catch (error) {
      addToHistory(input, `Error: ${error.message}`, true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentInput.trim()) {
      // Check if multi-line input (pasted script)
      const lines = currentInput.trim().split('\n').filter(line => line.trim());
      
      if (lines.length > 1) {
        // Execute as macro
        addToHistory('$ ' + currentInput, `Executing ${lines.length} commands from script...`);
        
        (async () => {
          for (const line of lines) {
            if (line.trim()) {
              await executeCommand(line.trim());
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
          addToHistory('', `✓ Script completed: ${lines.length} commands executed`);
        })();
      } else {
        executeCommand(currentInput.trim());
      }
      
      setCurrentInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentInput('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[newIndex]);
        }
      }
    }
  };

  const getFileIcon = (type) => {
    const icons = {
      docx: '📄',
      xlsx: '📊',
      pptx: '📽️',
      kbn: '📋',
      gnt: '📅',
      crn: '⏱️',
      flux: '🔀',
      pdf: '📕',
      img: '🖼️',
      video: '🎬',
      other: '📎'
    };
    return icons[type] || '📎';
  };

  return (
    <div className="h-screen bg-black text-green-400 font-mono flex flex-col">
      <div className="bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-5 h-5" />
          <span className="font-bold">Keeping Terminal v1.0</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDocs(!showDocs)}
            className="flex items-center gap-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            {showDocs ? 'Hide Docs' : 'Show Docs'}
          </button>
          <Link to={createPageUrl('Drive')}>
            <button className="flex items-center gap-2 px-3 py-1 bg-red-900 hover:bg-red-800 rounded text-sm transition-colors">
              <X className="w-4 h-4" />
              Exit
            </button>
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        <div className={`flex-1 flex flex-col ${showDocs ? 'w-1/2' : 'w-full'}`}>
          <div ref={terminalRef} className="flex-1 overflow-y-auto p-4 space-y-2">
            <div className="text-cyan-400">
              Keeping Terminal v1.0 - AI Command Interface
            </div>
            <div className="text-gray-500 text-sm">
              Type 'help' for available commands or 'docs' for full documentation
            </div>
            <div className="h-2" />

            {history.map((entry, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400">$</span>
                  <span className="text-white">{entry.command}</span>
                </div>
                <pre className={`pl-4 whitespace-pre-wrap ${entry.error ? 'text-red-400' : 'text-green-400'}`}>
                  {entry.output}
                </pre>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-gray-700 p-4 flex items-center gap-2">
            <span className="text-cyan-400">$</span>
            <textarea
              ref={inputRef}
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                } else {
                  handleKeyDown(e);
                }
              }}
              rows={1}
              className="flex-1 bg-transparent outline-none text-white resize-none"
              placeholder="Type a command or paste script... (Shift+Enter for new line)"
              autoComplete="off"
              style={{ minHeight: '24px', maxHeight: '200px' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
              }}
            />
          </form>
        </div>

        {showDocs && (
          <div className="w-1/2 border-l border-gray-700 bg-gray-900 overflow-y-auto p-6 text-sm">
            <Documentation />
          </div>
        )}
      </div>
    </div>
  );
}

const HELP_TEXT = `AVAILABLE COMMANDS:

Navigation:
  ls, dir           List files and folders
  pwd               Print current directory
  cd <folder>       Change directory
  cd ..             Parent directory
  cd                Root directory

Basic File Ops:
  touch <name> [type]    Create file (types: docx, xlsx, pptx, kbn, gnt, crn, flux, psd)
  cat <file>             Display content
  echo "text" > <file>   Write to file
  rm <name>              Delete file
  rm -r <name>           Delete folder
  mv <old> <new>         Rename
  mkdir <name>           Create folder

Automation:
  macro "<cmd1>; <cmd2>"  Execute multiple commands
  (Or paste multi-line script - each line runs automatically)

Search & Info:
  find <pattern>    Search items
  tree              Show tree
  count             Count items

KANBAN:
  kanban-add-list <file> <title>
  kanban-add-card <file> <list_id> <title> [desc] [priority:low|medium|high]
  kanban-list <file>

GANTT:
  gantt-add-task <file> <name> <start> <end> <progress>
  gantt-add-milestone <file> <name> <date>
  gantt-list <file>

CRONOGRAMA:
  crn-add-group <file> <name> [color]
  crn-add-item <file> <group_id> <name> <start> <end> [responsible]
  crn-list <file>

AI IMAGES:
  ai-gen-image "<prompt>"

FLUXMAP:
  flux-add-node <file> <type> <x> <y> [text] [image_url]
  flux-set-cover <file> <node_id> <image_url>
  flux-connect <file> <from_id> <to_id>
  flux-list <file>

DOCX:
  docx-add-text <file> <text>
  docx-add-heading <file> <level:1-6> <text>

XLSX:
  xlsx-set-cell <file> <row> <col> <value>
  xlsx-add-row <file> <val1> <val2> ...
  xlsx-list <file>

PPTX:
  pptx-add-slide <file> <title> [content]
  pptx-list <file>

Utility:
  help, docs, clear
`;

function Documentation() {
  const [copied, setCopied] = useState(false);
  const docRef = useRef(null);

  const copyAllText = () => {
    if (docRef.current) {
      const text = docRef.current.innerText;
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div ref={docRef} className="space-y-6 text-green-400">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-cyan-400 mb-2">📚 Keeping Terminal - Complete Documentation</h2>
          <p className="text-gray-400 text-xs">For AI Assistants (Manus, NotebookLM, etc.)</p>
        </div>
        <button
          onClick={copyAllText}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors text-white"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-400" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy All
            </>
          )}
        </button>
      </div>

      <section>
        <h3 className="text-lg font-bold text-yellow-400 mb-2">🎯 Purpose</h3>
        <p className="text-sm leading-relaxed">
          This terminal provides a command-line interface for managing files and folders in the Keeping system.
          AI assistants can use these commands to perform complex operations on the file structure programmatically.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-yellow-400 mb-2">📂 File System Structure</h3>
        <ul className="space-y-1 text-sm pl-4">
          <li>• Root directory: <code className="text-cyan-400">/</code></li>
          <li>• Folders can be nested (parent-child relationships)</li>
          <li>• Files belong to folders (or root if no folder)</li>
          <li>• Files have types: docx, xlsx, pptx, kbn, gnt, crn, flux, pdf, img, video, other</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-bold text-yellow-400 mb-2">🔧 Command Reference</h3>
        
        <div className="space-y-4 text-sm">
          <h4 className="font-bold text-white text-base mt-4">📂 Basic Navigation & Files</h4>
          <div className="pl-2 space-y-2">
            <div>
              <code className="text-cyan-400">ls / dir</code>
              <p className="text-gray-400 text-xs">List all items in current directory</p>
            </div>
            <div>
              <code className="text-cyan-400">cd &lt;folder&gt;</code>
              <p className="text-gray-400 text-xs">Navigate to folder. Use ".." for parent, no args for root</p>
            </div>
            <div>
              <code className="text-cyan-400">mkdir &lt;name&gt;</code>
              <p className="text-gray-400 text-xs">Create new folder</p>
            </div>
            <div>
              <code className="text-cyan-400">touch &lt;name&gt; [type]</code>
              <p className="text-gray-400 text-xs">Create file (types: docx, xlsx, pptx, kbn, gnt, crn, flux, psd, pdf, img, video)</p>
            </div>
            <div>
              <code className="text-cyan-400">cat &lt;file&gt;</code>
              <p className="text-gray-400 text-xs">Display file content</p>
            </div>
            <div>
              <code className="text-cyan-400">rm &lt;name&gt; [-r]</code>
              <p className="text-gray-400 text-xs">Delete file/folder (use -r for folders)</p>
            </div>
          </div>

          <h4 className="font-bold text-white text-base mt-4">📋 KANBAN Commands</h4>
          <div className="pl-2 space-y-2">
            <div>
              <code className="text-cyan-400">kanban-add-list &lt;file&gt; &lt;title&gt;</code>
              <p className="text-gray-400 text-xs">Add new list to kanban</p>
              <code className="text-green-400 text-xs block mt-1">kanban-add-list tasks "To Do"</code>
            </div>
            <div>
              <code className="text-cyan-400">kanban-add-card &lt;file&gt; &lt;list_id&gt; &lt;title&gt; [desc] [priority:low|medium|high]</code>
              <p className="text-gray-400 text-xs">Add card to list</p>
              <code className="text-green-400 text-xs block mt-1">kanban-add-card tasks 123 "Task 1" "Description" priority:high</code>
            </div>
            <div>
              <code className="text-cyan-400">kanban-list &lt;file&gt;</code>
              <p className="text-gray-400 text-xs">Show all lists and cards</p>
            </div>
          </div>

          <h4 className="font-bold text-white text-base mt-4">📅 GANTT Commands</h4>
          <div className="pl-2 space-y-2">
            <div>
              <code className="text-cyan-400">gantt-add-task &lt;file&gt; &lt;name&gt; &lt;start&gt; &lt;end&gt; &lt;progress&gt;</code>
              <p className="text-gray-400 text-xs">Add task to timeline</p>
              <code className="text-green-400 text-xs block mt-1">gantt-add-task timeline "Design Phase" 2026-01-20 2026-02-20 30</code>
            </div>
            <div>
              <code className="text-cyan-400">gantt-add-milestone &lt;file&gt; &lt;name&gt; &lt;date&gt;</code>
              <p className="text-gray-400 text-xs">Add milestone</p>
              <code className="text-green-400 text-xs block mt-1">gantt-add-milestone timeline "Launch" 2026-03-01</code>
            </div>
            <div>
              <code className="text-cyan-400">gantt-list &lt;file&gt;</code>
              <p className="text-gray-400 text-xs">Show all tasks and milestones</p>
            </div>
          </div>

          <h4 className="font-bold text-white text-base mt-4">⏱️ CRONOGRAMA Commands</h4>
          <div className="pl-2 space-y-2">
            <div>
              <code className="text-cyan-400">crn-add-group &lt;file&gt; &lt;name&gt; [color]</code>
              <p className="text-gray-400 text-xs">Add group (colors: blue, green, purple, orange, red)</p>
              <code className="text-green-400 text-xs block mt-1">crn-add-group schedule "Marketing" purple</code>
            </div>
            <div>
              <code className="text-cyan-400">crn-add-item &lt;file&gt; &lt;group_id&gt; &lt;name&gt; &lt;start&gt; &lt;end&gt; [responsible]</code>
              <p className="text-gray-400 text-xs">Add item to group</p>
              <code className="text-green-400 text-xs block mt-1">crn-add-item schedule 123 "Campaign" 2026-01-20 2026-02-15 "João"</code>
            </div>
            <div>
              <code className="text-cyan-400">crn-list &lt;file&gt;</code>
              <p className="text-gray-400 text-xs">Show all groups and items</p>
            </div>
          </div>

          <h4 className="font-bold text-white text-base mt-4">✨ AI IMAGE GENERATION</h4>
          <div className="pl-2 space-y-2">
            <div>
              <code className="text-cyan-400">ai-gen-image "&lt;prompt&gt;"</code>
              <p className="text-gray-400 text-xs">Generate image with AI (returns URL to use in other commands)</p>
              <code className="text-green-400 text-xs block mt-1">ai-gen-image "modern luxury house exterior sunset"</code>
            </div>
          </div>

          <h4 className="font-bold text-white text-base mt-4">🔀 FLUXMAP Commands</h4>
          <div className="pl-2 space-y-2">
            <div>
              <code className="text-cyan-400">flux-add-node &lt;file&gt; &lt;type&gt; &lt;x&gt; &lt;y&gt; [text] [image_url]</code>
              <p className="text-gray-400 text-xs">Add node with optional cover image (types: sticky-note, card, rectangle, circle, name, text, link)</p>
              <code className="text-green-400 text-xs block mt-1">flux-add-node map card 100 200 "Scene 1" "https://..."</code>
            </div>
            <div>
              <code className="text-cyan-400">flux-set-cover &lt;file&gt; &lt;node_id&gt; &lt;image_url&gt;</code>
              <p className="text-gray-400 text-xs">Set cover image for existing node</p>
              <code className="text-green-400 text-xs block mt-1">flux-set-cover map 12345 "https://..."</code>
            </div>
            <div>
              <code className="text-cyan-400">flux-connect &lt;file&gt; &lt;from_id&gt; &lt;to_id&gt;</code>
              <p className="text-gray-400 text-xs">Connect two nodes</p>
              <code className="text-green-400 text-xs block mt-1">flux-connect map 12345 67890</code>
            </div>
            <div>
              <code className="text-cyan-400">flux-list &lt;file&gt;</code>
              <p className="text-gray-400 text-xs">Show all nodes and their IDs</p>
            </div>
          </div>

          <h4 className="font-bold text-white text-base mt-4">📄 DOCX Commands</h4>
          <div className="pl-2 space-y-2">
            <div>
              <code className="text-cyan-400">docx-add-text &lt;file&gt; &lt;text&gt;</code>
              <p className="text-gray-400 text-xs">Add paragraph</p>
              <code className="text-green-400 text-xs block mt-1">docx-add-text doc "This is a paragraph"</code>
            </div>
            <div>
              <code className="text-cyan-400">docx-add-heading &lt;file&gt; &lt;level:1-6&gt; &lt;text&gt;</code>
              <p className="text-gray-400 text-xs">Add heading</p>
              <code className="text-green-400 text-xs block mt-1">docx-add-heading doc level:1 "Chapter 1"</code>
            </div>
          </div>

          <h4 className="font-bold text-white text-base mt-4">📊 XLSX Commands</h4>
          <div className="pl-2 space-y-2">
            <div>
              <code className="text-cyan-400">xlsx-set-cell &lt;file&gt; &lt;row&gt; &lt;col&gt; &lt;value&gt;</code>
              <p className="text-gray-400 text-xs">Set cell value</p>
              <code className="text-green-400 text-xs block mt-1">xlsx-set-cell budget 0 0 "Income"</code>
            </div>
            <div>
              <code className="text-cyan-400">xlsx-add-row &lt;file&gt; &lt;val1&gt; &lt;val2&gt; ...</code>
              <p className="text-gray-400 text-xs">Add row with values</p>
              <code className="text-green-400 text-xs block mt-1">xlsx-add-row budget "Jan" 1000 2000</code>
            </div>
            <div>
              <code className="text-cyan-400">xlsx-list &lt;file&gt;</code>
              <p className="text-gray-400 text-xs">Display spreadsheet</p>
            </div>
          </div>

          <h4 className="font-bold text-white text-base mt-4">📽️ PPTX Commands</h4>
          <div className="pl-2 space-y-2">
            <div>
              <code className="text-cyan-400">pptx-add-slide &lt;file&gt; &lt;title&gt; [content]</code>
              <p className="text-gray-400 text-xs">Add slide to presentation</p>
              <code className="text-green-400 text-xs block mt-1">pptx-add-slide deck "Introduction" "Welcome to our presentation"</code>
            </div>
            <div>
              <code className="text-cyan-400">pptx-list &lt;file&gt;</code>
              <p className="text-gray-400 text-xs">Show all slides</p>
            </div>
          </div>

          <h4 className="font-bold text-white text-base mt-4">📝 Working with Full JSON Content</h4>
          <div className="pl-2 space-y-2">
            <div>
              <code className="text-cyan-400">echo 'JSON_CONTENT' &gt; &lt;file&gt;</code>
              <p className="text-gray-400 text-xs">Write complete JSON to file (paste full content)</p>
              <code className="text-green-400 text-xs block mt-1">{'echo \'{"lists":[{"id":"1","title":"To Do","cards":[]}]}\' > board'}</code>
            </div>
            <div>
              <p className="text-gray-400 text-xs mt-2">
                💡 You can paste entire JSON structures for Kanban (.kbn), Gantt (.gnt), FluxMap (.flux), etc.
                The terminal validates JSON automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-yellow-400 mb-2">💡 Complete Examples</h3>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-white font-bold">Example 1: Create complete Kanban board</p>
            <pre className="text-cyan-400 mt-1 bg-black p-2 rounded text-xs">
touch project kbn
kanban-add-list project "Backlog"
kanban-add-list project "In Progress"
kanban-add-list project "Done"
kanban-list project
{'{Get list IDs from output}'}
kanban-add-card project 12345 "Design UI" "Create mockups" priority:high
kanban-add-card project 12345 "Setup DB" "Configure database" priority:medium
            </pre>
          </div>

          <div>
            <p className="text-white font-bold">Example 2: Build FluxMap workflow</p>
            <pre className="text-cyan-400 mt-1 bg-black p-2 rounded text-xs">
touch workflow flux
flux-add-node workflow sticky-note 100 100 "Start Here"
flux-add-node workflow rectangle-shape 300 100 "Process Step"
flux-add-node workflow circle-shape 500 100 "Decision"
flux-list workflow
{'{Get node IDs}'}
flux-connect workflow 12345 67890
flux-connect workflow 67890 11111
            </pre>
          </div>

          <div>
            <p className="text-white font-bold">Example 3: Create Gantt timeline</p>
            <pre className="text-cyan-400 mt-1 bg-black p-2 rounded text-xs">
touch schedule gnt
gantt-add-task schedule "Research" 2026-01-20 2026-02-01 50
gantt-add-task schedule "Development" 2026-02-01 2026-03-15 25
gantt-add-milestone schedule "Beta Release" 2026-03-15
gantt-list schedule
            </pre>
          </div>

          <div>
            <p className="text-white font-bold">Example 4: Build complete document</p>
            <pre className="text-cyan-400 mt-1 bg-black p-2 rounded text-xs">
touch report docx
docx-add-heading report level:1 "Project Report"
docx-add-heading report level:2 "Executive Summary"
docx-add-text report "This project demonstrates..."
docx-add-heading report level:2 "Methodology"
docx-add-text report "We used the following approach..."
            </pre>
          </div>

          <div>
            <p className="text-white font-bold">Example 5: Create spreadsheet with data</p>
            <pre className="text-cyan-400 mt-1 bg-black p-2 rounded text-xs">
touch budget xlsx
xlsx-add-row budget "Month" "Income" "Expenses" "Profit"
xlsx-add-row budget "January" 5000 3000 2000
xlsx-add-row budget "February" 6000 3500 2500
xlsx-list budget
            </pre>
          </div>

          <div>
            <p className="text-white font-bold">Example 6: Create presentation</p>
            <pre className="text-cyan-400 mt-1 bg-black p-2 rounded text-xs">
touch pitch pptx
pptx-add-slide pitch "Company Overview" "We are a leading provider of..."
pptx-add-slide pitch "Market Analysis" "The market size is growing..."
pptx-add-slide pitch "Financial Projections" "Revenue forecast for next 3 years"
pptx-list pitch
            </pre>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-yellow-400 mb-2">🚀 Macros & Scripts</h3>
        <div className="space-y-2 text-sm pl-4">
          <p className="text-gray-300">Execute multiple commands at once:</p>
          <div className="bg-black p-3 rounded">
            <p className="text-white font-bold mb-1">Method 1: Using macro command</p>
            <code className="text-cyan-400 block">macro "mkdir project; cd project; touch tasks kbn; touch docs docx"</code>
          </div>
          <div className="bg-black p-3 rounded mt-2">
            <p className="text-white font-bold mb-1">Method 2: Paste multi-line script</p>
            <code className="text-cyan-400 block">
              mkdir project<br/>
              cd project<br/>
              touch tasks kbn<br/>
              touch docs docx<br/>
              kanban-add-list tasks "To Do"
            </code>
            <p className="text-gray-400 text-xs mt-1">Just paste and press Enter - each line runs automatically!</p>
          </div>
          <p className="text-green-400 mt-2">💡 Use Shift+Enter to add new lines before executing</p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-yellow-400 mb-2">⚠️ Important Notes</h3>
        <ul className="space-y-1 text-sm pl-4">
          <li>• Commands are case-insensitive</li>
          <li>• Use quotes for names with spaces: <code className="text-cyan-400">mkdir "My Folder"</code></li>
          <li>• File extensions are added automatically based on type</li>
          <li>• Deleted items go to trash (deleted flag set)</li>
          <li>• Navigation is relative to current directory</li>
          <li>• Use arrow keys ↑↓ to navigate command history</li>
          <li>• Shift+Enter adds new line, Enter executes command</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-bold text-yellow-400 mb-2">🤖 AI Assistant Guidelines</h3>
        <ul className="space-y-1 text-sm pl-4">
          <li>• Always check current location with <code className="text-cyan-400">pwd</code></li>
          <li>• List contents with <code className="text-cyan-400">ls</code> before operations</li>
          <li>• Use <code className="text-cyan-400">tree</code> to understand structure</li>
          <li>• Create folders before files when building hierarchy</li>
          <li>• Use descriptive names for better organization</li>
          <li>• Test commands with <code className="text-cyan-400">ls</code> after execution</li>
        </ul>
      </section>

      <section className="border-t border-gray-700 pt-4 mt-4">
        <p className="text-xs text-gray-500">
          Keeping Terminal v1.0 | Designed for AI-driven file management | All operations are real-time
        </p>
      </section>
    </div>
  );
}