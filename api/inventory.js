const path = require('path');
const supabase = require(path.join(__dirname, 'dib')); // Using __dirname to get the current directory
// or
// const supabase = require(path.resolve(__dirname, 'dib')); // Alternatively, use path.resolve

export default async function handler(req, res) {
    try {
        const { data, error } = await supabase
            .from('products') // Ensure this table name is correct
            .select('*');

        if (error) {
            console.error('Error fetching data from Supabase:', error.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        res.status(200).json(data); // Send the inventory data as JSON
    } catch (error) {
        console.error('Database query error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
