// inventory.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vfcajbxgvievqettjanj.supabase.co'; // Directly add your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmY2FqYnhndmlldnFldHRqYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTEwMzQ0NiwiZXhwIjoyMDQ0Njc5NDQ2fQ.NPOWDNnIHoW_iZqf4H5KgbfJSWOe6lZIU1kPagrQrxo'; // Directly add your service role key

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    const { productId, fetchOrders } = req.query; // Extract productId and fetchOrders from query parameters

    try {
        let data;
        let error;

        if (fetchOrders) {
            // Fetch orders if 'fetchOrders' is true
            ({ data, error } = await supabase
                .from('orders')
                .select('*')); // Fetch all orders
        } else if (productId) {
            // Fetch specific product by ID
            ({ data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', productId));
        } else {
            // If no productId, return all products
            ({ data, error } = await supabase
                .from('products')
                .select('*')); // Fetch all products
        }

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