import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(7801),

  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required"),

  CORS_ORIGIN: z
    .string()
    .default("http://localhost:7802,http://localhost:5173")
});

export const env = envSchema.parse(process.env);
