import React, { useMemo } from 'react';
import { Folder, ChevronRight, ChevronDown, PanelLeftClose, LayoutDashboard, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Droppable } from '@hello-pangea/dnd';

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
    <Droppable droppableId={`sidebar-folder-${folder.id}`} type="FOLDER">
      {(provided, snapshot) => (
        <div ref={provided.innerRef} {...provided.droppableProps}>
          <button
            onClick={() => {
              onSelect(folder.id);
              if (hasChildren) onToggle(folder.id);
            }}
            className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 transition-colors text-sm ${
              isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
            } ${snapshot.isDraggingOver ? 'bg-blue-100 border-2 border-blue-400' : ''}`}
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
          <div style={{ display: 'none' }}>{provided.placeholder}</div>
          {hasChildren && isExpanded && (
            <div>
              {children}
            </div>
          )}
        </div>
      )}
    </Droppable>
  );
}

export default function Sidebar({ folders, currentFolderId, onFolderSelect, isOpen, onToggleSidebar, currentUserEmail, viewFilter }) {
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

  const myDriveFolders = useMemo(() => {
    const buildTree = (parentId = null, level = 0) => {
      return folders
        .filter(f => !f.deleted)
        .filter(f => f.owner === currentUserEmail)
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
  }, [folders, expandedFolders, currentFolderId, currentUserEmail]);

  const sharedFolders = useMemo(() => {
    const buildTree = (parentId = null, level = 0) => {
      return folders
        .filter(f => !f.deleted)
        .filter(f => f.owner !== currentUserEmail && f.shared_with && f.shared_with.includes(currentUserEmail))
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
  }, [folders, expandedFolders, currentFolderId, currentUserEmail]);

  if (!isOpen) return null;

  return (
    <div className="w-64 bg-white border-r overflow-y-auto flex-shrink-0">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <Link to={createPageUrl('Dashboard')} className="flex-1">
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700">
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium text-base">Dashboard</span>
            </button>
          </Link>
          <Button 
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="h-8 w-8 flex-shrink-0 ml-2"
          >
            <PanelLeftClose className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="py-2">
        {/* Meu Drive Section */}
        <div className="mb-4">
          <Link to={createPageUrl('Drive?view=myDrive')}>
            <Droppable droppableId="sidebar-folder-root" type="FOLDER">
              {(provided, snapshot) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  <button
                    onClick={() => onFolderSelect(null)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 transition-colors text-sm ${
                      currentFolderId === null && viewFilter === 'myDrive' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    } ${snapshot.isDraggingOver ? 'bg-blue-100 border-2 border-blue-400' : ''}`}
                  >
                    <Folder className="w-4 h-4 text-gray-500" fill="currentColor" />
                    <span className="truncate flex-1 text-left">Meu Drive</span>
                  </button>
                  <div style={{ display: 'none' }}>{provided.placeholder}</div>
                </div>
              )}
            </Droppable>
          </Link>
          {myDriveFolders}
        </div>

        {/* Compartilhado comigo Section */}
        <div>
          <Link to={createPageUrl('Drive?view=shared')}>
            <button
              onClick={() => onFolderSelect(null)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 transition-colors text-sm ${
                currentFolderId === null && viewFilter === 'shared' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
              }`}
            >
              <Users className="w-4 h-4 text-gray-500" />
              <span className="truncate flex-1 text-left">Compart. comigo</span>
            </button>
          </Link>
          {sharedFolders}
        </div>
      </div>
    </div>
  );
}