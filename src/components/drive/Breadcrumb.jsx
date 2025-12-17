import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumb({ path, onNavigate }) {
  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-gray-50 border-b overflow-x-auto">
      <button
        onClick={() => onNavigate(null)}
        className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-900"
      >
        <Home className="w-4 h-4" />
        <span className="text-sm font-medium">Meu Drive</span>
      </button>

      {path.map((folder, index) => (
        <React.Fragment key={folder.id}>
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <button
            onClick={() => onNavigate(folder.id)}
            className={`px-2 py-1 rounded-md transition-colors text-sm font-medium truncate max-w-[200px] ${
              index === path.length - 1 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            }`}
          >
            {folder.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}