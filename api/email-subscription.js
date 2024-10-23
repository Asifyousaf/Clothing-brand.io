const http = require('http');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vfcajbxgvievqettjanj.supabase.co'; // Your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmY2FqYnhndmlldnFldHRqYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTEwMzQ0NiwiZXhwIjoyMDQ0Njc5NDQ2fQ.NPOWDNnIHoW_iZqf4H5KgbfJSWOe6lZIU1kPagrQrxo'; // Service role key

const supabase = createClient(supabaseUrl, supabaseKey);

// Simple email validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// Function to insert email into Supabase
async function addEmailToSupabase(email) {
    const { error } = await supabase
        .from('email_subscribers') // Your Supabase table name
        .insert([{ email }]);

    if (error) {
        console.error('Supabase insert error:', error.message);
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
            const { email } = JSON.parse(body);

            if (!email || !validateEmail(email)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid email address' }));
                return;
            }

            try {
                await addEmailToSupabase(email);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to save email.' }));
            }
        });
    } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Method ${req.method} Not Allowed` }));
    }
});

server.listen(3000, () => {
    console.log('Server running on port 3000');
});