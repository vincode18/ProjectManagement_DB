import { mockData } from './mock-data';
import { calculateHealth, calculateOverallProgress } from './health';
import { formatDate, STATUS_ORDER } from './date';
import type { Project, Task, User } from './types';

export type ComputedProject = Project & {
  owner: User | null;
  manager: User | null;
  techLead: User | null;
  tasks: Task[];
  health: 'On Track' | 'At Risk' | 'Critical';
  overallProgress: number;
};

export function withComputedProject(project: Project): ComputedProject {
  const tasks = mockData.tasks.filter((task) => task.projectId === project.id);
  return {
    ...project,
    owner: mockData.users.find((user) => user.id === project.ownerId) ?? null,
    manager: mockData.users.find((user) => user.id === project.managerId) ?? null,
    techLead: mockData.users.find((user) => user.id === project.techLeadId) ?? null,
    tasks,
    health: calculateHealth(project, tasks),
    overallProgress: calculateOverallProgress(tasks, project.progress)
  };
}

export function getProjectsFiltered(filters: { status?: string; priority?: string; search?: string } = {}): ComputedProject[] {
  const search = filters.search?.trim().toLowerCase();
  return mockData.projects
    .filter((project) => {
      if (filters.status && project.status !== filters.status) return false;
      if (filters.priority && project.priority !== filters.priority) return false;
      if (!search) return true;
      return project.name.toLowerCase().includes(search) || project.code.toLowerCase().includes(search);
    })
    .map(withComputedProject)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getProjectDetail(id: string): ComputedProject | null {
  const project = mockData.projects.find((item) => item.id === id) ?? null;
  if (!project) return null;
  return withComputedProject(project);
}

export function getTasksByProject(projectId: string) {
  return mockData.tasks
    .filter((task) => task.projectId === projectId)
    .sort((a, b) => a.wbsCode.localeCompare(b.wbsCode));
}

export function getUpcomingMilestones() {
  return mockData.tasks
    .filter((task) => task.isMilestone)
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 4)
    .map((task) => ({
      ...task,
      project: mockData.projects.find((project) => project.id === task.projectId) ?? null
    }));
}

export function getDashboardSummary() {
  const projects = mockData.projects.map(withComputedProject);
  const today = new Date();
  const upcoming = projects.filter((project) => new Date(project.startDate) > today).length;

  const statusCounts = STATUS_ORDER.map((status) => ({
    status,
    label: status.replaceAll('_', ' '),
    count: projects.filter((project) => project.status === status).length
  }));

  const delayedCount = projects.filter((project) => project.status === 'delayed' || project.health === 'Critical').length;

  return {
    totalProjects: projects.length,
    activeProjects: projects.filter((project) => ['planning', 'in_progress', 'on_hold'].includes(project.status)).length,
    completed: projects.filter((project) => project.status === 'completed').length,
    delayed: delayedCount,
    upcoming,
    overallProgress: Math.round(projects.reduce((sum, project) => sum + project.overallProgress, 0) / Math.max(1, projects.length)),
    statusCounts,
    upcomingMilestones: getUpcomingMilestones(),
    riskProjects: projects.slice(0, 6)
  };
}

export function buildCalendarWeeks(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const weeks: Date[][] = [];
  let cursor = new Date(first);

  cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7));

  while (cursor <= last || weeks.length < 6) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i += 1) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    if (weeks.length >= 6 && cursor > last) break;
  }

  return weeks.slice(0, 6);
}

export function getMonthProjects(search = '', filter = 'All Projects') {
  const query = search.trim().toLowerCase();
  return mockData.projects
    .map(withComputedProject)
    .filter((project) => {
      if (query && !(project.name.toLowerCase().includes(query) || project.code.toLowerCase().includes(query))) return false;
      if (filter === 'My Projects') return project.managerId === 'u2';
      if (filter === 'Active') return ['planning', 'in_progress', 'on_hold'].includes(project.status);
      if (filter === 'Completed') return project.status === 'completed';
      if (filter === 'Delayed') return project.status === 'delayed' || project.health === 'Critical';
      if (filter === 'High Priority') return project.priority === 'high';
      if (filter === 'Medium Priority') return project.priority === 'medium';
      if (filter === 'Low Priority') return project.priority === 'low';
      return true;
    });
}

export function getPlannerInbox() {
  return mockData.tasks.filter((task) => task.status !== 'completed').slice(0, 8);
}

export function getReportsRows() {
  return mockData.projects.map((project) => {
    const tasks = mockData.tasks.filter((task) => task.projectId === project.id);
    return {
      ...withComputedProject(project),
      tasks,
      schedule: `${formatDate(project.startDate)} – ${formatDate(project.endDate)}`
    };
  });
}

export function getDependencyLabel(task: Task) {
  return mockData.dependencies.filter((dependency) => dependency.taskId === task.id).map((dependency) => dependency.type).join(', ');
}
