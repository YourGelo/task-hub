import { z } from "zod";

export const taskStatusSchema = z.enum(["todo", "in_progress", "done"]);

export const taskPrioritySchema = z.enum(["low", "medium", "high"]);

export const taskSortSchema = z.enum(["due_date", "priority"]);

export const sortOrderSchema = z.enum(["asc", "desc"]);

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

export const listTasksQuerySchema = z
  .object({
    offset: z.coerce
      .number()
      .int()
      .min(0)
      .default(0),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20),

    status: taskStatusSchema.optional(),

    sort: taskSortSchema.optional(),

    order: sortOrderSchema.default("asc")
  })
  .strict();

export type CreateTaskRequest = z.infer<typeof createTaskSchema>;
export type PatchTaskRequest = z.infer<typeof patchTaskSchema>;
export type PutTaskRequest = z.infer<typeof putTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
