import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { ProjectDetailClient } from '@/components/project-detail-client';
import { getProjectDetail } from '@/lib/api';
import { mockData } from '@/lib/mock-data';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const project = getProjectDetail(id);

  const currentProject = project ?? notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Project Detail" subtitle="Work breakdown, dependencies, and timeline." />
      <ProjectDetailClient project={currentProject} tasks={currentProject.tasks} users={mockData.users} dependencies={mockData.dependencies} />
    </div>
  );
}
