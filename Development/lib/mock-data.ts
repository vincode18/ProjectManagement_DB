import type { AppData } from './types';

const now = new Date();
const iso = (year: number, month: number, day: number) => new Date(year, month, day).toISOString();

export const mockData: AppData = {
  users: [
    { id: 'u1', name: 'Alya Putri', email: 'alya@company.test', role: 'admin' },
    { id: 'u2', name: 'Rizky Pratama', email: 'rizky@company.test', role: 'manager' },
    { id: 'u3', name: 'Nadia Sari', email: 'nadia@company.test', role: 'owner' },
    { id: 'u4', name: 'Bima Santoso', email: 'bima@company.test', role: 'tech_lead' }
  ],
  projects: [
    {
      id: 'p1',
      code: 'PMD-001',
      name: 'ERP Modernization',
      description: 'Upgrade workflow and reporting for finance and operations.',
      managerId: 'u2',
      ownerId: 'u3',
      techLeadId: 'u4',
      startDate: iso(2026, 0, 5),
      endDate: iso(2026, 2, 28),
      status: 'in_progress',
      priority: 'high',
      progress: 58,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: 'p2',
      code: 'PMD-002',
      name: 'Mobile App Revamp',
      description: 'Refresh customer experience for the mobile platform.',
      managerId: 'u2',
      ownerId: 'u3',
      techLeadId: 'u4',
      startDate: iso(2026, 1, 1),
      endDate: iso(2026, 3, 15),
      status: 'planning',
      priority: 'medium',
      progress: 24,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: 'p3',
      code: 'PMD-003',
      name: 'Data Warehouse Build',
      description: 'Centralize reporting data for leadership dashboards.',
      managerId: 'u2',
      ownerId: 'u3',
      techLeadId: 'u4',
      startDate: iso(2025, 11, 15),
      endDate: iso(2026, 1, 10),
      actualEndDate: null,
      status: 'delayed',
      priority: 'high',
      progress: 71,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: 'p4',
      code: 'PMD-004',
      name: 'Internal Portal Cleanup',
      description: 'Simplify navigation and retire legacy pages.',
      managerId: 'u2',
      ownerId: 'u3',
      techLeadId: 'u4',
      startDate: iso(2025, 10, 10),
      endDate: iso(2025, 11, 22),
      actualEndDate: iso(2025, 11, 20),
      status: 'completed',
      priority: 'low',
      progress: 100,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: 'p5',
      code: 'PMD-005',
      name: 'Customer Success Toolkit',
      description: 'Support team workflow and quick access resources.',
      managerId: 'u2',
      ownerId: 'u3',
      techLeadId: null,
      startDate: iso(2026, 2, 10),
      endDate: iso(2026, 4, 25),
      status: 'not_started',
      priority: 'medium',
      progress: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }
  ],
  tasks: [
    { id: 't1', projectId: 'p1', parentTaskId: null, wbsCode: '1.1', name: 'Discovery & requirements', assigneeId: 'u4', startDate: iso(2026, 0, 5), endDate: iso(2026, 0, 20), progress: 100, status: 'completed', priority: 'high', isMilestone: false, remarks: 'Signed off', createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 't2', projectId: 'p1', parentTaskId: null, wbsCode: '1.2', name: 'Core module implementation', assigneeId: 'u4', startDate: iso(2026, 0, 21), endDate: iso(2026, 2, 5), progress: 64, status: 'in_progress', priority: 'high', isMilestone: false, remarks: null, createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 't3', projectId: 'p1', parentTaskId: 't2', wbsCode: '1.2.1', name: 'Workflow validation', assigneeId: 'u1', startDate: iso(2026, 1, 10), endDate: iso(2026, 1, 18), progress: 50, status: 'in_progress', priority: 'medium', isMilestone: false, remarks: 'Dependency on UX review', createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 't4', projectId: 'p1', parentTaskId: null, wbsCode: '1.3', name: 'UAT sign-off', assigneeId: 'u3', startDate: iso(2026, 2, 18), endDate: iso(2026, 2, 18), progress: 0, status: 'not_started', priority: 'high', isMilestone: true, remarks: null, createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 't5', projectId: 'p2', parentTaskId: null, wbsCode: '2.1', name: 'UI exploration', assigneeId: 'u1', startDate: iso(2026, 1, 1), endDate: iso(2026, 1, 14), progress: 30, status: 'planning', priority: 'medium', isMilestone: false, remarks: null, createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 't6', projectId: 'p2', parentTaskId: null, wbsCode: '2.2', name: 'Feature freeze', assigneeId: 'u4', startDate: iso(2026, 2, 20), endDate: iso(2026, 2, 20), progress: 0, status: 'not_started', priority: 'high', isMilestone: true, remarks: null, createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 't7', projectId: 'p3', parentTaskId: null, wbsCode: '3.1', name: 'ETL pipeline setup', assigneeId: 'u4', startDate: iso(2025, 11, 15), endDate: iso(2026, 0, 15), progress: 86, status: 'delayed', priority: 'high', isMilestone: false, remarks: 'Waiting on infra', createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 't8', projectId: 'p4', parentTaskId: null, wbsCode: '4.1', name: 'Navigation cleanup', assigneeId: 'u1', startDate: iso(2025, 10, 10), endDate: iso(2025, 11, 20), progress: 100, status: 'completed', priority: 'low', isMilestone: false, remarks: null, createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 't9', projectId: 'p5', parentTaskId: null, wbsCode: '5.1', name: 'Backlog triage', assigneeId: null, startDate: iso(2026, 2, 10), endDate: iso(2026, 2, 14), progress: 0, status: 'not_started', priority: 'medium', isMilestone: false, remarks: null, createdAt: now.toISOString(), updatedAt: now.toISOString() }
  ],
  dependencies: [
    { taskId: 't3', dependsOnTaskId: 't2', type: 'FS' }
  ],
  plannerSlots: [
    { id: 's1', userId: 'u1', taskId: 't3', date: iso(2026, 1, 18), hour: 10 },
    { id: 's2', userId: 'u1', taskId: 't5', date: iso(2026, 1, 18), hour: 14 }
  ]
};

export function getUser(id?: string | null) {
  if (!id) return null;
  return mockData.users.find((user) => user.id === id) ?? null;
}

export function getProject(id: string) {
  return mockData.projects.find((project) => project.id === id) ?? null;
}

export function getTasks(projectId?: string) {
  return projectId ? mockData.tasks.filter((task) => task.projectId === projectId) : mockData.tasks;
}

export function getProjectTasks(projectId: string) {
  return mockData.tasks.filter((task) => task.projectId === projectId);
}

export function getTaskDependencies(taskId: string) {
  return mockData.dependencies.filter((dependency) => dependency.taskId === taskId);
}
