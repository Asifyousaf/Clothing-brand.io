const http = require('http');
const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')('sk_test_51Q6qZ8Rxk79NacxxJgyYInUBdiJ2Pcqm8otxx0l4TBywHa9BM2clTwi9Siiilxzh7dIcmqMOiG5f0IlJsfOMauIQ00ZgqTu36r');

const supabaseUrl = 'https://vfcajbxgvievqettjanj.supabase.co'; // Directly add your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmY2FqYnhndmlldnFldHRqYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTEwMzQ0NiwiZXhwIjoyMDQ0Njc5NDQ2fQ.NPOWDNnIHoW_iZqf4H5KgbfJSWOe6lZIU1kPagrQrxo'; // Service role key

const supabase = createClient(supabaseUrl, supabaseKey);

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/api/update-stock') {
        let body = '';

        req.on('data', chunk => {
            body += chunk;
        });

        req.on('end', async () => {
            const signature = req.headers['stripe-signature'];
            const endpointSecret = 'whsec_jpk9R320UxDDfTM28wFdxpAIHkEo3pJ4';

            let event;
            try {
                event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
            } catch (err) {
                console.error('Webhook signature verification failed:', err);
                logToFile('Webhook signature verification failed: ' + err.message);  // Log error to file
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Webhook Error: ' + err.message }));
                return;
            }

            if (event.type === 'checkout.session.completed') {
                const session = event.data.object;
                const cartItems = session.metadata.cartItems ? JSON.parse(session.metadata.cartItems) : [];

                try {
                    // Update stock
                    await updateStockInSupabase(cartItems);
                    console.log('Stock updated successfully.');
                    logToFile('Stock updated successfully.');
                } catch (err) {
                    console.error('Error updating stock:', err);
                    logToFile('Error updating stock: ' + err.message);
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ received: true }));
            } else {
                console.log('Unhandled event type:', event.type);
                logToFile('Unhandled event type: ' + event.type);  // Log unhandled event
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Unhandled event type' }));
            }
        });
    } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Method ${req.method} Not Allowed` }));
    }
});

async function updateStockInSupabase(cartItems) {
    try {
        for (const item of cartItems) {
            const { productId, size, color, quantity } = item;
            console.log(`Updating stock for Product ID: ${productId}, Size: ${size}, Color: ${color}, Quantity: ${quantity}`);

            // Fetch the current stock for the product
            const { data: product, error } = await supabase
                .from('products')
                .select('stock')
                .eq('id', productId)
                .single();

            if (error) throw new Error('Error fetching product stock');

            // Ensure stock exists for the specified size and color
            if (!product.stock[size] || !product.stock[size][color]) {
                throw new Error(`Stock not found for Size: ${size}, Color: ${color}`);
            }

            const updatedStock = product.stock[size][color] - quantity;
            if (updatedStock < 0) {
                throw new Error('Insufficient stock');
            }

            // Update the stock value
            product.stock[size][color] = updatedStock;

            // Update the product's stock in Supabase
            const { error: updateError } = await supabase
                .from('products')
                .update({ stock: product.stock })
                .eq('id', productId);

            if (updateError) throw new Error('Error updating stock in Supabase');

            console.log(`Stock updated for Product ID: ${productId}, Size: ${size}, Color: ${color}`);
        }
        console.log('Stock successfully updated for all items.');
    } catch (error) {
        console.error('Error updating stock:', error);
    }
}

function logToFile(message) {
    const fs = require('fs');
    const logMessage = `${new Date().toISOString()} - ${message}\n`;
    fs.appendFile('server-logs.txt', logMessage, (err) => {
        if (err) {
            console.error('Failed to write log:', err);
        }
    });
}

server.listen(3000, () => {
    console.log('Server listening on port 3000');
});