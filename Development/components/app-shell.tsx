import { ReactNode } from 'react';
import { SideNav } from './side-nav';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg text-ink">
      <SideNav />
      <main className="flex-1 px-6 py-6 lg:px-8">{children}</main>
    </div>
  );
}
