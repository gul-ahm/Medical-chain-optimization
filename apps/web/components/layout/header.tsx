'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Search,
  Settings,
  Sun,
  Moon,
  User,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const routeLabels: Record<string, string> = {
  '/dashboard': 'Executive Command Center',
  '/dashboard/executive': 'Executive Command Center',
  '/dashboard/inventory': 'Inventory Intelligence',
  '/dashboard/forecasting': 'Forecasting Intelligence',
  '/dashboard/optimization': 'Warehouse Optimization',
  '/dashboard/orchestration': 'Agent Orchestration',
  '/dashboard/governance': 'Governance',
  '/dashboard/simulations': 'Simulations',
  '/dashboard/alerts': 'Alerts',
};

function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const currentLabel = routeLabels[pathname] || segments[segments.length - 1] || 'Dashboard';

  return (
    <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
      <span className="font-medium text-foreground">Platform</span>
      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="text-muted-foreground truncate max-w-[200px]">{currentLabel}</span>
    </nav>
  );
}

function SearchBar() {
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative hidden sm:block">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        placeholder="Search..."
        className={cn(
          'h-9 w-64 rounded-md border border-input bg-background pl-9 pr-12 text-sm',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'transition-colors'
        )}
        aria-label="Search platform"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      />
      <kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
        <span className="text-xs">⌘</span>K
      </kbd>
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="h-9 w-9" disabled><Sun className="h-4 w-4" /></Button>;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 transition-transform" />
      ) : (
        <Moon className="h-4 w-4 transition-transform" />
      )}
    </Button>
  );
}

function NotificationButton() {
  const [hasUnread] = React.useState(true);

  return (
    <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="View notifications">
      <Bell className="h-4 w-4" />
      {hasUnread && (
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-status-critical ring-2 ring-background" />
      )}
    </Button>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors outline-none',
            'hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          )}
          aria-label="User menu"
        >
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-sm">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
          </div>
          <div className="hidden lg:flex flex-col items-start text-left">
            <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
              {user?.email || 'Operator'}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              {user?.roles?.[0] || 'system_admin'}
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.email || 'operator@scai.io'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.roles?.join(', ') || 'system_admin'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-destructive focus:bg-destructive/10 cursor-pointer"
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SystemStatus() {
  return (
    <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-md bg-status-positive/10 text-status-positive text-xs font-medium">
      <span className="h-1.5 w-1.5 rounded-full bg-status-positive animate-pulse" />
      All Systems Operational
    </div>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-4">
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-2">
        <SearchBar />
        <SystemStatus />
        <NotificationButton />
        <ThemeToggle />
        <div className="hidden sm:block h-6 w-px bg-border mx-1" />
        <UserMenu />
      </div>
    </header>
  );
}
