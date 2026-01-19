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
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  // Don't show layout for file viewer
  if (currentPageName === 'FileViewer') {
    return <>{children}</>;
  }

  // Don't show layout for Wiki pages
  if (currentPageName === 'Wiki' || currentPageName === 'WikiDev') {
    return <>{children}</>;
  }

  return (
    <Base44Init>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Dark Mode Toggle - Fixed position */}
        <div className="fixed bottom-4 left-4 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleDarkMode}
            className="rounded-full shadow-lg bg-white dark:bg-gray-800"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>

        {/* Main Content */}
        <main>
          {children}
        </main>
      </div>
    </Base44Init>
  );
}