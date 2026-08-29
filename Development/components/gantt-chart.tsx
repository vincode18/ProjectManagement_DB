'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addDays, diffDays, formatShortDate, isToday } from '@/lib/date';
import { barOffsetPx, barWidthPx, buildWeekColumns, calculateGanttRange } from '@/lib/workflows';
import { statusColor } from '@/lib/format';
import type { ProjectStatus } from '@/lib/types';

export interface GanttRowItem {
  id: string;
  title: string;
  subtitle?: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
}

interface GanttChartProps {
  rows: GanttRowItem[];
  draggable?: boolean;
  onRowClick?: (id: string) => void;
  patchEndpoint?: (id: string) => string;
  emptyLabel?: string;
}

const WEEK_WIDTH = 120;
const LABEL_WIDTH = 240;

export function GanttChart({ rows, draggable = false, onRowClick, patchEndpoint, emptyLabel = 'No items to display.' }: GanttChartProps) {
  const router = useRouter();
  const [localRows, setLocalRows] = useState(rows);
  const dragState = useRef<{ id: string; startX: number; origStart: Date; origEnd: Date } | null>(null);

  const range = useMemo(
    () => calculateGanttRange(localRows.map((row) => row.startDate), localRows.map((row) => row.endDate)),
    [localRows]
  );
  const weeks = useMemo(() => buildWeekColumns(range.start, range.end), [range]);
  const totalWidth = Math.max(weeks.length * WEEK_WIDTH, 1);
  const weeksStart = weeks[0]?.start ?? range.start;
  const todayOffset = barOffsetPx(weeksStart, new Date(), WEEK_WIDTH);

  function handleMouseDown(event: React.MouseEvent, row: GanttRowItem) {
    if (!draggable) return;
    event.preventDefault();
    dragState.current = { id: row.id, startX: event.clientX, origStart: new Date(row.startDate), origEnd: new Date(row.endDate) };

    function onMouseMove(moveEvent: MouseEvent) {
      if (!dragState.current) return;
      const deltaPx = moveEvent.clientX - dragState.current.startX;
      const deltaWeeks = Math.round(deltaPx / WEEK_WIDTH);
      const deltaDays = deltaWeeks * 7;
      setLocalRows((current) =>
        current.map((item) =>
          item.id === dragState.current?.id
            ? {
                ...item,
                startDate: addDays(dragState.current.origStart, deltaDays).toISOString(),
                endDate: addDays(dragState.current.origEnd, deltaDays).toISOString()
              }
            : item
        )
      );
    }

    async function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      const dragged = dragState.current;
      dragState.current = null;
      if (!dragged || !patchEndpoint) return;
      const updatedRow = localRows.find((item) => item.id === dragged.id);
      if (!updatedRow) return;
      const latest = localRows.find((item) => item.id === dragged.id);
      if (!latest) return;
      await fetch(patchEndpoint(dragged.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: latest.startDate, endDate: latest.endDate })
      });
      router.refresh();
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  if (localRows.length === 0) {
    return <div className="p-6 text-sm text-muted">{emptyLabel}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <div style={{ width: LABEL_WIDTH + totalWidth, minWidth: '100%' }}>
        <div className="flex border-b border-border bg-slate-50">
          <div className="shrink-0 px-4 py-3 text-sm font-semibold" style={{ width: LABEL_WIDTH }}>
            Name
          </div>
          <div className="flex" style={{ width: totalWidth }}>
            {weeks.map((week) => (
              <div key={week.start.toISOString()} className="shrink-0 border-l border-border px-3 py-3 text-xs font-semibold text-muted" style={{ width: WEEK_WIDTH }}>
                {formatShortDate(week.start.toISOString())}
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 z-10 w-px bg-red-500" style={{ left: LABEL_WIDTH + todayOffset }} />
          {localRows.map((row) => (
            <div key={row.id} className="flex border-b border-border">
              <div className="shrink-0 px-4 py-4" style={{ width: LABEL_WIDTH }}>
                <button
                  type="button"
                  onClick={() => onRowClick?.(row.id)}
                  className={`text-left font-semibold text-ink ${onRowClick ? 'hover:text-primary' : ''}`}
                >
                  {row.title}
                </button>
                {row.subtitle ? <p className="text-xs text-muted">{row.subtitle}</p> : null}
              </div>
              <div className="relative" style={{ width: totalWidth }}>
                <div className="absolute inset-0 flex">
                  {weeks.map((week) => (
                    <div key={week.start.toISOString()} className="shrink-0 border-l border-border" style={{ width: WEEK_WIDTH }} />
                  ))}
                </div>
                <div className="relative flex h-14 items-center">
                  <div
                    onMouseDown={(event) => handleMouseDown(event, row)}
                    className={`absolute top-1/2 h-6 -translate-y-1/2 rounded-full ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    style={{
                      left: barOffsetPx(weeksStart, new Date(row.startDate), WEEK_WIDTH),
                      width: barWidthPx(new Date(row.startDate), new Date(row.endDate), WEEK_WIDTH),
                      background: statusColor(row.status)
                    }}
                    title={`${formatShortDate(row.startDate)} – ${formatShortDate(row.endDate)}`}
                  >
                    {isToday(new Date(row.startDate)) ? (
                      <span className="absolute -top-5 left-1 text-[10px] font-semibold uppercase tracking-wide text-ink">today</span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
