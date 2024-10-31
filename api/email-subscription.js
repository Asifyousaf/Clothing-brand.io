const http = require('http');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

// Simple email validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// Function to insert email into Supabase
async function addEmailToSupabase(email) {
    const { data, error } = await supabase
        .from('email_subscribers') // Ensure this table exists in Supabase
        .insert([{ email }]);

    if (error) {
        console.error('Supabase insert error:', error.message); // Log the exact error
        throw new Error('Failed to save email.'); // Throw error for the caller to catch
    }

    return data;
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

                // Try to add email to Supabase
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
