import { PrismaClient } from '@prisma/client';
import { mockData } from '../lib/mock-data';

const prisma = new PrismaClient();

async function main() {
  await prisma.plannerSlot.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  for (const user of mockData.users) {
    await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  }

  for (const project of mockData.projects) {
    await prisma.project.create({
      data: {
        id: project.id,
        code: project.code,
        name: project.name,
        description: project.description,
        managerId: project.managerId,
        ownerId: project.ownerId,
        techLeadId: project.techLeadId ?? null,
        startDate: new Date(project.startDate),
        endDate: new Date(project.endDate),
        actualEndDate: project.actualEndDate ? new Date(project.actualEndDate) : null,
        status: project.status,
        priority: project.priority,
        progress: project.progress
      }
    });
  }

  for (const task of mockData.tasks) {
    await prisma.task.create({
      data: {
        id: task.id,
        projectId: task.projectId,
        parentTaskId: task.parentTaskId ?? null,
        wbsCode: task.wbsCode,
        name: task.name,
        assigneeId: task.assigneeId ?? null,
        startDate: new Date(task.startDate),
        endDate: new Date(task.endDate),
        progress: task.progress,
        status: task.status,
        priority: task.priority,
        isMilestone: task.isMilestone,
        remarks: task.remarks ?? null
      }
    });
  }

  for (const dependency of mockData.dependencies) {
    await prisma.taskDependency.create({
      data: {
        taskId: dependency.taskId,
        dependsOnTaskId: dependency.dependsOnTaskId,
        type: dependency.type
      }
    });
  }

  for (const slot of mockData.plannerSlots) {
    await prisma.plannerSlot.create({
      data: {
        id: slot.id,
        userId: slot.userId,
        taskId: slot.taskId,
        date: new Date(slot.date),
        hour: slot.hour
      }
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
