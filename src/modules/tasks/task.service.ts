import type {
  CreateTaskInput,
  PatchTaskInput,
  PutTaskInput
} from "./task.types.js";

import { TaskRepository } from "./task.repository.js";

export class TaskService {
  constructor(private readonly taskRepository: TaskRepository) {}

  createTask(input: CreateTaskInput) {
    return this.taskRepository.create({
      title: input.title,
      status: input.status ?? "todo",
      priority: input.priority,
      dueDate: input.dueDate ?? null
    });
  }

  getTask(id: string) {
    return this.taskRepository.findById(id);
  }

  listTasks() {
    return this.taskRepository.findMany();
  }

  async patchTask(id: string, input: PatchTaskInput) {
    const existingTask = await this.taskRepository.findById(id);

    if (!existingTask) {
      return null;
    }

    return this.taskRepository.update(id, input);
  }

  async putTask(id: string, input: PutTaskInput) {
    const existingTask = await this.taskRepository.findById(id);

    if (!existingTask) {
      return null;
    }

    return this.taskRepository.update(id, {
      title: input.title,
      status: input.status,
      priority: input.priority,
      dueDate: input.dueDate
    });
  }

  async deleteTask(id: string) {
    const existingTask = await this.taskRepository.findById(id);

    if (!existingTask) {
      return false;
    }

    await this.taskRepository.softDelete(id);

    return true;
  }
}
