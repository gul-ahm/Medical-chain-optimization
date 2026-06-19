'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Boxes,
  BarChart3,
  Warehouse,
  Bot,
  ShieldCheck,
  FlaskConical,
  Bell,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  section?: string;
}

const navItems: NavItem[] = [
  { label: 'Medical Control Tower', href: '/dashboard', icon: LayoutDashboard, section: 'Operational Intelligence' },
  { label: 'Strategic Operations', href: '/dashboard/strategic', icon: ShieldCheck, section: 'Operational Intelligence' },
  { label: 'Medicine Inventory', href: '/dashboard/inventory', icon: Boxes, section: 'Operational Intelligence' },
  { label: 'Demand Forecasting', href: '/dashboard/forecasting', icon: BarChart3, section: 'Operational Intelligence' },
  { label: 'Supply Redistribution', href: '/dashboard/optimization', icon: Warehouse, section: 'Clinical Logistics' },
  { label: 'Autonomous Logistics', href: '/dashboard/orchestration', icon: Bot, section: 'Clinical Logistics' },
  { label: 'Clinical Governance', href: '/dashboard/global-control-tower', icon: ShieldCheck, section: 'Clinical Logistics' },
  { label: 'Simulation Lab', href: '/dashboard/simulation-lab', icon: FlaskConical, section: 'Intelligence Tools' },
  { label: 'Alerts & Incidents', href: '/dashboard/alerts', icon: Bell, section: 'Intelligence Tools' },
  { label: 'SaaS Administration', href: '/dashboard/admin', icon: Settings, section: 'Platform Admin' },
];

function groupBySection(items: NavItem[]): Record<string, NavItem[]> {
  return items.reduce<Record<string, NavItem[]>>((acc, item) => {
    const section = item.section || 'General';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {});
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const grouped = groupBySection(navItems);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card">
      {/* Logo Section */}
      <div className={cn('flex items-center h-16 px-6 border-b border-border shrink-0 bg-background/50', collapsed ? 'justify-center px-0' : 'gap-3')}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm shrink-0 shadow-lg shadow-primary/20">
          A
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground leading-none">Antigravity</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter mt-1">Intelligence</span>
          </div>
        )}
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-none" aria-label="Main navigation">
        {Object.entries(grouped).map(([section, items]) => (
          <div key={section} className="space-y-2">
            {!collapsed && (
              <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                {section}
              </p>
            )}
            <ul className="space-y-1" role="list">
              {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative',
                        active
                          ? 'bg-primary/10 text-primary shadow-sm'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        collapsed && 'justify-center px-0 w-10 h-10 mx-auto'
                      )}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon className={cn('h-5 w-5 shrink-0 transition-transform group-hover:scale-110', active ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground')} aria-hidden="true" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {active && !collapsed && (
                        <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                      {collapsed && (
                        <div className="sr-only">{item.label}</div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User & Settings Section */}
      <div className="p-4 border-t border-border bg-background/50 space-y-1">
        <Link 
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all",
            collapsed && "justify-center px-0 w-10 h-10 mx-auto"
          )}
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
        <Link 
          href="/dashboard/help"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all",
            collapsed && "justify-center px-0 w-10 h-10 mx-auto"
          )}
        >
          <HelpCircle className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Help Center</span>}
        </Link>
        
        <div className="pt-4 mt-2 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed((prev) => !prev)}
            className={cn("w-full justify-start text-muted-foreground hover:text-foreground", collapsed && "justify-center px-0")}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span className="text-xs">Collapse View</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <div className="fixed top-0 left-0 w-full h-16 flex items-center px-4 bg-background border-b lg:hidden z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="ml-3 flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">A</div>
          <span className="font-bold text-sm">Antigravity</span>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-[70] w-72 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:hidden shadow-2xl',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="navigation"
        aria-label="Mobile navigation"
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex lg:flex-col lg:shrink-0 bg-card border-r border-border transition-all duration-300 ease-in-out z-40',
          collapsed ? 'w-20' : 'w-72'
        )}
        role="navigation"
        aria-label="Desktop navigation"
      >
        {sidebarContent}
      </aside>
    </>
  );
}
