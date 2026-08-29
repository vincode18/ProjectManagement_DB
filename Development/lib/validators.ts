import { z } from 'zod';

const id = z.string().min(1);
const dateString = z.string().refine((value) => !Number.isNaN(new Date(value).getTime()), 'Invalid date');

export const projectSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  managerId: id,
  ownerId: id,
  techLeadId: id.optional().nullable(),
  startDate: dateString,
  endDate: dateString,
  status: z.enum(['not_started', 'planning', 'in_progress', 'on_hold', 'completed', 'delayed']),
  priority: z.enum(['high', 'medium', 'low']),
  progress: z.number().int().min(0).max(100).optional().default(0)
});

export const taskSchema = z.object({
  projectId: id,
  parentTaskId: id.optional().nullable(),
  wbsCode: z.string().min(1),
  name: z.string().min(1),
  assigneeId: id.optional().nullable(),
  startDate: dateString,
  endDate: dateString,
  progress: z.number().int().min(0).max(100).optional().default(0),
  status: z.enum(['not_started', 'planning', 'in_progress', 'on_hold', 'completed', 'delayed']),
  priority: z.enum(['high', 'medium', 'low']),
  isMilestone: z.boolean().optional().default(false),
  remarks: z.string().optional().nullable()
});

export const taskUpdateSchema = taskSchema.partial().extend({ id: id });

export const dependencySchema = z.object({
  dependsOnTaskId: id,
  type: z.enum(['FS', 'SS', 'FF', 'SF'])
});
