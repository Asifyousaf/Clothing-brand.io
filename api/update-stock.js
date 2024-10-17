const http = require('http');
const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')('sk_test_51Q6qZ8Rxk79NacxxJgyYInUBdiJ2Pcqm8otxx0l4TBywHa9BM2clTwi9Siiilxzh7dIcmqMOiG5f0IlJsfOMauIQ00ZgqTu36r');

const supabaseUrl = 'https://vfcajbxgvievqettjanj.supabase.co'; // Directly add your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmY2FqYnhndmlldnFldHRqYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTEwMzQ0NiwiZXhwIjoyMDQ0Njc5NDQ2fQ.NPOWDNnIHoW_iZqf4H5KgbfJSWOe6lZIU1kPagrQrxo'; // Service role key

const supabase = createClient(supabaseUrl, supabaseKey);

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/api/update-stock') {
        let body = '';

        // Read the request body as a stream of data
        req.on('data', chunk => {
            body += chunk;
        });

        req.on('end', async () => {
            const signature = req.headers['stripe-signature'];
            const endpointSecret = 'whsec_jpk9R320UxDDfTM28wFdxpAIHkEo3pJ4'; // Webhook secret

            let event;
            try {
                event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
            } catch (err) {
                console.error('Webhook signature verification failed:', err);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Webhook Error: ' + err.message }));
                return;
            }

            if (event.type === 'checkout.session.completed') {
                const session = event.data.object;
                const cartItems = session.metadata.cartItems ? JSON.parse(session.metadata.cartItems) : [];

                // Update stock in Supabase using cartItems
                await updateStockInSupabase(cartItems);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ received: true }));
            } else {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Unhandled event type' }));
            }
        });
    } else {
        // Respond with 405 Method Not Allowed if the method is not POST
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Method ${req.method} Not Allowed` }));
    }
});

async function updateStockInSupabase(cartItems) {
    try {
        for (const item of cartItems) {
            const { productId, size, color, quantity } = item;
            
            // Debug: Log cart item details
            console.log(`Updating stock for Product ID: ${productId}, Size: ${size}, Color: ${color}, Quantity: ${quantity}`);

            // Fetch the current stock from Supabase
            const { data: product, error } = await supabase
                .from('products')
                .select('stock')
                .eq('id', productId)
                .single();

            if (error) {
                throw new Error('Error fetching product stock');
            }

            // Debug: Log product data
            console.log('Product Data:', product);

            // Decrease the stock
            const updatedStock = product.stock[size][color] - quantity;
            if (updatedStock < 0) {
                throw new Error('Insufficient stock');
            }

            // Update stock in Supabase
            product.stock[size][color] = updatedStock;

            // Debug: Log updated stock
            console.log('Updated Stock:', product.stock);

            const { error: updateError } = await supabase
                .from('products')
                .update({ stock: product.stock })
                .eq('id', productId);

            if (updateError) {
                throw new Error('Error updating stock in Supabase');
            }
        }
        console.log('Stock successfully updated');
    } catch (error) {
        console.error('Error updating stock:', error);
    }
}


server.listen(3000, () => {
    console.log('Server listening on port 3000');
});
