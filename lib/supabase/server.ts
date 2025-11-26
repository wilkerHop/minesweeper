import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// This client has admin privileges. Use with caution.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
