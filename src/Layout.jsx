import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  HardDrive, LayoutGrid, GanttChart, Calendar, 
  Settings, Search, Bell, User, Menu
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { name: 'Drive', icon: HardDrive, page: 'Drive' },
];

export default function Layout({ children, currentPageName }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Don't show layout for file viewer
  if (currentPageName === 'FileViewer') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="p-4 border-b">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <HardDrive className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="font-bold text-gray-900">keeping</h1>
                      <p className="text-xs text-gray-500">Gestão de Arquivos</p>
                    </div>
                  </div>
                </div>
                <nav className="p-4 space-y-1">
                  {navItems.map(item => (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.page)}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        currentPageName === item.page
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
            
            <Link to={createPageUrl('Drive')} className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-gray-900 leading-tight">keeping</h1>
                <p className="text-xs text-gray-500">Gestão de Arquivos</p>
              </div>
            </Link>
          </div>

          {/* Center - Navigation (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.name}
                to={createPageUrl(item.page)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentPageName === item.page
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-gray-500">
              <Bell className="w-5 h-5" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}