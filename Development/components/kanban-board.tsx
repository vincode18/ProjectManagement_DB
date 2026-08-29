'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, ProgressBar } from './ui';
import { PriorityPill, StatusPill } from './status-pill';
import { elapsedWorkTime } from '@/lib/health';
import type { Project, ProjectStatus } from '@/lib/types';

const STATUSES: ProjectStatus[] = ['not_started', 'planning', 'in_progress', 'on_hold', 'completed', 'delayed'];

type KanbanProject = Project & { overallProgress?: number };

interface KanbanBoardProps {
  projects: KanbanProject[];
  columnLabels: Record<string, string>;
}

function KanbanCard({ project }: { project: KanbanProject }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link href={`/projects/${project.id}`} className="block rounded-xl border border-border p-3 transition hover:border-primary/40 hover:bg-slate-50" onClickCapture={(e) => isDragging && e.preventDefault()}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="label">{project.code}</p>
            <p className="mt-1 font-semibold text-ink">{project.name}</p>
          </div>
          <StatusPill status={project.status} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <PriorityPill priority={project.priority} />
        </div>
        <div className="mt-3 space-y-2">
          <ProgressBar value={project.overallProgress ?? project.progress} />
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{project.overallProgress ?? project.progress}%</span>
            <span>{elapsedWorkTime(project.startDate) ?? 'Not started'}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}

function KanbanColumn({
  status,
  label,
  items,
  onLabelChange
}: {
  status: ProjectStatus;
  label: string;
  items: KanbanProject[];
  onLabelChange: (status: ProjectStatus, label: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const [editing, setEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(label);

  function commit() {
    setEditing(false);
    const trimmed = draftLabel.trim();
    if (trimmed && trimmed !== label) onLabelChange(status, trimmed);
    else setDraftLabel(label);
  }

  return (
    <div ref={setNodeRef}>
      <Card className={isOver ? 'ring-2 ring-primary/40' : ''}>
        <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          {editing ? (
            <input
              autoFocus
              className="input py-1 text-sm font-semibold capitalize"
              value={draftLabel}
              onChange={(event) => setDraftLabel(event.target.value)}
              onBlur={commit}
              onKeyDown={(event) => {
                if (event.key === 'Enter') commit();
                if (event.key === 'Escape') {
                  setDraftLabel(label);
                  setEditing(false);
                }
              }}
            />
          ) : (
            <h2
              className="section-title cursor-text capitalize"
              onClick={() => setEditing(true)}
              title="Click to rename"
            >
              {label}
            </h2>
          )}
          <span className="pill bg-slate-100 text-slate-700">{items.length}</span>
        </div>
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <div className="min-h-16 space-y-3">
            {items.map((project) => (
              <KanbanCard key={project.id} project={project} />
            ))}
          </div>
        </SortableContext>
        </CardContent>
      </Card>
    </div>
  );
}

export function KanbanBoard({ projects, columnLabels }: KanbanBoardProps) {
  const router = useRouter();
  const [localProjects, setLocalProjects] = useState(projects);
  const [labels, setLabels] = useState(columnLabels);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function findStatusOfContainer(id: string): ProjectStatus | null {
    if (STATUSES.includes(id as ProjectStatus)) return id as ProjectStatus;
    const project = localProjects.find((item) => item.id === id);
    return project ? project.status : null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const targetStatus = findStatusOfContainer(String(over.id));
    if (!targetStatus) return;

    const draggedProject = localProjects.find((item) => item.id === activeId);
    if (!draggedProject || draggedProject.status === targetStatus) return;

    setLocalProjects((current) => current.map((item) => (item.id === activeId ? { ...item, status: targetStatus } : item)));

    await fetch(`/api/projects/${activeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: targetStatus })
    });
    router.refresh();
  }

  async function handleLabelChange(status: ProjectStatus, label: string) {
    setLabels((current) => ({ ...current, [status]: label }));
    await fetch('/api/kanban/columns', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, label })
    });
    router.refresh();
  }

  const activeProject = activeId ? localProjects.find((item) => item.id === activeId) ?? null : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid gap-4 xl:grid-cols-6">
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            label={labels[status] ?? status.replaceAll('_', ' ')}
            items={localProjects.filter((project) => project.status === status)}
            onLabelChange={handleLabelChange}
          />
        ))}
      </div>
      <DragOverlay>{activeProject ? <KanbanCard project={activeProject} /> : null}</DragOverlay>
    </DndContext>
  );
}
