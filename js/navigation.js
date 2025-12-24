// js/navigation.js

// Navigation initialization
function initializeNavigation() {
    const logoContainer = document.getElementById('logoContainer');
    const profileContainer = document.getElementById('profileContainer');
    const logoMenu = document.getElementById('logoMenu');
    const profileMenu = document.getElementById('profileMenu');
    
    if (!logoContainer || !profileContainer) {
        console.log('Navigation elements not found, waiting for DOM...');
        return false;
    }
    
    // Toggle logo menu
    logoContainer.addEventListener('click', function(e) {
        e.stopPropagation();
        const isLogoMenuActive = logoMenu.classList.contains('active');
        
        logoMenu.classList.remove('active');
        if (profileMenu) profileMenu.classList.remove('active');
        
        if (!isLogoMenuActive) {
            logoMenu.classList.add('active');
        }
    });
    
    // Toggle profile menu
    profileContainer.addEventListener('click', function(e) {
        e.stopPropagation();
        const isProfileMenuActive = profileMenu.classList.contains('active');
        
        logoMenu.classList.remove('active');
        profileMenu.classList.remove('active');
        
        if (!isProfileMenuActive) {
            profileMenu.classList.add('active');
        }
    });
    
    // Close menus when clicking outside
    document.addEventListener('click', function() {
        if (logoMenu) logoMenu.classList.remove('active');
        if (profileMenu) profileMenu.classList.remove('active');
    });
    
    // Prevent menu from closing when clicking inside
    if (logoMenu) {
        logoMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    if (profileMenu) {
        profileMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    // Setup logout event listener
    setupLogoutEventListener();
    
    return true;
}

// Setup proper logout event listener
function setupLogoutEventListener() {
    // Wait a bit for the DOM to be fully ready
    setTimeout(() => {
        const logoutButton = document.querySelector('.btn-logout');
        if (logoutButton) {
            console.log('Setting up logout event listener');
            
            // Remove any existing onclick to prevent conflicts
            logoutButton.onclick = null;
            
            // Add proper event listener that prevents propagation
            logoutButton.addEventListener('click', function(event) {
                console.log('Logout button clicked with event listener');
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                
                // Call the logout function
                performLogout();
                
                return false;
            }, true); // Use capture phase to catch event early
        } else {
            console.warn('Logout button not found for event listener setup');
        }
    }, 100);
}

// The actual logout logic
function performLogout() {
    console.log('Performing logout...');
    
    // Set flag for index.html to show notification
    sessionStorage.setItem('showLogoutNotification', 'true');
    
    // Clear session storage
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('authToken');
    
    // Update UI
    if (window.updateAuthUI) {
        updateAuthUI(false, '');
    }
    
    // Use replace instead of href for immediate redirect
    window.location.replace('index.html');
}

// Original logout function (keep for backward compatibility)
function logout() {
    console.log('Legacy logout function called');
    performLogout();
}

// Wait for navigation component to load and initialize
function waitForNavigationAndInitialize() {
    const maxAttempts = 10;
    let attempts = 0;
    
    const checkNavigation = setInterval(() => {
        attempts++;
        const navigationLoaded = initializeNavigation();
        
        if (navigationLoaded || attempts >= maxAttempts) {
            clearInterval(checkNavigation);
            if (!navigationLoaded) {
                console.warn('Navigation initialization failed after maximum attempts');
            }
        }
    }, 100);
}

// Initialize when DOM is loaded or when components are loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing navigation...');
    waitForNavigationAndInitialize();
});

// If DOM is already loaded, initialize immediately
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForNavigationAndInitialize);
} else {
    waitForNavigationAndInitialize();
}

// Global navigation functions
function showLoginModal() {
    console.log('Opening login modal...');
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'block';
        const emailInput = document.getElementById('loginEmail');
        if (emailInput) emailInput.focus();
    } else {
        console.warn('Login modal not found');
    }
}

function showRegisterModal() {
    console.log('Opening register modal...');
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.style.display = 'block';
        const usernameInput = document.getElementById('registerUsername');
        if (usernameInput) usernameInput.focus();
    } else {
        console.warn('Register modal not found');
    }
}

// Function to update UI based on authentication status
function updateAuthUI(isLoggedIn, userName = '') {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const userNameSpan = document.getElementById('userName');
    
    console.log('Updating auth UI:', { isLoggedIn, userName, authButtons: !!authButtons, userMenu: !!userMenu });
    
    if (authButtons && userMenu && userNameSpan) {
        if (isLoggedIn) {
            authButtons.style.display = 'none';
            userMenu.style.display = 'block';
            userNameSpan.textContent = userName || 'User';
        } else {
            authButtons.style.display = 'block';
            userMenu.style.display = 'none';
            userNameSpan.textContent = '';
        }
    } else {
        console.warn('Auth UI elements not found:', { authButtons, userMenu, userNameSpan });
    }
}

// Make functions globally available
window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;
window.logout = logout;
window.updateAuthUI = updateAuthUI;
window.performLogout = performLogout;