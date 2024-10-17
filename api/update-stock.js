const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')('sk_test_51Q6qZ8Rxk79NacxxJgyYInUBdiJ2Pcqm8otxx0l4TBywHa9BM2clTwi9Siiilxzh7dIcmqMOiG5f0IlJsfOMauIQ00ZgqTu36r');

const supabaseUrl = 'https://vfcajbxgvievqettjanj.supabase.co'; // Directly add your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmY2FqYnhndmlldnFldHRqYW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkxMDM0NDYsImV4cCI6MjA0NDY3OTQ0Nn0.dMfKKUfSd6McT9RLknOK6PMZ4QYTEElzodsWNhNUh1M'; // Service role key

const supabase = createClient(supabaseUrl, supabaseKey);

// Handler to process webhook and update stock
export default async function handler(req, res) {
    if (req.method === 'POST') {
        // Stripe webhook logic
        const signature = req.headers['stripe-signature'];
        const endpointSecret = 'whsec_jpk9R320UxDDfTM28wFdxpAIHkEo3pJ4'; // Webhook secret

        let event;

        try {
            event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
        } catch (err) {
            console.error('Webhook signature verification failed:', err);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        // Handle the checkout session completed event
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const cartItems = session.metadata.cartItems ? JSON.parse(session.metadata.cartItems) : [];

            // Update stock in Supabase using cartItems
            await updateStockInSupabase(cartItems);

            return res.status(200).json({ received: true });
        } else {
            return res.status(400).json({ error: 'Unhandled event type' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

// Update stock function
async function updateStockInSupabase(cartItems) {
    try {
        for (const item of cartItems) {
            const { productId, size, color, quantity } = item;

            // Fetch the current stock from Supabase
            const { data: product, error } = await supabase
                .from('products')
                .select('stock')
                .eq('id', productId)
                .single();

            if (error) throw new Error('Error fetching product stock');

            // Decrease the stock
            const updatedStock = product.stock[size][color] - quantity;
            if (updatedStock < 0) throw new Error('Insufficient stock');

            // Update stock in Supabase
            product.stock[size][color] = updatedStock;

            const { error: updateError } = await supabase
                .from('products')
                .update({ stock: product.stock })
                .eq('id', productId);

            if (updateError) throw new Error('Error updating stock in Supabase');
        }
        console.log('Stock successfully updated');
    } catch (error) {
        console.error('Error updating stock:', error);
    }
}
