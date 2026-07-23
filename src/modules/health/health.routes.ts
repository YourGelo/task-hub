import { Router } from "express";

import { prisma } from "../../infrastructure/database/prisma.js";
import { HealthController } from "./health.controller.js";
import { HealthService } from "./health.service.js";

const healthService = new HealthService(prisma);
const healthController = new HealthController(healthService);

export const healthRoutes = Router();

healthRoutes.get("/", healthController.getHealth);
healthRoutes.get("/db", healthController.getDatabaseHealth);
