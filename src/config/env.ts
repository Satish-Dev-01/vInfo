import { z } from 'zod';

/**
 * Environment Variable Schema & Validation
 * Ensures runtime environment validity with fail-fast behavior on misconfiguration.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('Vinfo Platform'),
  NEXT_PUBLIC_API_BASE_URL: z.string().default('/api'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

const parseEnv = () => {
  const result = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    LOG_LEVEL: process.env.LOG_LEVEL,
  });

  if (!result.success) {
    console.error('❌ Invalid environment variables configuration:', result.error.format());
    // Fallback to safe defaults in development
    if (process.env.NODE_ENV === 'development') {
      return envSchema.parse({});
    }
    throw new Error('Invalid environment configuration');
  }

  return result.data;
};

export const env = parseEnv();
