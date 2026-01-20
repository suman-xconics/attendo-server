/* eslint-disable node/no-process-env */

import path from "node:path";
import { config } from "dotenv";
import { expand } from "dotenv-expand";
import { z } from "zod";

expand(
  config({
    path: path.resolve(
      process.cwd(),
      process.env.NODE_ENV === "test" ? ".env.test" : ".env"
    ),
  })
);

const EnvSchema = z.object({
  NODE_ENV: z.string().default("development"),
  APP_NAME: z.string().default("Attendo Server"),
  PORT: z.coerce.number().default(8000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("debug"),

  WHITELISTED_ORIGINS: z
    .string()
    .default("http://localhost:8000")
    .transform((val) => val.split(","))
    .optional(),
  DATABASE_URL: z.url(),

  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
  BETTER_AUTH_URL: z
    .url("BETTER_AUTH_URL must be a valid URL")
    .min(1, "BETTER_AUTH_URL is required"),
  BETTER_AUTH_API_PATH: z.string(),
});

export type env = z.infer<typeof EnvSchema>;

// eslint-disable-next-line ts/no-redeclare
const { data: env, error } = EnvSchema.safeParse(process.env);

if (error) {
  console.error("❌ Invalid env:");
  console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export default env!;
