
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) {
        console.log('Error accessing profiles:', error.message);
        // Try another common name
        const { data: data2, error: error2 } = await supabase.from('users').select('*').limit(1);
        if (error2) {
            console.log('Error accessing users:', error2.message);
        } else {
            console.log('Table "users" exists');
        }
    } else {
        console.log('Table "profiles" exists');
        if (data && data.length > 0) {
            console.log('Sample profile access successful');
        }
    }
}

checkTables();
