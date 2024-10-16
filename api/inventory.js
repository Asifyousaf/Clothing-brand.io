// api/inventory.js
const supabase = require('./db'); // Import the Supabase client from the same directory


export default async function handler(req, res) {
    try {
        // Adjust the query to retrieve your product inventory
        const result = await db.query('SELECT * FROM products'); // Replace 'products' with your table name if different
        res.status(200).json(result.rows); // Send the inventory data as JSON
    } catch (error) {
        console.error('Database query error', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
