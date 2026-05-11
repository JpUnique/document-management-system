import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useDocuments } from '@/context/DocumentContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, FolderClosed, Tag, Settings, PlusCircle, ChevronRight, ChevronDown, 
  Users, Bell, BookMarked, Star, Home, Menu, X
} from 'lucide-react';
import { BRANDING, getLogoUrl } from '@/config/branding';

const Sidebar = () => {
  const location = useLocation();
  const { currentUser } = useAuth();
  const { folders, tags } = useDocuments();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['root']);

  // Get root level folders
  const rootFolders = folders.filter(folder => folder.parentId === null && folder.id !== 'root');
  
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId) 
        : [...prev, folderId]
    );
  };
  
  // Sidebar item component
  const NavItem = ({ 
    to, 
    icon: Icon, 
    label, 
    count 
  }: { 
    to: string, 
    icon: React.ElementType, 
    label: string,
    count?: number
  }) => {
    const isActive = location.pathname === to;
    
    return (
      <Link 
        to={to} 
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
          isActive 
            ? "bg-primary/10 text-primary font-medium" 
            : "hover:bg-primary/5 text-muted-foreground hover:text-primary"
        )}
      >
        <Icon size={18} />
        <span className="flex-1">{label}</span>
        {count !== undefined && (
          <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
            {count}
          </span>
        )}
      </Link>
    );
  };
  
  // Recursive folder rendering
  const renderFolders = (parentId: string | null, depth = 0) => {
    const filteredFolders = folders.filter(folder => folder.parentId === parentId && folder.id !== 'root');
    
    return filteredFolders.map(folder => {
      const isExpanded = expandedFolders.includes(folder.id);
      const hasChildren = folders.some(f => f.parentId === folder.id);
      
      return (
        <div key={folder.id} className={cn("pl-[7px]", depth > 0 && "ml-4")}>
          <div 
            className="flex items-center gap-1 py-1 rounded-sm cursor-pointer text-sm group"
            onClick={() => toggleFolder(folder.id)}
          >
            <button className="p-1 hover:bg-primary/10 rounded">
              {hasChildren ? (
                isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
              ) : (
                <span className="w-[14px]" />
              )}
            </button>
            <Link 
              to={`/folders/${folder.id}`} 
              className="flex items-center gap-2 flex-1 px-2 py-1 rounded hover:bg-primary/5"
              onClick={(e) => e.stopPropagation()}
            >
              <FolderClosed size={16} className="text-amber-500" />
              <span className="truncate">{folder.name}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {folder.documents.length}
              </span>
            </Link>
          </div>
          
          {isExpanded && renderFolders(folder.id, depth + 1)}
        </div>
      );
    });
  };

  // Tags section
  const renderTags = () => {
    return tags.map(tag => (
      <Link 
        key={tag.id} 
        to={`/tag/${tag.id}`}
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-primary/5"
      >
        <div 
          className="h-3 w-3 rounded-full" 
          style={{ backgroundColor: tag.color }} 
        />
        <span className="truncate">{tag.name}</span>
      </Link>
    ));
  };
  
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header with logo */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src="/assets/images/logo.png" alt="DocManager Logo" className="h-8 w-8" />
          <span className="font-bold text-lg text-primary">DocManager</span>
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden" 
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          <X size={18} />
        </Button>
      </div>
      
      <Separator />
      
      {/* New document button */}
      <div className="px-4 py-3">
        <Button className="w-full flex gap-2" asChild>
          <Link to="/documents/new">
            <PlusCircle size={16} />
            <span>New Document</span>
          </Link>
        </Button>
      </div>
      
      {/* Sidebar navigation */}
      <ScrollArea className="flex-1 px-2 py-2">
        <div className="space-y-1 pb-2">
          <NavItem to="/" icon={Home} label="Dashboard" />
          <NavItem to="/documents" icon={FileText} label="All Documents" />
          <NavItem to="/starred" icon={Star} label="Starred" />
          <NavItem to="/recent" icon={BookMarked} label="Recent" />
          {currentUser?.role === 'admin' && (
            <NavItem to="/users" icon={Users} label="User Management" />
          )}
          {/* License Management - Temporarily hidden */}
          {/* {currentUser?.id === 'admin-1' && (
            <NavItem to="/admin/licenses" icon={Settings} label="License Management" />
          )} */}
        </div>
        
        <div className="mt-6">
          <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground">
            FOLDERS
          </div>
          {/* Root folder */}
          <Link 
            to="/folders/root" 
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-primary/5"
          >
            <FolderClosed size={16} className="text-amber-500" />
            <span>All Documents</span>
          </Link>
          
          {/* User folders */}
          {renderFolders(null)}
        </div>
        
        <div className="mt-6">
          <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground flex items-center justify-between">
            <span>TAGS</span>
            <Link 
              to="/tags/manage" 
              className="text-primary hover:underline text-xs"
            >
              Manage
            </Link>
          </div>
          {renderTags()}
        </div>
      </ScrollArea>
      
      {/* User section */}
      {currentUser && (
        <div className="mt-auto px-4 py-3 border-t">
          <Link
            to="/profile"
            className="flex items-center gap-3 p-2 rounded-md hover:bg-primary/5"
          >
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="font-medium text-primary">
                {currentUser.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );

  // Mobile menu button
  const mobileMenuButton = (
    <Button 
      variant="ghost" 
      size="icon" 
      className="md:hidden fixed top-4 left-4 z-50 bg-background shadow-sm"
      onClick={() => setIsMobileSidebarOpen(true)}
    >
      <Menu size={18} />
    </Button>
  );

  return (
    <>
      {/* Mobile menu button */}
      {!isMobileSidebarOpen && mobileMenuButton}
      
      {/* Mobile sidebar */}
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-black/50 md:hidden",
          isMobileSidebarOpen ? "block" : "hidden"
        )}
        onClick={() => setIsMobileSidebarOpen(false)}
      />
      
      {/* Sidebar for both mobile and desktop */}
      <aside 
        className={cn(
          "bg-background border-r w-full max-w-[250px] h-full flex-col z-50",
          "transition-all duration-300 ease-in-out",
          // Mobile styles
          "fixed top-0 bottom-0 left-0 md:static",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;