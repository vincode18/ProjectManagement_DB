'use client';

import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { Button } from './ui';
import { cn } from './utils';

export function RefreshButton({ label = 'Refresh', iconOnly = false }: { label?: string; iconOnly?: boolean }) {
  const router = useRouter();
  return (
    <Button
      variant="secondary"
      onClick={() => router.refresh()}
      aria-label={label}
      title={label}
      className={cn(iconOnly && 'px-2.5')}
    >
      <RefreshCw className="h-4 w-4" />
      {iconOnly ? null : label}
    </Button>
  );
}
