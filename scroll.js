document.addEventListener('DOMContentLoaded', function() {

    setTimeout(() => {
        window.location.href = href; // Navigate to the link after delay
    }, 2000); // Adjust this time to match your preference
    

    document.addEventListener('DOMContentLoaded', function () {
        const loadingScreen = document.getElementById('loadingScreen');
        
        // Initially hide the loading screen (will be shown when needed)
        loadingScreen.style.display = 'none';  // Hidden by default
        
        // Exclude certain buttons from showing the loading screen
        const excludeButtons = ['#cart-button', '.close-btn'];  // Customize exclusions
    
        // Function to show the loading screen (hourglass)
        function showLoadingScreen() {
            loadingScreen.classList.remove('hidden');
            loadingScreen.style.display = 'flex';  // Show loading screen
        }
    
        // Event listener for navigation links
        document.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function(e) {
                const isExcluded = excludeButtons.some(selector => e.target.closest(selector));
                if (!isExcluded) {
                    e.preventDefault();  // Prevent instant navigation
                    showLoadingScreen();  // Show loading screen (hourglass)
                    const href = this.href;
    
                    // Simulate loading delay before navigating
                    setTimeout(() => {
                        window.location.href = href;
                    }, 500);  // Adjust this time as necessary
                }
            });
        });
    });
    

    // Add this so that the loading screen disappears after a fixed time (if still showing)
    setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('hidden');
    }, 2000); // This ensures the loading screen hides after 2 seconds if the page hasn't fully loaded yet

    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        const logoContainer = document.querySelector('.logo-center');
        const logoText = document.createElement('span');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
            if (!document.querySelector('.logo-text')) {
                logoText.classList.add('logo-text');
                logoText.innerText = 'CyberTronic';
                logoContainer.appendChild(logoText);
            }
        } else {
            navbar.classList.remove('scrolled');
            if (document.querySelector('.logo-text')) {
                document.querySelector('.logo-text').remove();
            }
        }
    });



});
async function submitEmail(event) {
    event.preventDefault(); // Prevent the default form submission

    const email = document.getElementById('footerEmail').value; // Get the email from input field

    if (!email) {
        alert("Please enter a valid email."); // Validate if email is not empty
        return;
    }

    try {
        // Send a POST request to your email subscription API endpoint
        const response = await fetch('/api/subscribe-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email }) // Send the email to the backend
        });

        // Check if the response is ok (status code 200-299)
        if (!response.ok) {
            const errorText = await response.text(); // Fetch the error response as text
            console.error("HTTP Error:", response.status, response.statusText, errorText);
            alert(`Error: ${response.status} - ${response.statusText}\n${errorText.substring(0, 200)}`);
            throw new Error(`HTTP Error: ${response.status}`);
        }

        // Ensure the response is in JSON format
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const errorText = await response.text(); // Read the response as text
            console.error("Invalid response type:", contentType, errorText);
            alert(`Invalid response type\n${errorText.substring(0, 200)}`);
            throw new Error("Invalid content type");
        }

        const result = await response.json(); // Parse JSON response

        if (result.success) {
            alert("Thanks for subscribing!"); // Success message
            document.getElementById('footerEmailForm').reset(); // Clear the form
        } else {
            console.error("Server Error:", result.error);
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error("Error submitting email:", error);
        alert("There was an error. Please try again later.");
    }
}
