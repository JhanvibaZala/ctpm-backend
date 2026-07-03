document.addEventListener("DOMContentLoaded", () => {
    const errorBox = document.getElementById("errorFlash");
    const closeBtn = document.getElementById("closeErrorBtn");
    
    if (errorBox) {
        // Function to smoothly remove the element from the DOM layout
        const dismissError = () => {
            errorBox.classList.add("fade-out");
            // Wait for the 0.5s CSS transition to finish before removing completely
            setTimeout(() => {
                errorBox.remove();
            }, 500);
        };

        // 1. Dismiss when clicking the close button
        if (closeBtn) {
            closeBtn.addEventListener("click", dismissError);
        }

        // 2. Auto-dismiss after 5 seconds (5000 milliseconds)
        setTimeout(dismissError, 5000);
    }
});