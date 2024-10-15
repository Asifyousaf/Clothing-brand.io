document.addEventListener('DOMContentLoaded', function () {
    const splash = document.getElementById('splash');
    const loadingScreen = document.getElementById('loadingScreen');

    // Check if splash has been shown before
    if (!sessionStorage.getItem('splashShown')) {
        // First time: Show splash screen and hide hourglass
        splash.style.display = 'flex';  // Show splash
        loadingScreen.style.display = 'none';  // Hide hourglass during splash screen

        // Set a flag in sessionStorage to track if the splash was shown
        sessionStorage.setItem('splashShown', 'true');

        // Hide splash screen after a set time (3 seconds), and then show the hourglass
        setTimeout(function() {
            splash.style.animation = 'fadeOut 1s forwards';  // Trigger fade-out animation
            setTimeout(function() {
                splash.style.display = 'none';  // Hide the splash completely
                loadingScreen.style.display = 'flex';  // Show hourglass after splash is hidden
            }, 1000);  // Time for fade-out animation (1 second)
        }, 3000);  // Duration of splash (3 seconds)

    } else {
        // If the splash screen was already shown, hide it
        splash.style.display = 'none';
        loadingScreen.style.display = 'flex';  // Show hourglass loading screen directly
    }
});


window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    
    if (window.scrollY > 50) {  // Trigger after scrolling down 50px
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});


// Function to handle scroll and change the logo
window.addEventListener('scroll', function() {
    var navbar = document.querySelector('.navbar');
    var logoContainer = document.querySelector('.logo-center');
    var logoImage = document.getElementById('logo-img');
    var logoText = document.createElement('span');

    // Check scroll position (adjust 100 as needed)
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
        
        // Replace logo with text
        if (!document.querySelector('.logo-text')) {
            logoText.classList.add('logo-text');
            logoText.innerText = 'CyberTronic'; // The new text
            logoContainer.appendChild(logoText);
        }
    } else {
        navbar.classList.remove('scrolled');
        
        // Switch back to the logo image
        if (document.querySelector('.logo-text')) {
            document.querySelector('.logo-text').remove();
        }
    }
});
