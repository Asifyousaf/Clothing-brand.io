const http = require('http');
const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')('sk_test_51Q6qZ8Rxk79NacxxJgyYInUBdiJ2Pcqm8otxx0l4TBywHa9BM2clTwi9Siiilxzh7dIcmqMOiG5f0IlJsfOMauIQ00ZgqTu36r');

const supabaseUrl = 'https://vfcajbxgvievqettjanj.supabase.co'; // Directly add your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmY2FqYnhndmlldnFldHRqYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTEwMzQ0NiwiZXhwIjoyMDQ0Njc5NDQ2fQ.NPOWDNnIHoW_iZqf4H5KgbfJSWOe6lZIU1kPagrQrxo'; // Service role key

const supabase = createClient(supabaseUrl, supabaseKey);

const endpointSecret = 'whsec_jpk9R320UxDDfTM28wFdxpAIHkEo3pJ4'; // Your webhook signing secret


const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/api/update-stock') {
        let body = '';

        req.on('data', chunk => {
            body += chunk;
        });

        req.on('end', async () => {
            const signature = req.headers['stripe-signature'];

            let event;
            try {
                event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
            } catch (err) {
                console.error('Webhook signature verification failed:', err.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: `Webhook Error: ${err.message}` }));
                return;
            }

            if (event.type === 'checkout.session.completed') {
                const session = event.data.object;
                const cartItems = session.metadata.cartItems ? JSON.parse(session.metadata.cartItems) : [];

                try {
                    // Update stock and insert order into Supabase
        await updateStockInSupabase(cartItems);
        await insertOrderInSupabase(session, cartItems);
        console.log('Stock and order updated successfully.');
                } catch (err) {
                    console.error('Error updating stock:', err.message);
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ received: true }));
            } else {
                console.log('Unhandled event type:', event.type);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Unhandled event type' }));
            }
        });
    } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Method ${req.method} Not Allowed` }));
    }
});
// Insert order into Supabase
async function insertOrderInSupabase(session, cartItems) {
    try {
        const { email, phone } = session.customer_details;
        const { amount_total, currency, id: orderId, payment_status } = session;

        // Shipping address information from the session
        const shipping_address = {
            line1: session.shipping.address.line1,
            line2: session.shipping.address.line2 || '',
            city: session.shipping.address.city,
            state: session.shipping.address.state || '',
            postal_code: session.shipping.address.postal_code,
            country: session.shipping.address.country
        };

        const orderData = {
            order_id: orderId,
            email: email,
            phone: phone,
            total_amount: (amount_total / 100),
            currency: currency,
            cart_items: cartItems,
            payment_status: payment_status,
            shipping_address: shipping_address
        };

        const { error } = await supabase
            .from('orders')
            .insert(orderData);

        if (error) throw new Error('Error inserting order data into Supabase');
        console.log(`Order ${orderId} inserted into Supabase.`);
    } catch (err) {
        console.error('Error inserting order:', err.message);
    }
}

async function updateStockInSupabase(cartItems) {
    try {
        for (const item of cartItems) {
            const { productId, size, color, quantity } = item;
            console.log(`Updating stock for Product ID: ${productId}, Size: ${size}, Color: ${color}, Quantity: ${quantity}`);

            const { data: product, error } = await supabase
                .from('products')
                .select('stock')
                .eq('id', productId)
                .single();

            if (error) throw new Error('Error fetching product stock');

            if (!product.stock[size] || !product.stock[size][color]) {
                throw new Error(`Stock not found for Size: ${size}, Color: ${color}`);
            }

            const updatedStock = product.stock[size][color] - quantity;
            if (updatedStock < 0) {
                throw new Error('Insufficient stock');
            }

            product.stock[size][color] = updatedStock;

            const { error: updateError } = await supabase
                .from('products')
                .update({ stock: product.stock })
                .eq('id', productId);

            if (updateError) throw new Error('Error updating stock in Supabase');

            console.log(`Stock updated for Product ID: ${productId}, Size: ${size}, Color: ${color}`);
        }
        console.log('Stock successfully updated for all items.');
    } catch (error) {
        console.error('Error updating stock:', error.message);
    }
}

server.listen(3000, () => {
    console.log('Server listening on port 3000');
});