import Link from 'next/link';
import { Button } from '@/components/ui';
import { MarketingFooter } from '@/components/marketing-footer';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sidebar px-6 text-center text-white">
      <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-white/60">Welcome to</p>
      <h1 className="mt-3 text-5xl font-bold leading-tight">Workzen</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
        Plan, track, and deliver every project in one place — dashboard, calendar, gantt, kanban, planner, and reports.
      </p>
      <Link href="/dashboard" className="mt-8">
        <Button variant="primary" className="px-6">
          Get Started
        </Button>
      </Link>
      <MarketingFooter />
    </div>
  );
}
