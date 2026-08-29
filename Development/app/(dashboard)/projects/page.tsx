import { PageHeader } from '@/components/page-header';
import { RefreshButton } from '@/components/refresh-button';
import { ProjectCard } from '@/components/project-card';
import { NewProjectModal } from '@/components/new-project-modal';
import { getProjectsFiltered, getUsers } from '@/lib/api';

export default async function ProjectsPage() {
  const [projects, users] = await Promise.all([getProjectsFiltered(), getUsers()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        subtitle="Browse all projects in card layout."
        actions={
          <>
            <NewProjectModal users={users} />
            <RefreshButton />
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => <ProjectCard key={project.id} project={project as any} />)}
      </div>
    </div>
  );
}
