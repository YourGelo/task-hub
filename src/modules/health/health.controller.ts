import type { Request, Response } from "express";

import { HealthService } from "./health.service.js";

export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  getHealth = (_req: Request, res: Response) => {
    res.status(200).json(this.healthService.getAppHealth());
  };

  getDatabaseHealth = async (_req: Request, res: Response) => {
    const health = await this.healthService.getDatabaseHealth();

    res.status(200).json(health);
  };
}
