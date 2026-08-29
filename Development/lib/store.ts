import { prisma } from './prisma';
import type { DependencyType, Project, Task } from './types';
import { calculateOverallProgress } from './health';
import { toProject, toTask } from './api';

async function syncProjectProgress(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return;
  const tasks = await prisma.task.findMany({ where: { projectId } });
  const progress = calculateOverallProgress(tasks.map(toTask), project.progress);
  await prisma.project.update({ where: { id: projectId }, data: { progress } });
}

export async function createProject(input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
  const project = await prisma.project.create({
    data: {
      code: input.code,
      name: input.name,
      description: input.description ?? null,
      managerId: input.managerId,
      ownerId: input.ownerId,
      techLeadId: input.techLeadId ?? null,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      actualEndDate: input.actualEndDate ? new Date(input.actualEndDate) : null,
      status: input.status,
      priority: input.priority,
      progress: input.progress ?? 0
    }
  });
  return toProject(project);
}

export async function updateProject(id: string, patch: Partial<Project>) {
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return null;

  const project = await prisma.project.update({
    where: { id },
    data: {
      code: patch.code,
      name: patch.name,
      description: patch.description ?? undefined,
      managerId: patch.managerId,
      ownerId: patch.ownerId,
      techLeadId: patch.techLeadId === undefined ? undefined : patch.techLeadId,
      startDate: patch.startDate ? new Date(patch.startDate) : undefined,
      endDate: patch.endDate ? new Date(patch.endDate) : undefined,
      actualEndDate: patch.actualEndDate === undefined ? undefined : patch.actualEndDate ? new Date(patch.actualEndDate) : null,
      status: patch.status,
      priority: patch.priority,
      progress: patch.progress
    }
  });

  if (patch.progress === undefined) {
    const tasks = await prisma.task.findMany({ where: { projectId: id } });
    const progress = calculateOverallProgress(tasks.map(toTask), project.progress);
    const updated = await prisma.project.update({ where: { id }, data: { progress } });
    return toProject(updated);
  }

  return toProject(project);
}

export async function deleteProject(id: string) {
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return false;
  await prisma.project.delete({ where: { id } });
  return true;
}

export async function createTask(input: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) {
  const task = await prisma.task.create({
    data: {
      projectId: input.projectId,
      parentTaskId: input.parentTaskId ?? null,
      wbsCode: input.wbsCode,
      name: input.name,
      assigneeId: input.assigneeId ?? null,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      progress: input.progress ?? 0,
      status: input.status,
      priority: input.priority,
      isMilestone: input.isMilestone ?? false,
      remarks: input.remarks ?? null
    }
  });
  await syncProjectProgress(task.projectId);
  return toTask(task);
}

export async function updateTask(id: string, patch: Partial<Task>) {
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return null;

  const task = await prisma.task.update({
    where: { id },
    data: {
      projectId: patch.projectId,
      parentTaskId: patch.parentTaskId === undefined ? undefined : patch.parentTaskId,
      wbsCode: patch.wbsCode,
      name: patch.name,
      assigneeId: patch.assigneeId === undefined ? undefined : patch.assigneeId,
      startDate: patch.startDate ? new Date(patch.startDate) : undefined,
      endDate: patch.endDate ? new Date(patch.endDate) : undefined,
      progress: patch.progress,
      status: patch.status,
      priority: patch.priority,
      isMilestone: patch.isMilestone,
      remarks: patch.remarks === undefined ? undefined : patch.remarks
    }
  });
  await syncProjectProgress(task.projectId);
  return toTask(task);
}

export async function deleteTask(id: string) {
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return false;
  await prisma.task.delete({ where: { id } });
  await syncProjectProgress(existing.projectId);
  return true;
}

export async function addDependency(taskId: string, dependsOnTaskId: string, type: DependencyType) {
  const dependency = await prisma.taskDependency.upsert({
    where: { taskId_dependsOnTaskId: { taskId, dependsOnTaskId } },
    create: { taskId, dependsOnTaskId, type },
    update: { type }
  });
  return { taskId: dependency.taskId, dependsOnTaskId: dependency.dependsOnTaskId, type: dependency.type };
}

export async function createPlannerSlot(input: { userId: string; taskId: string; date: string; hour: number }) {
  await prisma.plannerSlot.deleteMany({ where: { userId: input.userId, hour: input.hour, date: new Date(`${input.date}T00:00:00.000Z`) } });
  const slot = await prisma.plannerSlot.create({
    data: {
      userId: input.userId,
      taskId: input.taskId,
      date: new Date(`${input.date}T00:00:00.000Z`),
      hour: input.hour
    }
  });
  return { id: slot.id, userId: slot.userId, taskId: slot.taskId, date: slot.date.toISOString(), hour: slot.hour };
}

export async function deletePlannerSlot(id: string) {
  try {
    await prisma.plannerSlot.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function setKanbanColumnLabel(status: Project['status'], label: string) {
  const config = await prisma.kanbanColumnConfig.upsert({
    where: { status },
    create: { status, label },
    update: { label }
  });
  return { status: config.status, label: config.label };
}

export async function deleteDependency(taskId: string, dependsOnTaskId: string) {
  try {
    await prisma.taskDependency.delete({ where: { taskId_dependsOnTaskId: { taskId, dependsOnTaskId } } });
    return true;
  } catch {
    return false;
  }
}
