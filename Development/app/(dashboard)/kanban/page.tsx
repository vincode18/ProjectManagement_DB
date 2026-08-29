import { PageHeader } from '@/components/page-header';
import { KanbanBoard } from '@/components/kanban-board';
import { getKanbanColumns, getProjectsFiltered } from '@/lib/api';

export default async function KanbanPage() {
  const [projects, columnLabels] = await Promise.all([getProjectsFiltered(), getKanbanColumns()]);
  return (
    <div className="space-y-6">
      <PageHeader title="Kanban" subtitle="Projects grouped by workflow status. Drag cards between columns, click a column title to rename it." />
      <KanbanBoard projects={projects} columnLabels={columnLabels} />
    </div>
  );
}
