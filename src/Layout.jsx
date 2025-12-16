import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  HardDrive, Settings, Bell, User, BookOpen
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Layout({ children, currentPageName }) {
  // Don't show layout for file viewer
  if (currentPageName === 'FileViewer') {
    return <>{children}</>;
  }

  // Don't show layout for Wiki pages
  if (currentPageName === 'Wiki' || currentPageName === 'WikiDev') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-end gap-2">
        <Link to={createPageUrl('Wiki')}>
          <Button variant="ghost" size="icon">
            <BookOpen className="w-5 h-5" />
          </Button>
        </Link>
        <Button variant="ghost" size="icon">
          <Bell className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}