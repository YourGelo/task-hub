import type { Prisma, PrismaClient } from "@prisma/client";

export class TaskRepository {
  constructor(private readonly db: PrismaClient) {}

  create(data: Prisma.TaskCreateInput) {
    return this.db.task.create({
      data
    });
  }

  findById(id: string) {
    return this.db.task.findFirst({
      where: {
        id,
        deletedAt: null
      }
    });
  }

  findMany() {
    return this.db.task.findMany({
      where: {
        deletedAt: null
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  update(id: string, data: Prisma.TaskUpdateInput) {
    return this.db.task.update({
      where: {
        id
      },
      data
    });
  }

  softDelete(id: string) {
    return this.db.task.update({
      where: {
        id
      },
      data: {
        deletedAt: new Date()
      }
    });
  }
}
