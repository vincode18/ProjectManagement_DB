import { PageHeader } from '@/components/page-header';
import { PlannerBoard } from '@/components/planner-board';
import { getPlannerForUser, getUsers } from '@/lib/api';

export default async function PlannerPage() {
  const today = new Date().toISOString().slice(0, 10);
  const users = await getUsers();
  const initialUserId = users[0]?.id ?? '';
  const { inbox, slots, userTasks } = await getPlannerForUser(initialUserId, today);

  return (
    <div className="space-y-6">
      <PageHeader title="Planner" subtitle="Daily task assignment by hourly slot, scoped per user. Drag tasks between inbox and slots, or use + Add." />
      <PlannerBoard
        users={users}
        initialUserId={initialUserId}
        date={today}
        initialInbox={inbox}
        initialSlots={slots}
        initialUserTasks={userTasks}
      />
    </div>
  );
}
