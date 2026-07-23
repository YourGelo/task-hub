import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../../src/app.js";
import { prisma } from "../../src/infrastructure/database/prisma.js";

const app = createApp();
const futureDate = "2035-01-01T10:00:00Z";
const pastDate = "2020-01-01T10:00:00Z";

async function createTask(
  overrides: Record<string, unknown> = {}
): Promise<Record<string, unknown>> {
  const response = await request(app)
    .post("/tasks")
    .send({
      title: "Test task",
      priority: "medium",
      ...overrides
    })
    .expect(201);

  return response.body as Record<string, unknown>;
}

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

describe("service endpoints", () => {
  it("returns application and database health", async () => {
    await request(app)
      .get("/health")
      .expect(200, {
        status: "ok",
        service: "task-hub"
      });

    await request(app)
      .get("/health/db")
      .expect(200, {
        status: "ok",
        database: "ok"
      });
  });

  it("returns JSON for an unknown route and preserves request id", async () => {
    const response = await request(app)
      .get("/missing")
      .set("X-Request-Id", "demo-request-id")
      .expect(404);

    expect(response.headers["x-request-id"]).toBe("demo-request-id");
    expect(response.body.error).toEqual({
      code: "NOT_FOUND",
      message: "Route not found",
      details: [],
      request_id: "demo-request-id"
    });
  });
});

describe("POST /tasks", () => {
  it("creates a task, applies the default status and returns server fields", async () => {
    const response = await request(app)
      .post("/tasks")
      .send({
        title: "  Create tests  ",
        priority: "high",
        due_date: "2035-01-01T13:00:00+03:00"
      })
      .expect(201);

    expect(response.headers.location).toBe(`/tasks/${response.body.id}`);
    expect(response.body).toMatchObject({
      title: "Create tests",
      status: "todo",
      priority: "high",
      due_date: "2035-01-01T10:00:00.000Z"
    });
    expect(response.body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(Date.parse(response.body.created_at)).not.toBeNaN();
    expect(Date.parse(response.body.updated_at)).not.toBeNaN();
  });

  it.each([
    [{ title: "Invalid task", priority: "urgent" }, "priority"],
    [{ title: "", priority: "low" }, "title"],
    [{ title: "No timezone", priority: "low", due_date: "2035-01-01T10:00:00" }, "due_date"],
    [{ title: "Date only", priority: "low", due_date: "2035-01-01" }, "due_date"],
    [{ title: "Technical field", priority: "low", id: crypto.randomUUID() }, ""]
  ])("rejects invalid create body %#", async (body, field) => {
    const response = await request(app)
      .post("/tasks")
      .send(body)
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field
        })
      ])
    );
  });

  it("rejects due_date in the past as a business-rule violation", async () => {
    const response = await request(app)
      .post("/tasks")
      .send({
        title: "Past task",
        priority: "low",
        due_date: pastDate
      })
      .expect(422);

    expect(response.body.error).toMatchObject({
      code: "UNPROCESSABLE_ENTITY",
      details: [
        {
          field: "due_date",
          message: "Expected a current or future timestamp"
        }
      ]
    });
  });

  it("returns INVALID_JSON for malformed JSON", async () => {
    const response = await request(app)
      .post("/tasks")
      .set("Content-Type", "application/json")
      .send('{"title":')
      .expect(400);

    expect(response.body.error.code).toBe("INVALID_JSON");
  });
});

describe("GET /tasks and GET /tasks/:id", () => {
  it("gets an existing task and returns 404 for a missing task", async () => {
    const task = await createTask();

    const response = await request(app)
      .get(`/tasks/${task.id}`)
      .expect(200);

    expect(response.body.id).toBe(task.id);

    await request(app)
      .get(`/${"tasks"}/${crypto.randomUUID()}`)
      .expect(404);
  });

  it("rejects an invalid UUID", async () => {
    const response = await request(app)
      .get("/tasks/not-a-uuid")
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details[0].field).toBe("id");
  });

  it("combines status filtering, priority sorting and pagination", async () => {
    await createTask({ title: "High", priority: "high", status: "todo" });
    await createTask({ title: "Low", priority: "low", status: "todo" });
    await createTask({ title: "Medium", priority: "medium", status: "todo" });
    await createTask({ title: "Done", priority: "low", status: "done" });

    const response = await request(app)
      .get("/tasks")
      .query({
        status: "todo",
        sort: "priority",
        order: "asc",
        offset: 1,
        limit: 1
      })
      .expect(200);

    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].title).toBe("Medium");
    expect(response.body.pagination).toEqual({
      offset: 1,
      limit: 1,
      total: 3
    });
  });

  it("keeps tasks without due_date last for both sort directions", async () => {
    await createTask({ title: "No due date", priority: "low" });
    await createTask({ title: "Later", priority: "low", due_date: "2035-01-03T10:00:00Z" });
    await createTask({ title: "Earlier", priority: "low", due_date: "2035-01-02T10:00:00Z" });

    for (const order of ["asc", "desc"]) {
      const response = await request(app)
        .get("/tasks")
        .query({ sort: "due_date", order })
        .expect(200);

      expect(response.body.items.at(-1).title).toBe("No due date");
    }
  });

  it.each([
    { offset: -1 },
    { limit: 0 },
    { limit: 101 },
    { status: "archived" },
    { sort: "title" },
    { order: "sideways" },
    { unknown: "value" }
  ])("rejects invalid list query %#", async (query) => {
    const response = await request(app)
      .get("/tasks")
      .query(query)
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("PATCH and PUT /tasks/:id", () => {
  it("partially updates a task and allows a past or null due_date", async () => {
    const task = await createTask({ due_date: futureDate });

    const patchResponse = await request(app)
      .patch(`/tasks/${task.id}`)
      .send({
        title: "Updated title",
        status: "in_progress",
        due_date: pastDate
      })
      .expect(200);

    expect(patchResponse.body).toMatchObject({
      id: task.id,
      title: "Updated title",
      status: "in_progress",
      priority: "medium",
      due_date: "2020-01-01T10:00:00.000Z"
    });

    const clearResponse = await request(app)
      .patch(`/tasks/${task.id}`)
      .send({ due_date: null })
      .expect(200);

    expect(clearResponse.body.due_date).toBeNull();
  });

  it.each([
    {},
    { id: crypto.randomUUID() },
    { created_at: futureDate }
  ])("rejects an empty or technical PATCH body %#", async (body) => {
    const task = await createTask();
    const response = await request(app)
      .patch(`/tasks/${task.id}`)
      .send(body)
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("fully replaces mutable fields with PUT and allows a past due_date", async () => {
    const task = await createTask({
      title: "Before PUT",
      priority: "low",
      due_date: futureDate
    });

    const response = await request(app)
      .put(`/tasks/${task.id}`)
      .send({
        title: "After PUT",
        status: "done",
        priority: "high",
        due_date: pastDate
      })
      .expect(200);

    expect(response.body).toMatchObject({
      id: task.id,
      title: "After PUT",
      status: "done",
      priority: "high",
      due_date: "2020-01-01T10:00:00.000Z"
    });
  });

  it("requires all mutable fields including due_date for PUT", async () => {
    const task = await createTask();
    const response = await request(app)
      .put(`/tasks/${task.id}`)
      .send({
        title: "Incomplete PUT",
        status: "todo",
        priority: "low"
      })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details[0].field).toBe("due_date");
  });
});

describe("DELETE /tasks/:id", () => {
  it("soft-deletes a task, preserves it in the database and hides it from the API", async () => {
    const task = await createTask({ status: "in_progress" });

    await request(app)
      .delete(`/tasks/${task.id}`)
      .expect(204);

    const storedTask = await prisma.task.findUnique({
      where: { id: task.id as string }
    });

    expect(storedTask).not.toBeNull();
    expect(storedTask?.status).toBe("in_progress");
    expect(storedTask?.deletedAt).toBeInstanceOf(Date);

    await request(app)
      .get(`/tasks/${task.id}`)
      .expect(404);

    const listResponse = await request(app)
      .get("/tasks")
      .expect(200);

    expect(listResponse.body.items).toHaveLength(0);

    await request(app)
      .delete(`/tasks/${task.id}`)
      .expect(404);
  });
});
