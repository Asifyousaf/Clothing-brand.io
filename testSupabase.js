const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vfcajbxgvievqettjanj.supabase.co'; // Use your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmY2FqYnhndmlldnFldHRqYW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkxMDM0NDYsImV4cCI6MjA0NDY3OTQ0Nn0.dMfKKUfSd6McT9RLknOK6PMZ4QYTEElzodsWNhNUh1M'; // Use your service role key
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    const { data, error } = await supabase
        .from('products') // Ensure this matches your table name
        .select('*');

    if (error) {
        console.error('Error fetching data from Supabase:', error);
    } else {
        console.log('Fetched data:', data);
    }
}

testConnection();
