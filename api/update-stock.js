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
                // Verify webhook signature
                event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
                console.log('Webhook signature verified');
            } catch (err) {
                console.error('Webhook signature verification failed:', err.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: `Webhook Error: ${err.message}` }));
                return;
            }

            if (event.type === 'checkout.session.completed') {
                const session = event.data.object;

                try {
                    // Store the order in Supabase
                    const orderData = {
                        id: session.id,
                        email: session.customer_details.email,
                        total_amount: session.amount_total,
                        currency: session.currency,
                        items: JSON.parse(session.metadata.cartItems),
                        phone: session.customer_details.phone,
                        shipping_address: {
                            line1: session.shipping.address.line1,
                            city: session.shipping.address.city,
                            country: session.shipping.address.country,
                        }
                    };

                    const { data: insertData, error } = await supabase
                        .from('orders')
                        .insert([orderData]);

                    if (error) {
                        console.error('Error storing order in Supabase:', error);
                    } else {
                        console.log('Order stored successfully:', insertData);

                        // Now update the stock in Supabase
                        const cartItems = JSON.parse(session.metadata.cartItems);
                        await updateStockInSupabase(cartItems); // Update the stock based on purchased items
                    }
                } catch (err) {
                    console.error('Error processing order:', err);
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ received: true }));
            } else {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Unhandled event type' }));
            }
        });
    } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Method ${req.method} Not Allowed` }));
    }
});

// Stock update function remains the same
server.listen(3000, () => {
    console.log('Server listening on port 3000');
});