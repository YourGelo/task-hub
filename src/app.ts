import cors from "cors";
import express from "express";
import helmet from "helmet";

import { taskRoutes } from "./modules/tasks/task.routes.js";

export function createApp() {
  const app = express();

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

  return app;
}
