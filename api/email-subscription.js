const http = require('http');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://vfcajbxgvievqettjanj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmY2FqYnhndmlldnFldHRqYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTEwMzQ0NiwiZXhwIjoyMDQ0Njc5NDQ2fQ.NPOWDNnIHoW_iZqf4H5KgbfJSWOe6lZIU1kPagrQrxo'; // Supabase service role key
const supabase = createClient(supabaseUrl, supabaseKey);
// Simple email validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// Function to check if the email already exists
async function isEmailSubscribed(email) {
    const { data, error } = await supabase
        .from('email_subscribers')
        .select('email')
        .eq('email', email)
        .single(); // Ensure we only get one record, or null if not found

    if (error && error.code !== 'PGRST116') { // 'PGRST116' means "No rows returned"
        console.error('Supabase query error:', error.message);
        throw new Error('Database query failed.');
    }

    return data ? true : false;
}

// Function to insert email into Supabase
async function addEmailToSupabase(email) {
    const { error } = await supabase
        .from('email_subscribers')
        .insert([{ email }]);

    if (error) {
        console.error('Supabase insert error:', error.message); // Log the exact error
        throw new Error('Failed to save email.');
    }
}

// HTTP server
const server = http.createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/api/email-subscription') {
        let body = '';

        req.on('data', chunk => {
            body += chunk;
        });

        req.on('end', async () => {
            try {
                // Parse the body
                const { email } = JSON.parse(body);
                console.log('Received email:', email); // Log the incoming email for troubleshooting

                // Validate email
                if (!email || !validateEmail(email)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid email address' }));
                    return;
                }

                // Check if email already exists in the database
                const alreadySubscribed = await isEmailSubscribed(email);

                if (alreadySubscribed) {
                    res.writeHead(409, { 'Content-Type': 'application/json' }); // 409 Conflict
                    res.end(JSON.stringify({ error: 'You are already subscribed!' }));
                    return;
                }

                // Add email to Supabase if not already subscribed
                await addEmailToSupabase(email);
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));

            } catch (err) {
                console.error('Error handling request:', err.message); // Log error details
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal server error' }));
            }
        });
    } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Method ${req.method} Not Allowed` }));
    }
});

// Start the server
server.listen(3000, () => {
    console.log('Server running on port 3000');
});