const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors'); // Import the CORS package

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.json());

// Endpoint to create a PayTabs payment request
app.post('/create-paytabs-session', async (req, res) => {
    try {
        const payload = req.body;

        const response = await axios.post('https://secure.paytabs.com/payment/request', payload, {
            headers: {
                'Authorization': 'Bearer STJ9WRDKKT-JKBGBKGW9T-JGHLGLL92T', // Your PayTabs server API key
                'Content-Type': 'application/json'
            }
        });

        // Handle successful response
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error processing payment:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: error.message }); // Include the error message in the response
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
