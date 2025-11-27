import { env } from '@/lib/env';
import { createClient } from '@supabase/supabase-js';

// This client has admin privileges. Use with caution.
export const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
