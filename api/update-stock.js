const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vfcajbxgvievqettjanj.supabase.co'; // Directly add your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmY2FqYnhndmlldnFldHRqYW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkxMDM0NDYsImV4cCI6MjA0NDY3OTQ0Nn0.dMfKKUfSd6McT9RLknOK6PMZ4QYTEElzodsWNhNUh1M'; // Directly add your service role key

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { productId, size, color, quantity } = req.body; // Get product details from request

        try {
            // Update stock logic (adjust the SQL query according to your table structure)
            const result = await supabase
                .from('products') // Ensure this table name is correct
                .update({
                    stock: supabase.raw(`stock - ${quantity}`) // Assuming stock is in JSON format, update the quantity
                })
                .match({ id: productId, [`stock->>${size}`]: { [`${color}`]: supabase.raw(`stock->>${size}->>'${color}'`) } })
                .select('*'); // Return the updated row

            if (result.error) {
                return res.status(404).json({ error: 'Product not found or insufficient stock' });
            }

            res.status(200).json(result.data[0]); // Send back updated product data
        } catch (error) {
            console.error('Database query error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
