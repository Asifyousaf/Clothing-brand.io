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
