const http = require('http');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vfcajbxgvievqettjanj.supabase.co'; // Directly add your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmY2FqYnhndmlldnFldHRqYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTEwMzQ0NiwiZXhwIjoyMDQ0Njc5NDQ2fQ.NPOWDNnIHoW_iZqf4H5KgbfJSWOe6lZIU1kPagrQrxo'; // Service role key

const supabase = createClient(supabaseUrl, supabaseKey);


const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/api/email-subscription') {
        let body = '';

        req.on('data', chunk => {
            body += chunk;
        });

        req.on('end', async () => {
            const requestBody = JSON.parse(body);

            // Handle email subscription
            if (requestBody.email) {
                try {
                    await addEmailToSupabase(requestBody.email);
                    console.log('Email added to Supabase successfully.');

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                } catch (err) {
                    console.error('Error adding email to Supabase:', err.message);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Error adding email to Supabase' }));
                }
            } else {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid request. Email is missing.' }));
            }
        });
    } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Method ${req.method} Not Allowed` }));
    }
});

// Function to insert the email into the Supabase database
async function addEmailToSupabase(email) {
    const { data, error } = await supabase
        .from('email_subscribers') // Your table name
        .insert([{ email }]); // Insert the email

    if (error) {
        throw error; // Handle errors properly
    }
    return data;
}

server.listen(3001, () => {
    console.log('Email subscription server listening on port 3001');
});
