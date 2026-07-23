import cors from "cors";
import express from "express";
import helmet from "helmet";

import { NotFoundError } from "./common/errors/app-error.js";
import { errorHandler } from "./common/middleware/error-handler.js";
import { requestIdMiddleware } from "./common/middleware/request-id.js";
import { corsOptions } from "./config/cors.js";
import { registerOpenApiDocs } from "./docs/openapi.js";
import { healthRoutes } from "./modules/health/health.routes.js";
import { taskRoutes } from "./modules/tasks/task.routes.js";

export function createApp() {
  const app = express();

  app.use(requestIdMiddleware);
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json());

  app.use("/health", healthRoutes);
  registerOpenApiDocs(app);
  app.use("/tasks", taskRoutes);

  app.use((_req, _res, next) => {
    next(new NotFoundError("Route not found"));
  });

  app.use(errorHandler);

  return app;
}
