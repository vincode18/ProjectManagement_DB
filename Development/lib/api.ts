import { prisma } from './prisma';
import { calculateHealth, calculateOverallProgress } from './health';
import { formatDate, STATUS_ORDER } from './date';
import type { Project, Task, User, TaskDependency } from './types';
import type { Project as PrismaProject, Task as PrismaTask, User as PrismaUser } from '@prisma/client';

export type ComputedProject = Project & {
  owner: User | null;
  manager: User | null;
  techLead: User | null;
  tasks: Task[];
  health: 'On Track' | 'At Risk' | 'Critical';
  overallProgress: number;
};

function toUser(user: PrismaUser | null | undefined): User | null {
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export function toTask(task: PrismaTask): Task {
  return {
    id: task.id,
    projectId: task.projectId,
    parentTaskId: task.parentTaskId,
    wbsCode: task.wbsCode,
    name: task.name,
    assigneeId: task.assigneeId,
    startDate: task.startDate.toISOString(),
    endDate: task.endDate.toISOString(),
    progress: task.progress,
    status: task.status,
    priority: task.priority,
    isMilestone: task.isMilestone,
    remarks: task.remarks,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString()
  };
}

export function toProject(project: PrismaProject): Project {
  return {
    id: project.id,
    code: project.code,
    name: project.name,
    description: project.description ?? undefined,
    managerId: project.managerId,
    ownerId: project.ownerId,
    techLeadId: project.techLeadId,
    startDate: project.startDate.toISOString(),
    endDate: project.endDate.toISOString(),
    actualEndDate: project.actualEndDate ? project.actualEndDate.toISOString() : null,
    status: project.status,
    priority: project.priority,
    progress: project.progress,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString()
  };
}

type ProjectWithRelations = PrismaProject & {
  manager?: PrismaUser | null;
  owner?: PrismaUser | null;
  techLead?: PrismaUser | null;
  tasks?: PrismaTask[];
};

const projectInclude = {
  manager: true,
  owner: true,
  techLead: true,
  tasks: true
} as const;

export function withComputedProject(project: ProjectWithRelations): ComputedProject {
  const tasks = (project.tasks ?? []).map(toTask);
  const baseProject = toProject(project);
  return {
    ...baseProject,
    owner: toUser(project.owner),
    manager: toUser(project.manager),
    techLead: toUser(project.techLead),
    tasks,
    health: calculateHealth(baseProject, tasks),
    overallProgress: calculateOverallProgress(tasks, baseProject.progress)
  };
}

export async function getProjectsFiltered(filters: { status?: string; priority?: string; search?: string } = {}): Promise<ComputedProject[]> {
  const search = filters.search?.trim();
  const projects = await prisma.project.findMany({
    where: {
      status: filters.status ? (filters.status as Project['status']) : undefined,
      priority: filters.priority ? (filters.priority as Project['priority']) : undefined,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } }
            ]
          }
        : {})
    },
    include: projectInclude,
    orderBy: { name: 'asc' }
  });
  return projects.map(withComputedProject);
}

export async function getProjectDetail(id: string): Promise<ComputedProject | null> {
  const project = await prisma.project.findUnique({ where: { id }, include: projectInclude });
  if (!project) return null;
  return withComputedProject(project);
}

export async function getTasksByProject(projectId: string) {
  const tasks = await prisma.task.findMany({ where: { projectId }, orderBy: { wbsCode: 'asc' } });
  return tasks.map(toTask);
}

export async function getUpcomingMilestones() {
  const tasks = await prisma.task.findMany({
    where: { isMilestone: true },
    orderBy: { endDate: 'asc' },
    take: 4,
    include: { project: true }
  });
  return tasks.map((task) => ({
    ...toTask(task),
    project: task.project ? toProject(task.project) : null
  }));
}

export async function getDashboardSummary() {
  const rawProjects = await prisma.project.findMany({ include: projectInclude });
  const projects = rawProjects.map(withComputedProject);
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
    upcomingMilestones: await getUpcomingMilestones(),
    riskProjects: projects.slice(0, 6)
  };
}

export async function getUsers(): Promise<User[]> {
  const users = await prisma.user.findMany({ orderBy: { name: 'asc' } });
  return users.map((user) => ({ id: user.id, name: user.name, email: user.email, role: user.role }));
}

export async function getDependenciesForProject(projectId: string): Promise<TaskDependency[]> {
  const dependencies = await prisma.taskDependency.findMany({
    where: { task: { projectId } }
  });
  return dependencies.map((dependency) => ({
    taskId: dependency.taskId,
    dependsOnTaskId: dependency.dependsOnTaskId,
    type: dependency.type
  }));
}

export async function getAllProjectsRaw(): Promise<Project[]> {
  const projects = await prisma.project.findMany({ orderBy: { name: 'asc' } });
  return projects.map(toProject);
}

export async function getAllTasksRaw(): Promise<Task[]> {
  const tasks = await prisma.task.findMany({ orderBy: { wbsCode: 'asc' } });
  return tasks.map(toTask);
}

export async function getKanbanColumns(): Promise<Record<string, string>> {
  const configs = await prisma.kanbanColumnConfig.findMany();
  const map: Record<string, string> = {};
  for (const status of STATUS_ORDER) {
    map[status] = status.replaceAll('_', ' ');
  }
  for (const config of configs) {
    map[config.status] = config.label;
  }
  return map;
}

export async function getPlannerData(dateIso: string) {
  const start = new Date(`${dateIso}T00:00:00.000Z`);
  const end = new Date(`${dateIso}T23:59:59.999Z`);
  const [slots, tasks] = await Promise.all([
    prisma.plannerSlot.findMany({ where: { date: { gte: start, lte: end } } }),
    prisma.task.findMany()
  ]);
  const taskMap = new Map(tasks.map((task) => [task.id, toTask(task)]));
  return {
    slots: slots.map((slot) => ({ id: slot.id, userId: slot.userId, taskId: slot.taskId, date: slot.date.toISOString(), hour: slot.hour })),
    taskMap
  };
}

export async function getPlannerForUser(userId: string, dateIso: string) {
  const start = new Date(`${dateIso}T00:00:00.000Z`);
  const end = new Date(`${dateIso}T23:59:59.999Z`);
  const [slots, inboxTasks, userTasks] = await Promise.all([
    prisma.plannerSlot.findMany({ where: { userId, date: { gte: start, lte: end } } }),
    prisma.task.findMany({ where: { assigneeId: userId, status: { not: 'completed' } }, orderBy: { wbsCode: 'asc' } }),
    prisma.task.findMany({ where: { assigneeId: userId }, orderBy: { wbsCode: 'asc' } })
  ]);
  const taskMap = new Map(userTasks.map((task) => [task.id, toTask(task)]));
  const assignedTaskIds = new Set(slots.map((slot) => slot.taskId));
  return {
    slots: slots.map((slot) => ({ id: slot.id, userId: slot.userId, taskId: slot.taskId, date: slot.date.toISOString(), hour: slot.hour })),
    inbox: inboxTasks.map(toTask).filter((task) => !assignedTaskIds.has(task.id)),
    userTasks: userTasks.map(toTask),
    taskMap
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

export async function getMonthProjects(search = '', filter = 'All Projects') {
  const query = search.trim().toLowerCase();
  const rawProjects = await prisma.project.findMany({ include: projectInclude });
  return rawProjects
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

export async function getPlannerInbox() {
  const tasks = await prisma.task.findMany({ where: { status: { not: 'completed' } }, take: 8 });
  return tasks.map(toTask);
}

export async function getReportsRows() {
  const rawProjects = await prisma.project.findMany({ include: projectInclude });
  return rawProjects.map((project) => {
    const computed = withComputedProject(project);
    return {
      ...computed,
      schedule: `${formatDate(computed.startDate)} – ${formatDate(computed.endDate)}`
    };
  });
}

export async function getDependencyLabel(task: Task) {
  const dependencies = await prisma.taskDependency.findMany({ where: { taskId: task.id } });
  return dependencies.map((dependency) => dependency.type).join(', ');
}
