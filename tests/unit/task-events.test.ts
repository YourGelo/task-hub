import type { Task } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  createTaskCreatedEvent,
  createTaskDeletedEvent,
  createTaskUpdatedEvent
} from "../../src/modules/tasks/task.events.js";

const task: Task = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  title: "Integration-ready task",
  status: "done",
  priority: "high",
  dueDate: new Date("2035-01-01T10:00:00Z"),
  createdAt: new Date("2034-01-01T10:00:00Z"),
  updatedAt: new Date("2034-01-02T10:00:00Z"),
  deletedAt: null
};

describe("task domain events", () => {
  it("creates serializable created, completed and deleted events", () => {
    const created = createTaskCreatedEvent(task);
    const completed = createTaskUpdatedEvent(task, ["status"], true);
    const deleted = createTaskDeletedEvent(task);

    expect(created).toMatchObject({
      event_type: "task.created",
      task_id: task.id,
      data: {
        task: {
          id: task.id,
          due_date: "2035-01-01T10:00:00.000Z"
        }
      }
    });
    expect(completed).toMatchObject({
      event_type: "task.completed",
      data: {
        changed_fields: ["status"]
      }
    });
    expect(deleted.event_type).toBe("task.deleted");
    expect(new Set([
      created.event_id,
      completed.event_id,
      deleted.event_id
    ]).size).toBe(3);
  });
});
