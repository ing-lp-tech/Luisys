import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xmyuztkbevcsbcpxlyhf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhteXV6dGtiZXZjc2JjcHhseWhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NzQ4MDgsImV4cCI6MjA4MjU1MDgwOH0.5WGa0VLdIp1fJsgmKnqswemWt3e2gian3v2YYOdVNps';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
