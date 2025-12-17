import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Folder, ChevronRight, ChevronDown, Home } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";

const folderColors = {
  default: 'text-gray-500',
  blue: 'text-blue-500',
  green: 'text-green-500',
  orange: 'text-orange-500',
  purple: 'text-purple-500',
  red: 'text-red-500',
};

function FolderTreeItem({ folder, folders, level, selectedId, onSelect, expandedFolders, onToggleExpand, currentItemId }) {
  const children = folders.filter(f => f.parent_id === folder.id && f.id !== currentItemId);
  const hasChildren = children.length > 0;
  const isExpanded = expandedFolders.has(folder.id);
  const isSelected = selectedId === folder.id;
  const isDisabled = folder.id === currentItemId;

  return (
    <>
      <button
        onClick={() => !isDisabled && onSelect(folder.id)}
        disabled={isDisabled}
        className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 transition-colors text-sm ${
          isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(folder.id);
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
          {children.map(child => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              folders={folders}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              expandedFolders={expandedFolders}
              onToggleExpand={onToggleExpand}
              currentItemId={currentItemId}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default function MoveDialog({ open, onOpenChange, item, itemType, folders, teams, currentUserEmail, onMove }) {
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  const toggleExpand = (folderId) => {
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
    return folders.filter(f => !f.deleted && !f.team_id && f.owner === currentUserEmail);
  }, [folders, currentUserEmail]);

  const userTeams = useMemo(() => {
    if (!teams) return [];
    return teams.filter(t => t.members && t.members.includes(currentUserEmail));
  }, [teams, currentUserEmail]);

  const getTeamFolders = (teamId) => {
    return folders.filter(f => !f.deleted && f.team_id === teamId);
  };

  const handleMove = () => {
    onMove(selectedFolderId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Mover {itemType === 'folder' ? 'pasta' : 'arquivo'}: {item?.name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px] border rounded-lg">
          <div className="p-2">
            {/* Meu Drive */}
            <button
              onClick={() => setSelectedFolderId(null)}
              className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 transition-colors text-sm ${
                selectedFolderId === null ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
              }`}
            >
              <Home className="w-4 h-4 text-gray-500" />
              <span className="truncate flex-1 text-left">Meu Drive</span>
            </button>

            {myDriveFolders.filter(f => f.parent_id === null).map(folder => (
              <FolderTreeItem
                key={folder.id}
                folder={folder}
                folders={myDriveFolders}
                level={0}
                selectedId={selectedFolderId}
                onSelect={setSelectedFolderId}
                expandedFolders={expandedFolders}
                onToggleExpand={toggleExpand}
                currentItemId={item?.id}
              />
            ))}

            {/* Equipes */}
            {userTeams.length > 0 && (
              <>
                <div className="px-3 py-2 mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wide border-t">
                  Equipes
                </div>
                {userTeams.map(team => {
                  const teamFolders = getTeamFolders(team.id);
                  const rootTeamFolders = teamFolders.filter(f => f.parent_id === null);
                  
                  return (
                    <div key={team.id} className="mt-2">
                      <div className="px-3 py-1 text-xs font-medium text-gray-600">
                        {team.name}
                      </div>
                      {rootTeamFolders.map(folder => (
                        <FolderTreeItem
                          key={folder.id}
                          folder={folder}
                          folders={teamFolders}
                          level={0}
                          selectedId={selectedFolderId}
                          onSelect={setSelectedFolderId}
                          expandedFolders={expandedFolders}
                          onToggleExpand={toggleExpand}
                          currentItemId={item?.id}
                        />
                      ))}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleMove}>
            Mover para {selectedFolderId === null ? 'Meu Drive' : 'pasta selecionada'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}