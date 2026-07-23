import type { Request, Response } from "express";

import { mapTaskToResponse } from "./task.mapper.js";
import { TaskService } from "./task.service.js";
import type { TaskPriority, TaskStatus } from "./task.types.js";

const taskStatuses: TaskStatus[] = ["todo", "in_progress", "done"];
const taskPriorities: TaskPriority[] = ["low", "medium", "high"];

function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && taskStatuses.includes(value as TaskStatus);
}

function isTaskPriority(value: unknown): value is TaskPriority {
  return typeof value === "string" && taskPriorities.includes(value as TaskPriority);
}

function parseDueDate(value: unknown): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("INVALID_DUE_DATE");
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("INVALID_DUE_DATE");
  }

  return date;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getRouteId(req: Request): string | null {
  const id = req.params.id;

  if (typeof id !== "string") {
    return null;
  }

  return id;
}

export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  createTask = async (req: Request, res: Response) => {
    try {
      const body = req.body as Record<string, unknown>;

      if (!isNonEmptyString(body.title)) {
        res.status(400).json({ error: "title is required" });
        return;
      }

      if (!isTaskPriority(body.priority)) {
        res.status(400).json({ error: "priority is invalid" });
        return;
      }

      if (body.status !== undefined && !isTaskStatus(body.status)) {
        res.status(400).json({ error: "status is invalid" });
        return;
      }

      const dueDate = parseDueDate(body.due_date);

      if (dueDate && dueDate.getTime() < Date.now()) {
        res.status(422).json({
          error: "due_date cannot be in the past when creating a task"
        });
        return;
      }

      const task = await this.taskService.createTask({
        title: body.title.trim(),
        status: body.status as TaskStatus | undefined,
        priority: body.priority,
        dueDate
      });

      res
        .location(`/tasks/${task.id}`)
        .status(201)
        .json(mapTaskToResponse(task));
    } catch (error) {
      res.status(400).json({ error: "invalid request data" });
    }
  };

  getTask = async (req: Request, res: Response) => {
    const id = getRouteId(req);

    if (!id) {
      res.status(400).json({ error: "id is invalid" });
      return;
    }

    const task = await this.taskService.getTask(id);

    if (!task) {
      res.status(404).json({ error: "task not found" });
      return;
    }

    res.status(200).json(mapTaskToResponse(task));
  };

  listTasks = async (_req: Request, res: Response) => {
    const tasks = await this.taskService.listTasks();

    res.status(200).json({
      items: tasks.map(mapTaskToResponse)
    });
  };

  patchTask = async (req: Request, res: Response) => {
    try {
      const id = getRouteId(req);

      if (!id) {
        res.status(400).json({ error: "id is invalid" });
        return;
      }

      const body = req.body as Record<string, unknown>;

      if ("id" in body) {
        res.status(400).json({ error: "id cannot be changed" });
        return;
      }

      const updateData: {
        title?: string;
        status?: TaskStatus;
        priority?: TaskPriority;
        dueDate?: Date | null;
      } = {};

      if ("title" in body) {
        if (!isNonEmptyString(body.title)) {
          res.status(400).json({ error: "title is invalid" });
          return;
        }

        updateData.title = body.title.trim();
      }

      if ("status" in body) {
        if (!isTaskStatus(body.status)) {
          res.status(400).json({ error: "status is invalid" });
          return;
        }

        updateData.status = body.status;
      }

      if ("priority" in body) {
        if (!isTaskPriority(body.priority)) {
          res.status(400).json({ error: "priority is invalid" });
          return;
        }

        updateData.priority = body.priority;
      }

      if ("due_date" in body) {
        updateData.dueDate = parseDueDate(body.due_date) ?? null;
      }

      if (Object.keys(updateData).length === 0) {
        res.status(400).json({
          error: "request body must contain at least one field"
        });
        return;
      }

      const task = await this.taskService.patchTask(id, updateData);

      if (!task) {
        res.status(404).json({ error: "task not found" });
        return;
      }

      res.status(200).json(mapTaskToResponse(task));
    } catch (error) {
      res.status(400).json({ error: "invalid request data" });
    }
  };

  putTask = async (req: Request, res: Response) => {
    try {
      const id = getRouteId(req);

      if (!id) {
        res.status(400).json({ error: "id is invalid" });
        return;
      }

      const body = req.body as Record<string, unknown>;

      if ("id" in body) {
        res.status(400).json({ error: "id cannot be changed" });
        return;
      }

      if (!isNonEmptyString(body.title)) {
        res.status(400).json({ error: "title is required" });
        return;
      }

      if (!isTaskStatus(body.status)) {
        res.status(400).json({ error: "status is invalid" });
        return;
      }

      if (!isTaskPriority(body.priority)) {
        res.status(400).json({ error: "priority is invalid" });
        return;
      }

      if (!("due_date" in body)) {
        res.status(400).json({ error: "due_date key is required for PUT" });
        return;
      }

      const dueDate = parseDueDate(body.due_date) ?? null;

      const task = await this.taskService.putTask(id, {
        title: body.title.trim(),
        status: body.status,
        priority: body.priority,
        dueDate
      });

      if (!task) {
        res.status(404).json({ error: "task not found" });
        return;
      }

      res.status(200).json(mapTaskToResponse(task));
    } catch (error) {
      res.status(400).json({ error: "invalid request data" });
    }
  };

  deleteTask = async (req: Request, res: Response) => {
    const id = getRouteId(req);

    if (!id) {
      res.status(400).json({ error: "id is invalid" });
      return;
    }

    const deleted = await this.taskService.deleteTask(id);

    if (!deleted) {
      res.status(404).json({ error: "task not found" });
      return;
    }

    res.status(204).send();
  };
}
