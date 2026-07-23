import type { Request, Response } from "express";

import { NotFoundError, UnprocessableEntityError } from "../../common/errors/app-error.js";
import { mapTaskToResponse } from "./task.mapper.js";
import {
  createTaskSchema,
  listTasksQuerySchema,
  patchTaskSchema,
  putTaskSchema,
  taskIdParamsSchema
} from "./task.schemas.js";
import { TaskService } from "./task.service.js";
import type { PatchTaskInput } from "./task.types.js";

export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  createTask = async (req: Request, res: Response) => {
    const body = createTaskSchema.parse(req.body);

    if (body.due_date && body.due_date.getTime() < Date.now()) {
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

    const task = await this.taskService.createTask({
      title: body.title,
      status: body.status,
      priority: body.priority,
      dueDate: body.due_date ?? null
    });

    res
      .location(`/tasks/${task.id}`)
      .status(201)
      .json(mapTaskToResponse(task));
  };

  getTask = async (req: Request, res: Response) => {
    const { id } = taskIdParamsSchema.parse(req.params);

    const task = await this.taskService.getTask(id);

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    res.status(200).json(mapTaskToResponse(task));
  };

  listTasks = async (req: Request, res: Response) => {
    const query = listTasksQuerySchema.parse(req.query);

    const result = await this.taskService.listTasks({
      offset: query.offset,
      limit: query.limit,
      status: query.status,
      sort: query.sort,
      order: query.order
    });

    res.status(200).json({
      items: result.items.map(mapTaskToResponse),
      pagination: {
        offset: query.offset,
        limit: query.limit,
        total: result.total
      }
    });
  };

  patchTask = async (req: Request, res: Response) => {
    const { id } = taskIdParamsSchema.parse(req.params);
    const body = patchTaskSchema.parse(req.body);

    const updateData: PatchTaskInput = {};

    if (body.title !== undefined) {
      updateData.title = body.title;
    }

    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    if (body.priority !== undefined) {
      updateData.priority = body.priority;
    }

    if (Object.prototype.hasOwnProperty.call(body, "due_date")) {
      updateData.dueDate = body.due_date ?? null;
    }

    const task = await this.taskService.patchTask(id, updateData);

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    res.status(200).json(mapTaskToResponse(task));
  };

  putTask = async (req: Request, res: Response) => {
    const { id } = taskIdParamsSchema.parse(req.params);
    const body = putTaskSchema.parse(req.body);

    const task = await this.taskService.putTask(id, {
      title: body.title,
      status: body.status,
      priority: body.priority,
      dueDate: body.due_date
    });

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    res.status(200).json(mapTaskToResponse(task));
  };

  deleteTask = async (req: Request, res: Response) => {
    const { id } = taskIdParamsSchema.parse(req.params);

    const deleted = await this.taskService.deleteTask(id);

    if (!deleted) {
      throw new NotFoundError("Task not found");
    }

    res.status(204).send();
  };
}
