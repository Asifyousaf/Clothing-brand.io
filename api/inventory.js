const { createClient } = require('@supabase/supabase-js');

// Supabase project URL and service role key from environment variables
const supabaseUrl = process.env.SUPABASE_URL; // Ensure this is set in Vercel environment variables
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Ensure this is set in Vercel environment variables

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    try {
        const { data, error } = await supabase
            .from('products') // Ensure this table name is correct
            .select('*');

        if (error) {
            console.error('Error fetching data from Supabase:', error.message);
            return res.status(500).json({ error: 'Failed to fetch data from Supabase' });
        }

        console.log('Fetched Inventory:', data); // Log the fetched inventory
        res.status(200).json(data); // Send the inventory data as JSON
    } catch (error) {
        console.error('Database query error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
