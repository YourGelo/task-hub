import { Router } from "express";

import { prisma } from "../../infrastructure/database/prisma.js";
import { NoopIntegrationEventPublisher } from "../../integrations/noop-event-publisher.js";
import { TaskController } from "./task.controller.js";
import { TaskRepository } from "./task.repository.js";
import { TaskService } from "./task.service.js";

const taskRepository = new TaskRepository(prisma);
const eventPublisher = new NoopIntegrationEventPublisher();
const taskService = new TaskService(taskRepository, eventPublisher);
const taskController = new TaskController(taskService);

export const taskRoutes = Router();

taskRoutes.post("/", taskController.createTask);
taskRoutes.get("/", taskController.listTasks);
taskRoutes.get("/:id", taskController.getTask);
taskRoutes.patch("/:id", taskController.patchTask);
taskRoutes.put("/:id", taskController.putTask);
taskRoutes.delete("/:id", taskController.deleteTask);
