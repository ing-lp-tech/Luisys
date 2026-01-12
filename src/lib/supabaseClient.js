import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uwtqrujdvpjrlllmffif.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_diqg59nOEhia9_sn3UA9OQ_jofFpQqI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
