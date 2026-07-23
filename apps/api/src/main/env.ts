import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

function origin(defaultValue: string) {
  const schema = isProduction ? z.string().url() : z.string().url().default(defaultValue);
  return schema.transform((value) => new URL(value).origin);
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  API_BASE_URL: origin("http://localhost:4000"),
  WEB_BASE_URL: origin("http://localhost:5173"),
  SESSION_SECRET: z.string().min(16),
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
  GITHUB_CLIENT_ID: z.string().default(""),
  GITHUB_CLIENT_SECRET: z.string().default("")
}).superRefine((value, context) => {
  const pairs = [
    ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"]
  ] as const;

  for (const [clientIdKey, clientSecretKey] of pairs) {
    const hasClientId = Boolean(value[clientIdKey].trim());
    const hasClientSecret = Boolean(value[clientSecretKey].trim());

    if (hasClientId !== hasClientSecret) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [hasClientId ? clientSecretKey : clientIdKey],
        message: `${clientIdKey} and ${clientSecretKey} must be configured together.`
      });
    }
  }
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid API environment variables", parsedEnv.error.flatten().fieldErrors);
  throw new Error("Invalid API environment variables");
}

export const env = parsedEnv.data;
