const supabase = require('./db'); // Import the Supabase client from the same directory


export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { productId, size, color, quantity } = req.body; // Get product details from request

        try {
            // Update stock logic (adjust the SQL query according to your table structure)
            const result = await db.query(
                `UPDATE products 
                 SET stock = stock - $1 
                 WHERE id = $2 AND size = $3 AND color = $4 AND stock > 0 
                 RETURNING *`,
                [quantity, productId, size, color]
            );

            if (result.rowCount === 0) {
                return res.status(404).json({ error: 'Product not found or insufficient stock' });
            }

            res.status(200).json(result.rows[0]); // Send back updated product data
        } catch (error) {
            console.error('Database query error', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
