import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../../src/app.js";
import { prisma } from "../../src/infrastructure/database/prisma.js";

const app = createApp();

beforeAll(async () => {
  await prisma.$connect();
});

beforeEach(async () => {
  await prisma.task.deleteMany();
});

afterAll(async () => {
  await prisma.task.deleteMany();
  await prisma.$disconnect();
});

describe("health endpoints", () => {
  it("returns application health", async () => {
    const response = await request(app)
      .get("/health")
      .expect(200);

    expect(response.body).toEqual({
      status: "ok",
      service: "task-hub"
    });
  });

  it("returns database health", async () => {
    const response = await request(app)
      .get("/health/db")
      .expect(200);

    expect(response.body).toEqual({
      status: "ok",
      database: "ok"
    });
  });
});

describe("tasks API", () => {
  it("creates a task", async () => {
    const response = await request(app)
      .post("/tasks")
      .send({
        title: "Create tests",
        priority: "high",
        due_date: "2030-01-01T10:00:00Z"
      })
      .expect(201);

    expect(response.headers.location).toBe(`/tasks/${response.body.id}`);
    expect(response.body).toMatchObject({
      title: "Create tests",
      status: "todo",
      priority: "high",
      due_date: "2030-01-01T10:00:00.000Z"
    });
  });

  it("rejects invalid priority", async () => {
    const response = await request(app)
      .post("/tasks")
      .send({
        title: "Invalid task",
        priority: "urgent"
      })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details[0].field).toBe("priority");
  });

  it("rejects due_date in the past on create", async () => {
    const response = await request(app)
      .post("/tasks")
      .send({
        title: "Past task",
        priority: "low",
        due_date: "2020-01-01T10:00:00Z"
      })
      .expect(422);

    expect(response.body.error.code).toBe("UNPROCESSABLE_ENTITY");
  });

  it("lists tasks with filtering sorting and pagination", async () => {
    await request(app)
      .post("/tasks")
      .send({
        title: "Low task",
        priority: "low",
        status: "todo",
        due_date: "2030-01-03T10:00:00Z"
      })
      .expect(201);

    await request(app)
      .post("/tasks")
      .send({
        title: "Medium task",
        priority: "medium",
        status: "in_progress",
        due_date: "2030-01-02T10:00:00Z"
      })
      .expect(201);

    await request(app)
      .post("/tasks")
      .send({
        title: "High task",
        priority: "high",
        status: "done"
      })
      .expect(201);

    const response = await request(app)
      .get("/tasks")
      .query({
        sort: "priority",
        order: "asc",
        offset: 0,
        limit: 10
      })
      .expect(200);

    expect(response.body.items.map((task: { priority: string }) => task.priority)).toEqual([
      "low",
      "medium",
      "high"
    ]);

    expect(response.body.pagination).toEqual({
      offset: 0,
      limit: 10,
      total: 3
    });

    const filteredResponse = await request(app)
      .get("/tasks")
      .query({
        status: "in_progress"
      })
      .expect(200);

    expect(filteredResponse.body.items).toHaveLength(1);
    expect(filteredResponse.body.items[0].title).toBe("Medium task");
  });

  it("updates and deletes a task", async () => {
    const createResponse = await request(app)
      .post("/tasks")
      .send({
        title: "Task to update",
        priority: "medium"
      })
      .expect(201);

    const taskId = createResponse.body.id as string;

    const patchResponse = await request(app)
      .patch(`/tasks/${taskId}`)
      .send({
        status: "in_progress",
        priority: "high"
      })
      .expect(200);

    expect(patchResponse.body).toMatchObject({
      id: taskId,
      title: "Task to update",
      status: "in_progress",
      priority: "high"
    });

    await request(app)
      .delete(`/tasks/${taskId}`)
      .expect(204);

    const getDeletedResponse = await request(app)
      .get(`/tasks/${taskId}`)
      .expect(404);

    expect(getDeletedResponse.body.error.code).toBe("NOT_FOUND");
  });
});
