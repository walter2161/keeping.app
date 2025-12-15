import React, { useMemo } from 'react';
import { Folder, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";

const folderColors = {
  default: 'text-gray-500',
  blue: 'text-blue-500',
  green: 'text-green-500',
  orange: 'text-orange-500',
  purple: 'text-purple-500',
  red: 'text-red-500',
};

function FolderTreeItem({ folder, level, isExpanded, onToggle, onSelect, currentFolderId, children }) {
  const hasChildren = children && children.length > 0;
  const isActive = currentFolderId === folder.id;

  return (
    <div>
      <button
        onClick={() => {
          onSelect(folder.id);
          if (hasChildren) onToggle(folder.id);
        }}
        className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 transition-colors text-sm ${
          isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
        }`}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(folder.id);
            }}
            className="flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-4" />}
        <Folder 
          className={`w-4 h-4 flex-shrink-0 ${folderColors[folder.color] || folderColors.default}`}
          fill="currentColor"
        />
        <span className="truncate flex-1 text-left">{folder.name}</span>
      </button>
      {hasChildren && isExpanded && (
        <div>
          {children}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ folders, currentFolderId, onFolderSelect, isOpen }) {
  const [expandedFolders, setExpandedFolders] = React.useState(new Set());

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const folderTree = useMemo(() => {
    const buildTree = (parentId = null, level = 0) => {
      return folders
        .filter(f => f.parent_id === parentId)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(folder => {
          const children = buildTree(folder.id, level + 1);
          return (
            <FolderTreeItem
              key={folder.id}
              folder={folder}
              level={level}
              isExpanded={expandedFolders.has(folder.id)}
              onToggle={toggleFolder}
              onSelect={onFolderSelect}
              currentFolderId={currentFolderId}
              children={children}
            />
          );
        });
    };
    return buildTree();
  }, [folders, expandedFolders, currentFolderId]);

  if (!isOpen) return null;

  return (
    <div className="w-64 bg-white border-r overflow-y-auto flex-shrink-0">
      <div className="p-4 border-b">
        <button
          onClick={() => onFolderSelect(null)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
            currentFolderId === null ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
          }`}
        >
          <Folder className="w-5 h-5" />
          <span className="font-medium">Todos os Arquivos</span>
        </button>
      </div>
      <div className="py-2">
        {folderTree}
      </div>
    </div>
  );
}