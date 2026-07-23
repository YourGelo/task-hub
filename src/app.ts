import cors from "cors";
import express from "express";
import helmet from "helmet";

import { errorHandler } from "./common/middleware/error-handler.js";
import { requestIdMiddleware } from "./common/middleware/request-id.js";
import { taskRoutes } from "./modules/tasks/task.routes.js";

export function createApp() {
  const app = express();

  app.use(requestIdMiddleware);
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "task-hub"
    });
  });

  app.use("/tasks", taskRoutes);

  app.use(errorHandler);

  return app;
}
