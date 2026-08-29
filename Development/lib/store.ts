import { mockData } from './mock-data';
import type { DependencyType, Project, Task } from './types';
import { calculateOverallProgress } from './health';

function nowIso() {
  return new Date().toISOString();
}

function syncProjectProgress(projectId: string) {
  const project = mockData.projects.find((item) => item.id === projectId);
  if (!project) return;
  const tasks = mockData.tasks.filter((task) => task.projectId === projectId);
  project.progress = calculateOverallProgress(tasks, project.progress);
  project.updatedAt = nowIso();
}

export function createProject(input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
  const project: Project = {
    ...input,
    id: `p${mockData.projects.length + 1}`,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  mockData.projects.push(project);
  return project;
}

export function updateProject(id: string, patch: Partial<Project>) {
  const project = mockData.projects.find((item) => item.id === id);
  if (!project) return null;
  Object.assign(project, patch, { updatedAt: nowIso() });
  if (patch.progress === undefined) {
    const tasks = mockData.tasks.filter((task) => task.projectId === id);
    project.progress = calculateOverallProgress(tasks, project.progress);
  }
  return project;
}

export function deleteProject(id: string) {
  const projectIndex = mockData.projects.findIndex((item) => item.id === id);
  if (projectIndex === -1) return false;
  mockData.projects.splice(projectIndex, 1);
  mockData.tasks = mockData.tasks.filter((task) => task.projectId !== id);
  mockData.dependencies = mockData.dependencies.filter((dependency) => {
    const task = mockData.tasks.find((item) => item.id === dependency.taskId || item.id === dependency.dependsOnTaskId);
    return !!task;
  });
  return true;
}

export function createTask(input: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) {
  const task: Task = {
    ...input,
    id: `t${mockData.tasks.length + 1}`,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  mockData.tasks.push(task);
  syncProjectProgress(task.projectId);
  return task;
}

export function updateTask(id: string, patch: Partial<Task>) {
  const task = mockData.tasks.find((item) => item.id === id);
  if (!task) return null;
  Object.assign(task, patch, { updatedAt: nowIso() });
  syncProjectProgress(task.projectId);
  return task;
}

export function deleteTask(id: string) {
  const task = mockData.tasks.find((item) => item.id === id);
  if (!task) return false;
  mockData.tasks = mockData.tasks.filter((item) => item.id !== id);
  mockData.dependencies = mockData.dependencies.filter((dependency) => dependency.taskId !== id && dependency.dependsOnTaskId !== id);
  syncProjectProgress(task.projectId);
  return true;
}

export function addDependency(taskId: string, dependsOnTaskId: string, type: DependencyType) {
  const dependency = { taskId, dependsOnTaskId, type };
  mockData.dependencies.push(dependency);
  return dependency;
}

export function deleteDependency(taskId: string, dependsOnTaskId: string) {
  const index = mockData.dependencies.findIndex((dependency) => dependency.taskId === taskId && dependency.dependsOnTaskId === dependsOnTaskId);
  if (index === -1) return false;
  mockData.dependencies.splice(index, 1);
  return true;
}
