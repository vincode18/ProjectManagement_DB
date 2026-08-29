export type ProjectStatus = 'not_started' | 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'delayed';
export type PriorityLevel = 'high' | 'medium' | 'low';
export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  managerId: string;
  ownerId: string;
  techLeadId?: string | null;
  startDate: string;
  endDate: string;
  actualEndDate?: string | null;
  status: ProjectStatus;
  priority: PriorityLevel;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  parentTaskId?: string | null;
  wbsCode: string;
  name: string;
  assigneeId?: string | null;
  startDate: string;
  endDate: string;
  progress: number;
  status: ProjectStatus;
  priority: PriorityLevel;
  isMilestone: boolean;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDependency {
  taskId: string;
  dependsOnTaskId: string;
  type: DependencyType;
}

export interface PlannerSlot {
  id: string;
  userId: string;
  taskId: string;
  date: string;
  hour: number;
}

export interface AppData {
  users: User[];
  projects: Project[];
  tasks: Task[];
  dependencies: TaskDependency[];
  plannerSlots: PlannerSlot[];
}
