import { PageHeader } from '@/components/page-header';
import { ReportsTable } from '@/components/reports-table';
import { getReportsRows } from '@/lib/api';

export default async function ReportsPage() {
  const rows = await getReportsRows();

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Expand a project to see task breakdown, or export the full report to Excel." />
      <ReportsTable rows={rows} />
    </div>
  );
}
