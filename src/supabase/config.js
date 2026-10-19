import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Project Configuration
 * Credentials are loaded from .env.local (git-ignored)
 * Vite exposes env vars prefixed with VITE_ via import.meta.env
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env variables. Check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
