-- Grant usage on public schema (usually default, but ensures visibility)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant access to the inventory_items table
GRANT ALL ON TABLE inventory_items TO authenticated;
GRANT ALL ON TABLE inventory_items TO service_role;
-- If public/anon needs read access (optional, usually not for admin stuff)
-- GRANT SELECT ON TABLE inventory_items TO anon;

-- Grant access to the functions
GRANT EXECUTE ON FUNCTION get_inventory_v2() TO authenticated;
GRANT EXECUTE ON FUNCTION get_inventory_v2() TO service_role;

GRANT EXECUTE ON FUNCTION register_entry_v2(uuid, text, text, numeric, numeric, date) TO authenticated;
GRANT EXECUTE ON FUNCTION register_entry_v2(uuid, text, text, numeric, numeric, date) TO service_role;

-- Refresh schema cache workaround (notify PostgREST)
NOTIFY pgrst, 'reload config';
