// inventory.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

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
                .select('id, email, total_amount, currency, items, phone, shipping_address, created_at')); // Fetch specified fields from orders
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