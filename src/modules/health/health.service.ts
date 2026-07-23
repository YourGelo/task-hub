import type { PrismaClient } from "@prisma/client";

export class HealthService {
  constructor(private readonly db: PrismaClient) {}

  getAppHealth() {
    return {
      status: "ok",
      service: "task-hub"
    };
  }

  async getDatabaseHealth() {
    await this.db.$queryRaw`SELECT 1`;

    return {
      status: "ok",
      database: "ok"
    };
  }
}
