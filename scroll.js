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
window.onload = function() {
    const subscribed = localStorage.getItem("subscribed");
    const canceledTimestamp = localStorage.getItem("canceled");
  
    // If user hasn't subscribed and hasn't canceled within the last 24 hours
    if (!subscribed && (!canceledTimestamp || Date.now() - canceledTimestamp > 24 * 60 * 60 * 1000)) {
      setTimeout(function() {
        document.getElementById("emailPopup").classList.add('show');
        document.getElementById("emailPopup").classList.remove('hidden');
      }, 4000); // Show after 4 seconds
    }
  };
  
  function closePopup() {
    document.getElementById("emailPopup").classList.add('hidden');
    document.getElementById("emailPopup").classList.remove('show');
  }
  
  async function submitEmail(event) {
    event.preventDefault();
    const email = event.target.email.value;
  
    if (!email) {
      alert("Please enter a valid email.");
      return;
    }
  
    try {
      const response = await fetch('/api/update-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
  
      if (response.ok) {
        localStorage.setItem("subscribed", "true");
        closePopup();
        alert("Thanks for subscribing!");
        event.target.reset();
      } else {
        alert("There was an error. Please try again.");
      }
    } catch (error) {
      alert("There was an error. Please try again.");
    }
  }
  