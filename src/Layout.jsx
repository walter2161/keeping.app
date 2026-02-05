import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  HardDrive, Settings, User, Moon, Sun
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Base44Init from '@/components/Base44Init';

export default function Layout({ children, currentPageName }) {
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Don't show layout for file viewer
  if (currentPageName === 'FileViewer') {
    return <>{children}</>;
  }

  // Don't show layout for Wiki pages
  if (currentPageName === 'Wiki' || currentPageName === 'WikiDev' || currentPageName === 'Desktop') {
    return <>{children}</>;
  }

  return (
    <Base44Init>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main>
          {children}
        </main>
      </div>
    </Base44Init>
  );
}
