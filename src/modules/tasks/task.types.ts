export type TaskStatus = "todo" | "in_progress" | "done";

export type TaskPriority = "low" | "medium" | "high";

export type ListTasksSort = "due_date" | "priority";

export type SortOrder = "asc" | "desc";

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

export type ListTasksInput = {
  offset: number;
  limit: number;
  status?: TaskStatus;
  sort?: ListTasksSort;
  order: SortOrder;
};
