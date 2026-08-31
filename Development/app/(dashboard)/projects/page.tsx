import { Search } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { RefreshButton } from '@/components/refresh-button';
import { ProjectCard } from '@/components/project-card';
import { NewProjectModal } from '@/components/new-project-modal';
import { getProjectsFiltered, getUsers } from '@/lib/api';

export default async function ProjectsPage({ searchParams }: { searchParams?: Promise<{ search?: string }> }) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const search = resolvedSearchParams.search ?? '';
  const [projects, users] = await Promise.all([getProjectsFiltered({ search }), getUsers()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        subtitle="Browse all projects in card layout."
        actions={
          <>
            <NewProjectModal users={users} />
            <RefreshButton iconOnly />
          </>
        }
      />

      <form className="surface-card p-4" method="get">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            className="input pl-9"
            name="search"
            defaultValue={search}
            placeholder="Search project name or code"
          />
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => <ProjectCard key={project.id} project={project as any} />)}
      </div>
    </div>
  );
}
