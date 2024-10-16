const { createClient } = require('@supabase/supabase-js');

// Supabase project URL and service role key from environment variables
const supabaseUrl = process.env.SUPABASE_URL; // Ensure this is set in Vercel environment variables
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Ensure this is set in Vercel environment variables

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
