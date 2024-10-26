document.addEventListener('DOMContentLoaded', function() {

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
    event.preventDefault();

    const email = document.getElementById('footerEmail').value;

    if (!email) {
        showAlert("Please enter a valid email."); // Custom alert
        return;
    }

    try {
        const response = await fetch('/api/email-subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                showAlert("Thanks for subscribing!"); // Custom success alert
                document.getElementById('footerEmailForm').reset(); // Clear the form
            } else {
                showAlert("Error: " + result.error); // Custom error alert
            }
        } else if (response.status === 409) {
            showAlert("You are already subscribed!"); // Custom 'already subscribed' alert
        } else {
            const errorText = await response.text();
            showAlert(`Error: ${response.status} - ${response.statusText}\n${errorText}`);
        }
    } catch (error) {
        console.error("Error submitting email:", error);
        showAlert("There was an error. Please try again later.");
    }
}

function showAlert(message) {
    const alertBox = document.getElementById('customAlert');
    const alertMessage = document.getElementById('alertMessage');
    
    alertMessage.innerText = message; // Set the alert message
    alertBox.classList.remove('hidden'); // Show the alert box
}

function closeAlert() {
    document.getElementById('customAlert').classList.add('hidden'); // Hide the alert box
}

// Open the modal and display the clicked image
function openModal(imageSrc) {
    var modal = document.getElementById("imageModal");
    var modalImage = document.getElementById("modalImage");
    modal.style.display = "block";
    modalImage.src = imageSrc; // Set the clicked image as the modal image

    // For mobile, close the modal on clicking the image after zoom
    if (window.innerWidth <= 768) {  // Check if it's a mobile device
        modalImage.addEventListener('click', closeModal);  // Close modal on image click
    }
}

// Close the modal
function closeModal() {
    var modal = document.getElementById("imageModal");
    modal.style.display = "none";
    
    // Remove the click event to avoid closing immediately on desktop
    var modalImage = document.getElementById("modalImage");
    modalImage.removeEventListener('click', closeModal);  // Remove listener after closing
}

// Add event listener for image click (on desktop and mobile)
document.getElementById('main-product-image').addEventListener('click', function() {
    openModal(this.src); // Open the clicked image in modal
});
function openSizeChart() {
    document.getElementById("sizeChartModal").style.display = "flex";
}

function closeSizeChart() {
    document.getElementById("sizeChartModal").style.display = "none";
}

// Close the modal if the user clicks outside the table container
window.onclick = function(event) {
    const modal = document.getElementById("sizeChartModal");
    const tableContainer = document.querySelector(".table-container");
    if (event.target === modal && !tableContainer.contains(event.target)) {
        modal.style.display = "none";
    }
};


document.querySelectorAll('.collapsible').forEach(button => {
    button.addEventListener('click', () => {
        const content = button.nextElementSibling;

        // Toggle the max height to create a smooth dropdown effect
        if (content.style.maxHeight) {
            content.style.maxHeight = null; // Collapse
        } else {
            content.style.maxHeight = content.scrollHeight + "px"; // Expand
        }
    });
});