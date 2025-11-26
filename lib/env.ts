import { z } from 'zod';

/**
 * Schema for environment variables validation
 * Ensures all required secrets and configurations are present
 */
const envSchema = z.object({
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Turso Configuration
  TURSO_DATABASE_URL: z.string().url(),
  TURSO_AUTH_TOKEN: z.string().min(1),

  // Cloudflare R2 Configuration
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),

  // App Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

/**
 * Validated environment variables
 * @throws {ZodError} if validation fails in production
 */
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  // In development/build, use defaults if validation fails
  if (process.env.NODE_ENV === 'production') {
    console.error('Environment validation failed:', error);
    throw error;
  }
  
  console.warn('⚠️  Using default environment values for development');
  env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL || 'https://placeholder.turso.io',
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN || 'placeholder',
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID || 'placeholder',
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || 'placeholder',
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || 'placeholder',
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || 'placeholder',
    NODE_ENV: (process.env.NODE_ENV as any) || 'development',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  };
}

export { env };
export type Env = z.infer<typeof envSchema>;
