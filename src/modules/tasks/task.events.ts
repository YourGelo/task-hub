import { randomUUID } from "node:crypto";

import type { Task } from "@prisma/client";

type TaskSnapshot = {
  id: string;
  title: string;
  status: Task["status"];
  priority: Task["priority"];
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

type TaskEventBase = {
  event_id: string;
  occurred_at: string;
  task_id: string;
};

export type TaskEvent =
  | (TaskEventBase & {
      event_type: "task.created";
      data: { task: TaskSnapshot };
    })
  | (TaskEventBase & {
      event_type: "task.updated" | "task.completed";
      data: {
        changed_fields: string[];
        task: TaskSnapshot;
      };
    })
  | (TaskEventBase & {
      event_type: "task.deleted";
      data: { task: TaskSnapshot };
    });

function snapshotTask(task: Task): TaskSnapshot {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    due_date: task.dueDate?.toISOString() ?? null,
    created_at: task.createdAt.toISOString(),
    updated_at: task.updatedAt.toISOString()
  };
}

function eventBase(task: Task): TaskEventBase {
  return {
    event_id: randomUUID(),
    occurred_at: new Date().toISOString(),
    task_id: task.id
  };
}

export function createTaskCreatedEvent(task: Task): TaskEvent {
  return {
    ...eventBase(task),
    event_type: "task.created",
    data: { task: snapshotTask(task) }
  };
}

export function createTaskUpdatedEvent(
  task: Task,
  changedFields: string[],
  completed: boolean
): TaskEvent {
  return {
    ...eventBase(task),
    event_type: completed ? "task.completed" : "task.updated",
    data: {
      changed_fields: changedFields,
      task: snapshotTask(task)
    }
  };
}

export function createTaskDeletedEvent(task: Task): TaskEvent {
  return {
    ...eventBase(task),
    event_type: "task.deleted",
    data: { task: snapshotTask(task) }
  };
}
