const { createClient } = require('@supabase/supabase-js');

// Access environment variables
const supabaseUrl = process.env.SUPABASE_URL; // Your Supabase project URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Your service role key

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Export the client for use in your API routes
module.exports = supabase;
