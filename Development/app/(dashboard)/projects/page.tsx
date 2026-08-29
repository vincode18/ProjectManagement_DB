import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { RefreshButton } from '@/components/refresh-button';
import { ProjectCard } from '@/components/project-card';
import { ProjectForm } from '@/components/project-form';
import { getProjectsFiltered } from '@/lib/api';
import { mockData } from '@/lib/mock-data';

export default function ProjectsPage() {
  const projects = getProjectsFiltered();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        subtitle="Browse all projects in card layout."
        actions={
          <>
            <Link href="#new-project" className="btn-secondary">New Project</Link>
            <RefreshButton />
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => <ProjectCard key={project.id} project={project as any} />)}
      </div>

      <div id="new-project" className="scroll-mt-6">
        <ProjectForm mode="create" users={mockData.users} />
      </div>
    </div>
  );
}
