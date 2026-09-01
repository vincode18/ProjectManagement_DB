'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  CalendarDays,
  Folder,
  FolderKanban,
  LineChart,
  KanbanSquare,
  ClipboardList,
  Table2,
  ChevronDown
} from 'lucide-react';
import { cn } from './utils';

const topNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays }
];

const projectNavItems = [
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/gantt', label: 'Gantt Chart', icon: LineChart },
  { href: '/kanban', label: 'Kanban', icon: KanbanSquare }
];

const bottomNavItems = [
  { href: '/planner', label: 'MyPlanner', icon: ClipboardList },
  { href: '/reports', label: 'Reports', icon: Table2 }
];

export function SideNav() {
  const pathname = usePathname();
  const [projectOpen, setProjectOpen] = useState(
    projectNavItems.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
  );

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const linkClass = (active: boolean) =>
    cn(
      'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
      active ? 'bg-white/12 text-white' : 'text-white/70 hover:bg-white/8 hover:text-white'
    );

  return (
    <aside className="flex min-h-screen w-64 flex-col bg-sidebar px-4 py-6 text-white">
      <div className="mb-8 px-2">
        <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-white/60">Internal App</p>
        <h1 className="mt-2 text-xl font-bold leading-tight">Workzen</h1>
      </div>
      <nav className="space-y-1">
        {topNavItems.map((item) => (
          <Link key={item.href} href={item.href} className={linkClass(isActive(item.href))}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}

        <button
          type="button"
          onClick={() => setProjectOpen((open) => !open)}
          className={cn(linkClass(false), 'w-full justify-between')}
        >
          <span className="flex items-center gap-3">
            <Folder className="h-4 w-4" />
            Project
          </span>
          <ChevronDown className={cn('h-4 w-4 transition-transform', projectOpen && 'rotate-180')} />
        </button>
        {projectOpen ? (
          <div className="ml-3 space-y-1 border-l border-white/10 pl-3">
            {projectNavItems.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(isActive(item.href))}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}

        {bottomNavItems.map((item) => (
          <Link key={item.href} href={item.href} className={linkClass(isActive(item.href))}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto rounded-2xl bg-white/8 p-4 text-sm text-white/70">
        <p className="font-semibold text-white">PRD-based MVP</p>
        <p className="mt-1 leading-relaxed">Dashboard, projects, calendar, gantt, kanban, planner, and reports.</p>
      </div>
    </aside>
  );
}
