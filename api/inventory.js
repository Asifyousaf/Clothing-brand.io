// inventory.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vfcajbxgvievqettjanj.supabase.co'; // Directly add your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmY2FqYnhndmlldnFldHRqYW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkxMDM0NDYsImV4cCI6MjA0NDY3OTQ0Nn0.dMfKKUfSd6McT9RLknOK6PMZ4QYTEElzodsWNhNUh1M'; // Directly add your service role key

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    const { productId } = req.query; // Extract the productId from query parameters

    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId); // Filter by product ID

        if (error) {
            console.error('Error fetching data from Supabase:', error);
            return res.status(500).json({ error: 'Failed to fetch data from Supabase', details: error });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Database query error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
