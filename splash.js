document.addEventListener('DOMContentLoaded', function () {
    
    if (!sessionStorage.getItem('splashShown')) {
        // If not shown, display the splash screen
        const splash = document.getElementById('splash');
        splash.style.display = 'flex'; // Show the splash screen
        
        // Set a flag in sessionStorage to indicate that the splash has been shown
        sessionStorage.setItem('splashShown', 'true');
        
        // Hide the splash screen after the loading is complete
        setTimeout(function() {
            splash.style.animation = 'fadeOut 1s forwards'; // Trigger fade-out animation
            setTimeout(function() {
                splash.style.display = 'none'; // Hide the splash screen after the animation ends
            }, 1000); // Match this duration with the fade-out animation (1 second)
        }, 3000); // Match this duration with the loading animation (3 seconds)
    } else {
        // If already shown, just hide the splash screen
        const splash = document.getElementById('splash');
        splash.style.display = 'none'; // Hide the splash screen immediately
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
