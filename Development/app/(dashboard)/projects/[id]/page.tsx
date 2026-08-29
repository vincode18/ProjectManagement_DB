import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { ProjectDetailClient } from '@/components/project-detail-client';
import { getDependenciesForProject, getProjectDetail, getUsers } from '@/lib/api';

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project, users, dependencies] = await Promise.all([getProjectDetail(id), getUsers(), getDependenciesForProject(id)]);

  const currentProject = project ?? notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Project Detail" subtitle="Work breakdown, dependencies, and timeline." />
      <ProjectDetailClient project={currentProject} tasks={currentProject.tasks} users={users} dependencies={dependencies} />
    </div>
  );
}
