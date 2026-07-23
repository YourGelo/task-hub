import { z } from "zod";

export const taskStatusSchema = z.enum(["todo", "in_progress", "done"]);

export const taskPrioritySchema = z.enum(["low", "medium", "high"]);

const timestampWithTimezoneSchema = z
  .string()
  .datetime({ offset: true })
  .transform((value) => new Date(value));

const titleSchema = z
  .string()
  .trim()
  .min(1, "title must not be empty");

export const taskIdParamsSchema = z.object({
  id: z.string().uuid("id must be a valid UUID")
});

export const createTaskSchema = z
  .object({
    title: titleSchema,
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema,
    due_date: timestampWithTimezoneSchema.optional()
  })
  .strict();

export const patchTaskSchema = z
  .object({
    title: titleSchema.optional(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    due_date: timestampWithTimezoneSchema.nullable().optional()
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "request body must contain at least one field"
  });

export const putTaskSchema = z
  .object({
    title: titleSchema,
    status: taskStatusSchema,
    priority: taskPrioritySchema,
    due_date: timestampWithTimezoneSchema.nullable()
  })
  .strict();

export type CreateTaskRequest = z.infer<typeof createTaskSchema>;
export type PatchTaskRequest = z.infer<typeof patchTaskSchema>;
export type PutTaskRequest = z.infer<typeof putTaskSchema>;
