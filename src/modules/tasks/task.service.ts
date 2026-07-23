import { UnprocessableEntityError } from "../../common/errors/app-error.js";
import type { IntegrationEventPublisher } from "../../integrations/integration-event-publisher.js";
import {
  createTaskCreatedEvent,
  createTaskDeletedEvent,
  createTaskUpdatedEvent
} from "./task.events.js";
import { TaskRepository } from "./task.repository.js";
import type {
  CreateTaskInput,
  ListTasksInput,
  PatchTaskInput,
  PutTaskInput
} from "./task.types.js";

export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly eventPublisher: IntegrationEventPublisher
  ) {}

  async createTask(input: CreateTaskInput) {
    if (input.dueDate && input.dueDate.getTime() < Date.now()) {
      throw new UnprocessableEntityError(
        "Due date cannot be in the past when creating a task",
        [
          {
            field: "due_date",
            message: "Expected a current or future timestamp"
          }
        ]
      );
    }

    const task = await this.taskRepository.create({
      title: input.title,
      status: input.status ?? "todo",
      priority: input.priority,
      dueDate: input.dueDate ?? null
    });

    await this.eventPublisher.publish(createTaskCreatedEvent(task));

    return task;
  }

  getTask(id: string) {
    return this.taskRepository.findById(id);
  }

  listTasks(input: ListTasksInput) {
    return this.taskRepository.findMany(input);
  }

  async patchTask(id: string, input: PatchTaskInput) {
    const existingTask = await this.taskRepository.findById(id);

    if (!existingTask) {
      return null;
    }

    const task = await this.taskRepository.update(id, input);
    const changedFields = Object.keys(input).map((field) =>
      field === "dueDate" ? "due_date" : field
    );
    const completed = existingTask.status !== "done" && task.status === "done";

    await this.eventPublisher.publish(
      createTaskUpdatedEvent(task, changedFields, completed)
    );

    return task;
  }

  async putTask(id: string, input: PutTaskInput) {
    const existingTask = await this.taskRepository.findById(id);

    if (!existingTask) {
      return null;
    }

    const task = await this.taskRepository.update(id, {
      title: input.title,
      status: input.status,
      priority: input.priority,
      dueDate: input.dueDate
    });
    const completed = existingTask.status !== "done" && task.status === "done";

    await this.eventPublisher.publish(
      createTaskUpdatedEvent(
        task,
        ["title", "status", "priority", "due_date"],
        completed
      )
    );

    return task;
  }

  async deleteTask(id: string) {
    const existingTask = await this.taskRepository.findById(id);

    if (!existingTask) {
      return false;
    }

    const deletedTask = await this.taskRepository.softDelete(id);
    await this.eventPublisher.publish(createTaskDeletedEvent(deletedTask));

    return true;
  }
}
