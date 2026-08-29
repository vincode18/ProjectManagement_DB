'use client';

import { useRouter } from 'next/navigation';
import { Button } from './ui';

export function RefreshButton({ label = 'Refresh' }: { label?: string }) {
  const router = useRouter();
  return <Button variant="secondary" onClick={() => router.refresh()}>{label}</Button>;
}
