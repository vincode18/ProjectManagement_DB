import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui';
import { getPlannerInbox } from '@/lib/api';
import { mockData } from '@/lib/mock-data';
import { formatShortDate } from '@/lib/date';

const hours = Array.from({ length: 10 }, (_, index) => 8 + index);

export default function PlannerPage() {
  const inbox = getPlannerInbox();
  const today = new Date().toISOString().slice(0, 10);
  const slots = mockData.plannerSlots.filter((slot) => slot.date.startsWith(today));

  return (
    <div className="space-y-6">
      <PageHeader title="Planner" subtitle="Daily task assignment by hourly slot." />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="label">{formatShortDate(today)}</p>
            <div className="space-y-2">
              {hours.map((hour) => {
                const slot = slots.find((item) => item.hour === hour);
                return (
                  <div key={hour} className="flex min-h-16 items-center gap-4 rounded-xl border border-border px-4 py-3">
                    <div className="w-20 text-sm font-semibold text-ink">{String(hour).padStart(2, '0')}:00</div>
                    <div className="flex-1 text-sm text-muted">
                      {slot ? mockData.tasks.find((task) => task.id === slot.taskId)?.name ?? 'Assigned task' : 'Drop task here'}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-sidebar text-white">
          <CardContent className="space-y-3 p-4">
            <p className="label text-white/60">Inbox</p>
            <div className="space-y-2">
              {inbox.map((task) => (
                <div key={task.id} className="rounded-xl bg-white/8 px-4 py-3 text-sm">
                  <div className="font-semibold">{task.name}</div>
                  <div className="mt-1 text-white/60">{task.wbsCode} · {task.status}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
