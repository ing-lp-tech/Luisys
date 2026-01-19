
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xmyuztkbevcsbcpxlyhf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhteXV6dGtiZXZjc2JjcHhseWhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NzQ4MDgsImV4cCI6MjA4MjU1MDgwOH0.5WGa0VLdIp1fJsgmKnqswemWt3e2gian3v2YYOdVNps';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
    console.log("Attempting insert...");
    const { data, error } = await supabase.from('leads').insert([{
        nombre: 'Test User Agent',
        telefono: '123456789',
        origen: 'script_test',
        created_at: new Date()
    }]).select();

    if (error) {
        console.error("Insert Error:", error);
    } else {
        console.log("Insert Success:", data);
    }
}

testInsert();
