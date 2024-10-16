const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

app.use(cors());
app.use(express.json());

// Configure Nodemailer for Outlook
const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com', // SMTP server for Outlook/Office365
    port: 587,
    secure: false, // Use TLS
    auth: {
        user: 'outlook_627665DF3D2D9737@outlook.com', // Your Outlook email
        pass: '' // Your Outlook email password
    }
});

// Test email route
app.get('/api/test-email', async (req, res) => {
    try {
        transporter.sendMail({
            from: 'testingphase2024oct15@gmail.com', // From your Outlook email
            to: 'testingphase2024oct15@gmail.com',  // Send a test email to this address
            subject: 'Test Email from Outlook',
            text: 'This is a test email sent using Nodemailer and Outlook!'
        }, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                res.status(500).json({ error: 'Error sending email' });
            } else {
                console.log('Test email sent successfully:', info);
                res.json({ message: 'Test email sent successfully', info });
            }
        });
    } catch (error) {
        console.error('Error in test email route:', error);
        res.status(500).json({ error: 'Failed to send test email' });
    }
});

// Start the server
app.listen(3000, () => console.log('Server is running on port 3000'));
