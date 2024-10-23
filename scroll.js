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
// Show the popup when the page loads
// Show the popup when the page loads
window.onload = function() {
    setTimeout(function() {
        const popup = document.getElementById("emailPopup");
        if (popup) {
            console.log("Popup found, displaying...");
            popup.style.display = "block"; // Show the popup after 4 seconds
        } else {
            console.log("Popup not found!");
        }
    }, 4000); // Show after 4 seconds
}

// Close the popup
function closePopup() {
    document.getElementById("emailPopup").style.display = "none";
}

async function submitEmail(event) {
    event.preventDefault();
    const email = event.target.email.value;

    if (!email) {
        alert("Please enter a valid email.");
        return;
    }

    try {
        const response = await fetch('/api/email-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const result = await response.json();
        
        if (response.ok) {
            alert("Thanks for subscribing!");
            closePopup();
            event.target.reset();
        } else {
            alert("There was an error. Please try again later.");
        }
    } catch (error) {
        console.error("Error submitting email:", error);
        alert("There was an error. Please try again later.");
    }
}
