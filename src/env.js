import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    construction_POSTGRES_PRISMA_URL: z.string().url(),
    construction_POSTGRES_URL_NON_POOLING: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().default(3000),
    RESEND_API_KEY: z.string().optional(),
    APP_URL: z.string().url().default("http://localhost:3000"),
    BLOB_READ_WRITE_TOKEN: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    BETA_ACCESS_CODE: z.string().optional(),
    OPENWEATHERMAP_API_KEY: z.string().optional(),
    SENTRY_DSN: z.string().url().optional(),
    SENTRY_ORG: z.string().optional(),
    SENTRY_PROJECT: z.string().optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
    NEXT_PUBLIC_GOOGLE_PLACES_API_KEY: z.string().optional(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    construction_POSTGRES_PRISMA_URL: process.env.construction_POSTGRES_PRISMA_URL,
    construction_POSTGRES_URL_NON_POOLING: process.env.construction_POSTGRES_URL_NON_POOLING,
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    APP_URL: process.env.APP_URL,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN || undefined,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    BETA_ACCESS_CODE: process.env.BETA_ACCESS_CODE,
    OPENWEATHERMAP_API_KEY: process.env.OPENWEATHERMAP_API_KEY,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_GOOGLE_PLACES_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
