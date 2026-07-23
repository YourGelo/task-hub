import type { Request, Response } from "express";

import { ServiceUnavailableError } from "../../common/errors/app-error.js";
import { HealthService } from "./health.service.js";

export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  getHealth = (_req: Request, res: Response) => {
    res.status(200).json(this.healthService.getAppHealth());
  };

  getDatabaseHealth = async (_req: Request, res: Response) => {
    try {
      const health = await this.healthService.getDatabaseHealth();

      res.status(200).json(health);
    } catch {
      throw new ServiceUnavailableError(
        "Database is unavailable",
        [
          {
            field: "database",
            message: "PostgreSQL connection check failed"
          }
        ]
      );
    }
  };
}
