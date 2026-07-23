import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";

const openApiDocumentRaw = readFileSync(
  join(process.cwd(), "openapi.json"),
  "utf-8"
).replace(/^\uFEFF/, "");

const openApiDocument = JSON.parse(
  openApiDocumentRaw
) as Parameters<typeof swaggerUi.setup>[0];

export function registerOpenApiDocs(app: Express) {
  app.get("/openapi.json", (_req: Request, res: Response) => {
    res.status(200).json(openApiDocument);
  });

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
}
