// Initialize the application
let auth;
let app;

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    // Load components
    loadComponents();
});

// Load HTML components
async function loadComponents() {
    const components = [  
        { id: 'navigation', file: 'components/navigation.html' },
        { id: 'hero', file: 'components/hero.html' },
        { id: 'stats', file: 'components/stats.html' },
        { id: 'opportunities', file: 'components/opportunities.html' },        
        { id: 'footer', file: 'components/footer.html' },
        { id: 'login-modal', file: 'components/login-modal.html' },
        { id: 'register-modal', file: 'components/register-modal.html' }, 
        { id: 'blog-header', file: 'components/blog-header.html' },
        { id: 'blog-edit', file: 'components/blog-edit.html' },
        { id: 'event-edit', file: 'components/event-edit.html' },
        { id: 'event-details', file: 'components/event-details.html' },
        { id: 'blog-details', file: 'components/blog-details.html' },
        
    ];
    for (const component of components) {
        try {
            const response = await fetch(component.file);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const html = await response.text();
            document.getElementById(component.id).innerHTML = html;
        } catch (error) {
            console.error(`Error loading ${component.file}:`, error);
            // Create fallback content for critical components
            if (component.id === 'header') {
                document.getElementById(component.id).innerHTML = '<div style="padding: 1rem; background: #2c3e50; color: white;">Volunteer Connect</div>';
            }
        }
    }
     // Initialize app after components are loaded
    setTimeout(() => {
        console.log('Initializing auth and app...');
        
        // Initialize auth
        if (typeof Auth !== 'undefined') {
            auth = new Auth();
            window.auth = auth; // Make auth globally accessible
            console.log('Auth initialized');
        } else {
            console.error('Auth class not found');
        }
        
        // Initialize app
        if (typeof VolunteerApp !== 'undefined') {
            app = new VolunteerApp();
            window.app = app; // Make app globally accessible
            console.log('VolunteerApp initialized');
        } else {
            console.error('VolunteerApp class not found');
        }
        
        // Initialize navigation
        if (typeof waitForNavigationAndInitialize !== 'undefined') {
            waitForNavigationAndInitialize();
        }
        
        attachFormHandlers();
        attachModalHandlers();
        updateNavigationBasedOnRole();
        
        console.log('App initialization complete');
    }, 100);
}

// Attach form handlers
function attachFormHandlers() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            if (auth) {
                await auth.login(email, password);
                updateNavigationBasedOnRole();
            }
        });
    }

    // Register form - UPDATED FOR NEW ER DIAGRAM
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userData = {
                username: document.getElementById('registerUsername').value,
                full_name: document.getElementById('registerFullName').value,
                email: document.getElementById('registerEmail').value,
                password: document.getElementById('registerPassword').value,
                
                profile_bio: document.getElementById('registerBio').value
            };
            if (auth) {
                const success = await auth.register(userData);
                if (success) {
                    updateNavigationBasedOnRole();
                }
            }
        });
    }
}

// Update navigation based on user role
function updateNavigationBasedOnRole() {
    const navMenu = document.getElementById('navMenu');
    if (!navMenu) return;

    // Remove existing role-based menu items
    const existingOrgMenu = document.getElementById('organizationMenu');
    const existingAdminMenu = document.getElementById('adminMenu');
    if (existingOrgMenu) existingOrgMenu.remove();
    if (existingAdminMenu) existingAdminMenu.remove();

    if (auth && auth.currentUser) {
        const userRole = auth.currentUser.role;
        
        if (userRole === 'organization' || userRole === 'admin') {
            const orgMenu = document.createElement('div');
            orgMenu.id = 'organizationMenu';
            orgMenu.className = 'nav-link';
            orgMenu.style.marginLeft = 'auto';
            orgMenu.innerHTML = `
                <a href="#create-event" class="nav-link" onclick="showCreateEventModal()">Create Event</a>
                <a href="#my-events" class="nav-link" onclick="showMyEvents()">My Events</a>
            `;
            navMenu.insertBefore(orgMenu, navMenu.querySelector('#authButtons, #userMenu'));
        }

        if (userRole === 'admin') {
            const adminMenu = document.createElement('div');
            adminMenu.id = 'adminMenu';
            adminMenu.className = 'nav-link';
            adminMenu.innerHTML = `
                <a href="#admin" class="nav-link" onclick="showAdminPanel()">Admin Panel</a>
                <a href="#reports" class="nav-link" onclick="showReports()">Reports</a>
            `;
            navMenu.insertBefore(adminMenu, navMenu.querySelector('#organizationMenu, #authButtons, #userMenu'));
        }
    }
}

// Attach modal handlers
function attachModalHandlers() {
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        const loginModal = document.getElementById('loginModal');
        const registerModal = document.getElementById('registerModal');
        
        if (e.target === loginModal) closeLoginModal();
        if (e.target === registerModal) closeRegisterModal();
    });

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLoginModal();
            closeRegisterModal();
        }
    });
}

// Modal functions
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'block';
        document.getElementById('loginEmail').focus();
    }
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    const form = document.getElementById('loginForm');
    if (modal) modal.style.display = 'none';
    if (form) form.reset();
}

function showRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.style.display = 'block';
        document.getElementById('registerUsername').focus();
    }
}

function closeRegisterModal() {
    const modal = document.getElementById('registerModal');
    const form = document.getElementById('registerForm');
    if (modal) modal.style.display = 'none';
    if (form) form.reset();
}

function switchToRegister() {
    closeLoginModal();
    showRegisterModal();
}

function switchToLogin() {
    closeRegisterModal();
    showLoginModal();
}

// Utility functions
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'flex';
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        border-radius: 5px;
        color: white;
        z-index: 1003;
        background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        animation: slideIn 0.3s;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 3000);
}

// Logout function for global access
function logout() {
    if (auth) {
        auth.logout();
        updateNavigationBasedOnRole();
    }
}

// Organization and Admin functions
function showCreateEventModal() {
    if (!auth || !auth.isAuthenticated()) {
        showNotification('Please login to create events', 'error');
        showLoginModal();
        return;
    }

    if (!auth.isOrganization() && !auth.isAdmin()) {
        showNotification('Only organizations can create events', 'error');
        return;
    }

    // Create and show event creation modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h2>Create New Event</h2>
            <form id="createEventForm">
                <div class="form-group">
                    <label for="eventTitle">Event Title *</label>
                    <input type="text" id="eventTitle" required>
                </div>
                <div class="form-group">
                    <label for="eventDescription">Description *</label>
                    <textarea id="eventDescription" required></textarea>
                </div>
                <div class="form-group">
                    <label for="eventLocation">Location *</label>
                    <input type="text" id="eventLocation" required>
                </div>
                <div class="form-group">
                    <label for="eventStart">Start Date & Time *</label>
                    <input type="datetime-local" id="eventStart" required>
                </div>
                <div class="form-group">
                    <label for="eventEnd">End Date & Time *</label>
                    <input type="datetime-local" id="eventEnd" required>
                </div>
                <div class="form-group">
                    <label for="eventSlots">Volunteer Slots *</label>
                    <input type="number" id="eventSlots" min="1" required>
                </div>
                <button type="submit" class="btn-primary" style="width: 100%;">Create Event</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';

    // Add form handler
    document.getElementById('createEventForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await createNewEvent();
        modal.remove();
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

async function createNewEvent() {
    try {
        showLoading();
        
        const eventData = {
            title: document.getElementById('eventTitle').value,
            description: document.getElementById('eventDescription').value,
            location: document.getElementById('eventLocation').value,
            start_datetime: document.getElementById('eventStart').value,
            end_datetime: document.getElementById('eventEnd').value,
            volunteer_slots: document.getElementById('eventSlots').value
        };

        const response = await fetch('api/events/create.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData)
        });

        const data = await response.json();
        
        if (data.success) {
            showNotification('Event created successfully!', 'success');
            // Refresh events list
            if (app) {
                app.loadOpportunities();
            }
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error creating event:', error);
        showNotification('Failed to create event', 'error');
    } finally {
        hideLoading();
    }
}

function showMyEvents() {
    if (!auth || !auth.isAuthenticated()) {
        showNotification('Please login to view your events', 'error');
        showLoginModal();
        return;
    }

    showNotification('My Events feature coming soon!', 'success');
}

function showAdminPanel() {
    if (!auth || !auth.isAdmin()) {
        showNotification('Admin access required', 'error');
        return;
    }

    showNotification('Admin Panel feature coming soon!', 'success');
}

function showReports() {
    if (!auth || !auth.isAdmin()) {
        showNotification('Admin access required', 'error');
        return;
    }

    showNotification('Reports feature coming soon!', 'success');
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);