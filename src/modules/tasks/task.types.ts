export type TaskStatus = "todo" | "in_progress" | "done";

export type TaskPriority = "low" | "medium" | "high";

export type CreateTaskInput = {
  title: string;
  status?: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date | null;
};

export type PatchTaskInput = {
  title?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
};

export type PutTaskInput = {
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
};
