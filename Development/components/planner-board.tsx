'use client';

import { useEffect, useState } from 'react';
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, Select } from './ui';
import { formatShortDate } from '@/lib/date';
import type { Task, User } from '@/lib/types';

const HOURS = Array.from({ length: 10 }, (_, index) => 8 + index);

interface SlotItem {
  id: string;
  userId: string;
  taskId: string;
  date: string;
  hour: number;
}

interface PlannerBoardProps {
  users: User[];
  initialUserId: string;
  date: string;
  initialInbox: Task[];
  initialSlots: SlotItem[];
  initialUserTasks: Task[];
}

function InboxCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `inbox-${task.id}`, data: { taskId: task.id, from: 'inbox' } });
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab rounded-xl bg-white/8 px-4 py-3 text-sm active:cursor-grabbing">
      <div className="font-semibold">{task.name}</div>
      <div className="mt-1 text-white/60">{task.wbsCode} · {task.status}</div>
    </div>
  );
}

function SlotCard({ slot, task }: { slot: SlotItem; task?: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `slot-${slot.id}`, data: { slotId: slot.id, taskId: slot.taskId, from: 'slot' } });
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="flex-1 cursor-grab text-sm active:cursor-grabbing">
      {task?.name ?? 'Assigned task'}
    </div>
  );
}

function HourSlot({
  hour,
  slot,
  task,
  availableTasks,
  onAdd
}: {
  hour: number;
  slot?: SlotItem;
  task?: Task;
  availableTasks: Task[];
  onAdd: (hour: number, taskId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `hour-${hour}` });
  const [adding, setAdding] = useState(false);

  return (
    <div ref={setNodeRef} className={`flex min-h-16 items-center gap-4 rounded-xl border px-4 py-3 ${isOver ? 'border-primary bg-blue-50' : 'border-border'}`}>
      <div className="w-20 text-sm font-semibold text-ink">{String(hour).padStart(2, '0')}:00</div>
      {slot ? (
        <SlotCard slot={slot} task={task} />
      ) : adding ? (
        <Select
          autoFocus
          className="flex-1"
          onChange={(event) => {
            if (event.target.value) onAdd(hour, event.target.value);
            setAdding(false);
          }}
          onBlur={() => setAdding(false)}
          defaultValue=""
        >
          <option value="" disabled>
            Select a task…
          </option>
          {availableTasks.map((item) => (
            <option key={item.id} value={item.id}>
              {item.wbsCode} · {item.name}
            </option>
          ))}
        </Select>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="flex-1 text-left text-sm text-muted hover:text-primary">
          + Add task
        </button>
      )}
    </div>
  );
}

export function PlannerBoard({ users, initialUserId, date, initialInbox, initialSlots, initialUserTasks }: PlannerBoardProps) {
  const [userId, setUserId] = useState(initialUserId);
  const [inbox, setInbox] = useState(initialInbox);
  const [slots, setSlots] = useState(initialSlots);
  const [userTasks, setUserTasks] = useState(initialUserTasks);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId === initialUserId) return;
    setLoading(true);
    fetch(`/api/planner?userId=${userId}&date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        setInbox(data.inbox ?? []);
        setSlots(data.slots ?? []);
        setUserTasks(data.userTasks ?? []);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const taskMap = new Map(userTasks.map((task) => [task.id, task]));
  const slotByHour = new Map(slots.map((slot) => [slot.hour, slot]));
  const assignedTaskIds = new Set(slots.map((slot) => slot.taskId));
  const availableTasks = userTasks.filter((task) => !assignedTaskIds.has(task.id));

  async function assignTask(hour: number, taskId: string) {
    const res = await fetch('/api/planner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, taskId, date, hour })
    });
    const created = await res.json();
    setSlots((current) => [...current.filter((slot) => slot.hour !== hour), created]);
    setInbox((current) => current.filter((task) => task.id !== taskId));
  }

  async function unassignSlot(slotId: string) {
    await fetch(`/api/planner/${slotId}`, { method: 'DELETE' });
    const slot = slots.find((item) => item.id === slotId);
    setSlots((current) => current.filter((item) => item.id !== slotId));
    if (slot) {
      const task = taskMap.get(slot.taskId);
      if (task) setInbox((current) => (current.some((item) => item.id === task.id) ? current : [...current, task]));
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const overId = String(over.id);

    if (overId.startsWith('hour-')) {
      const hour = Number(overId.replace('hour-', ''));
      const data = active.data.current as { taskId: string; from: string; slotId?: string } | undefined;
      if (!data) return;

      if (data.from === 'inbox') {
        await assignTask(hour, data.taskId);
      } else if (data.from === 'slot' && data.slotId) {
        const existing = slots.find((slot) => slot.id === data.slotId);
        if (!existing || existing.hour === hour) return;
        await unassignSlot(data.slotId);
        await assignTask(hour, data.taskId);
      }
      return;
    }

    if (overId === 'inbox-zone') {
      const data = active.data.current as { slotId?: string; from: string } | undefined;
      if (data?.from === 'slot' && data.slotId) {
        await unassignSlot(data.slotId);
      }
    }
  }

  const { setNodeRef: setInboxRef, isOver: isOverInbox } = useDroppable({ id: 'inbox-zone' });

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="mb-4 flex items-center gap-3">
        <span className="label">User</span>
        <Select value={userId} onChange={(event) => setUserId(event.target.value)} className="max-w-xs">
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </Select>
        {loading ? <span className="text-xs text-muted">Loading…</span> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="label">{formatShortDate(date)}</p>
            <div className="space-y-2">
              {HOURS.map((hour) => {
                const slot = slotByHour.get(hour);
                return <HourSlot key={hour} hour={hour} slot={slot} task={slot ? taskMap.get(slot.taskId) : undefined} availableTasks={availableTasks} onAdd={assignTask} />;
              })}
            </div>
          </CardContent>
        </Card>

        <div ref={setInboxRef}>
          <Card className={`bg-sidebar text-white ${isOverInbox ? 'ring-2 ring-white/60' : ''}`}>
            <CardContent className="space-y-3 p-4">
              <p className="label text-white/60">Inbox</p>
              <div className="space-y-2">
                {inbox.map((task) => (
                  <InboxCard key={task.id} task={task} />
                ))}
                {inbox.length === 0 ? <p className="text-sm text-white/50">No pending tasks.</p> : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DndContext>
  );
}
