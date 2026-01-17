import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Terminal as TerminalIcon, HelpCircle } from 'lucide-react';

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
          await createFolderMutation.mutateAsync({
            name: args[0],
            parent_id: currentFolderId,
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
          await createFileMutation.mutateAsync({
            name: args[0],
            folder_id: currentFolderId,
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
          
          const targetFile = findFileByName(args[0], currentFolderId);
          const targetFolder = findFolderByName(args[0], currentFolderId);

          if (targetFile) {
            await deleteFileMutation.mutateAsync(targetFile.id);
            addToHistory(input, `File deleted: ${args[0]}`);
          } else if (targetFolder && isRecursive) {
            await deleteFolderMutation.mutateAsync(targetFolder.id);
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
          const targetFile = findFileByName(args[0], currentFolderId);
          const targetFolder = findFolderByName(args[0], currentFolderId);

          if (targetFile) {
            await updateFileMutation.mutateAsync({
              id: targetFile.id,
              data: { name: args[1] }
            });
            addToHistory(input, `File renamed: ${args[0]} → ${args[1]}`);
          } else if (targetFolder) {
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
            addToHistory(input, 'Usage: echo "content" > <file_name>', true);
            break;
          }
          const content = args.slice(0, -2).join(' ');
          const fileName = args[args.length - 1];
          const currentFolderId = currentPath === '/' ? null : currentPath;
          const targetFile = findFileByName(fileName, currentFolderId);

          if (targetFile) {
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
      executeCommand(currentInput.trim());
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
        <button
          onClick={() => setShowDocs(!showDocs)}
          className="flex items-center gap-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          {showDocs ? 'Hide Docs' : 'Show Docs'}
        </button>
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
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent outline-none text-white"
              placeholder="Type a command..."
              autoComplete="off"
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
  ls, dir           List files and folders in current directory
  pwd               Print current directory path
  cd <folder>       Change directory
  cd ..             Go to parent directory
  cd                Go to root directory

File Operations:
  touch <name> [type]    Create new file (types: docx, xlsx, pptx, kbn, gnt, crn, flux, pdf, img, video, other)
  cat <file>             Display file content
  echo "text" > <file>   Write content to file
  rm <name>              Delete file
  rm -r <name>           Delete folder recursively
  mv <old> <new>         Rename file or folder

Folder Operations:
  mkdir <name>      Create new folder

Search & Info:
  find <pattern>    Search for files/folders by name
  tree              Display directory tree structure
  count             Count files and folders in current directory

Utility:
  help              Show this help message
  docs              Open full documentation
  clear             Clear terminal screen

Examples:
  mkdir projects
  cd projects
  touch report docx
  echo "Hello World" > report
  cat report
  tree
`;

function Documentation() {
  return (
    <div className="space-y-6 text-green-400">
      <div>
        <h2 className="text-xl font-bold text-cyan-400 mb-2">📚 Keeping Terminal - Complete Documentation</h2>
        <p className="text-gray-400 text-xs">For AI Assistants (Manus, NotebookLM, etc.)</p>
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
          <div>
            <h4 className="font-bold text-white">ls / dir</h4>
            <p className="text-gray-400">List all items in current directory</p>
            <code className="text-cyan-400 block mt-1">ls</code>
          </div>

          <div>
            <h4 className="font-bold text-white">cd &lt;folder_name&gt;</h4>
            <p className="text-gray-400">Navigate to a folder. Use ".." for parent, no args for root</p>
            <code className="text-cyan-400 block mt-1">cd projects</code>
            <code className="text-cyan-400 block mt-1">cd ..</code>
          </div>

          <div>
            <h4 className="font-bold text-white">mkdir &lt;folder_name&gt;</h4>
            <p className="text-gray-400">Create a new folder in current directory</p>
            <code className="text-cyan-400 block mt-1">mkdir "My Projects"</code>
          </div>

          <div>
            <h4 className="font-bold text-white">touch &lt;file_name&gt; [type]</h4>
            <p className="text-gray-400">Create a new file. Type defaults to 'other'</p>
            <code className="text-cyan-400 block mt-1">touch report docx</code>
            <code className="text-cyan-400 block mt-1">touch budget xlsx</code>
          </div>

          <div>
            <h4 className="font-bold text-white">cat &lt;file_name&gt;</h4>
            <p className="text-gray-400">Display file content</p>
            <code className="text-cyan-400 block mt-1">cat report</code>
          </div>

          <div>
            <h4 className="font-bold text-white">echo "content" &gt; &lt;file_name&gt;</h4>
            <p className="text-gray-400">Write content to an existing file</p>
            <code className="text-cyan-400 block mt-1">echo "Project notes" &gt; report</code>
          </div>

          <div>
            <h4 className="font-bold text-white">mv &lt;old_name&gt; &lt;new_name&gt;</h4>
            <p className="text-gray-400">Rename a file or folder</p>
            <code className="text-cyan-400 block mt-1">mv oldname newname</code>
          </div>

          <div>
            <h4 className="font-bold text-white">rm &lt;name&gt; [-r]</h4>
            <p className="text-gray-400">Delete a file. Use -r flag for folders</p>
            <code className="text-cyan-400 block mt-1">rm report</code>
            <code className="text-cyan-400 block mt-1">rm -r projects</code>
          </div>

          <div>
            <h4 className="font-bold text-white">find &lt;pattern&gt;</h4>
            <p className="text-gray-400">Search for files/folders by name (case-insensitive)</p>
            <code className="text-cyan-400 block mt-1">find report</code>
          </div>

          <div>
            <h4 className="font-bold text-white">tree</h4>
            <p className="text-gray-400">Display full directory tree from current location</p>
            <code className="text-cyan-400 block mt-1">tree</code>
          </div>

          <div>
            <h4 className="font-bold text-white">count</h4>
            <p className="text-gray-400">Count files and folders in current directory</p>
            <code className="text-cyan-400 block mt-1">count</code>
          </div>

          <div>
            <h4 className="font-bold text-white">pwd</h4>
            <p className="text-gray-400">Print current working directory path</p>
            <code className="text-cyan-400 block mt-1">pwd</code>
          </div>

          <div>
            <h4 className="font-bold text-white">clear</h4>
            <p className="text-gray-400">Clear terminal screen</p>
            <code className="text-cyan-400 block mt-1">clear</code>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-yellow-400 mb-2">💡 Usage Examples for AIs</h3>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-white font-bold">Example 1: Create project structure</p>
            <pre className="text-cyan-400 mt-1 bg-black p-2 rounded">
mkdir "2024 Projects"
cd "2024 Projects"
mkdir Reports
mkdir Data
cd Reports
touch summary docx
touch analysis xlsx
            </pre>
          </div>

          <div>
            <p className="text-white font-bold">Example 2: Organize files</p>
            <pre className="text-cyan-400 mt-1 bg-black p-2 rounded">
cd /
mkdir Archive
find old
cd Documents
mv oldfile Archive
            </pre>
          </div>

          <div>
            <p className="text-white font-bold">Example 3: Batch operations</p>
            <pre className="text-cyan-400 mt-1 bg-black p-2 rounded">
tree
count
find .xlsx
cd Data
ls
            </pre>
          </div>
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