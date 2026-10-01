import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_KEY. Copy .env.example to .env.local.',
  );
}

// Browser defaults: session persisted in localStorage, tokens auto-refreshed, and the
// OAuth / email-confirmation redirect picked up from the URL on load.
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
