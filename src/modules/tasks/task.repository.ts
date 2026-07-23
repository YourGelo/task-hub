import type { Prisma, PrismaClient } from "@prisma/client";

import type { ListTasksInput } from "./task.types.js";

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

  async findMany(input: ListTasksInput) {
    const where: Prisma.TaskWhereInput = {
      deletedAt: null
    };

    if (input.status) {
      where.status = input.status;
    }

    const [items, total] = await this.db.$transaction([
      this.db.task.findMany({
        where,
        skip: input.offset,
        take: input.limit,
        orderBy: this.buildOrderBy(input)
      }),

      this.db.task.count({
        where
      })
    ]);

    return {
      items,
      total
    };
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

  private buildOrderBy(input: ListTasksInput): Prisma.TaskOrderByWithRelationInput[] {
    if (input.sort === "due_date") {
      return [
        {
          dueDate: {
            sort: input.order,
            nulls: "last"
          }
        },
        {
          createdAt: "desc"
        },
        {
          id: "asc"
        }
      ];
    }

    if (input.sort === "priority") {
      return [
        {
          priority: input.order
        },
        {
          createdAt: "desc"
        },
        {
          id: "asc"
        }
      ];
    }

    return [
      {
        createdAt: "desc"
      },
      {
        id: "asc"
      }
    ];
  }
}
