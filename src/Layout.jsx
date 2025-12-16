import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  HardDrive, Settings, User
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
      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}