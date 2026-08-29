'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function TaskProgressSlider({ taskId, initialProgress }: { taskId: string; initialProgress: number }) {
  const router = useRouter();
  const [progress, setProgress] = useState(initialProgress);

  async function update(next: number) {
    setProgress(next);
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress: next })
    });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <input className="w-full accent-primary" type="range" min="0" max="100" value={progress} onChange={(event) => update(Number(event.target.value))} />
      <span className="min-w-12 text-sm font-semibold text-ink">{progress}%</span>
    </div>
  );
}
