document.addEventListener('DOMContentLoaded', function() {

    window.onload = function() {
        // Hide the loading screen once the page has fully loaded
        document.getElementById('loadingScreen').classList.add('hidden');
    };

    function showLoadingScreen() {
        document.getElementById('loadingScreen').classList.remove('hidden');
    }

    // Exclude the cart button and other in-page elements from triggering the loading screen
    const excludeButtons = ['#cart-button', '.close-btn']; // Add the cart button and other buttons here

    // Add event listener to show loading screen on navigation
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function(e) {
            const isExcluded = excludeButtons.some(selector => e.target.closest(selector));
            if (!isExcluded) {
                e.preventDefault(); // Prevent instant navigation
                showLoadingScreen(); // Show loading screen
                const href = this.href;
                
                // Simulate loading delay (500ms)
                setTimeout(() => {
                    window.location.href = href; // Navigate to the link after delay
                }, 500); // Adjust this time to match your preference
            }
        });
    });

    // Add this so that the loading screen disappears after a fixed time (if still showing)
    setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('hidden');
    }, 2000); // This ensures the loading screen hides after 2 seconds if the page hasn't fully loaded yet

    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        const logoContainer = document.querySelector('.logo-center');
        const logoText = document.createElement('span');

        if (window.scrollY > 100) {
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
