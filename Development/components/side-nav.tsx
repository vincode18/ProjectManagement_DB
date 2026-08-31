'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, KanbanSquare, LineChart, Table2, FolderKanban, ClipboardList } from 'lucide-react';
import { cn } from './utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: null },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/gantt', label: 'Gantt', icon: LineChart },
  { href: '/kanban', label: 'Kanban', icon: KanbanSquare },
  { href: '/planner', label: 'Planner', icon: ClipboardList },
  { href: '/reports', label: 'Reports', icon: Table2 }
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-64 flex-col bg-sidebar px-4 py-6 text-white">
      <div className="mb-8 px-2">
        <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-white/60">Internal App</p>
        <h1 className="mt-2 text-xl font-bold leading-tight">Workzen</h1>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                active ? 'bg-white/12 text-white' : 'text-white/70 hover:bg-white/8 hover:text-white'
              )}
            >
              {Icon ? <Icon className="h-4 w-4" /> : null}
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-2xl bg-white/8 p-4 text-sm text-white/70">
        <p className="font-semibold text-white">PRD-based MVP</p>
        <p className="mt-1 leading-relaxed">Dashboard, projects, calendar, gantt, kanban, planner, and reports.</p>
      </div>
    </aside>
  );
}
