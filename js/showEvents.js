// Updated JavaScript code that matches your database schema

// Global variables
let allEvents = [];
let currentView = 'grid';

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadEvents();
});

// Load events from database
// In showEvent.js - update the loadEvents function
async function loadEvents() {
    try {
        showLoading(true);
        
        // Use the correct path to your PHP file
        const response = await fetch('api/events/showEvents.php');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to load events');
        }
        
        // Transform database fields to match frontend expectations
        allEvents = result.data.map(event => ({
            id: event.event_id,
            title: event.title,
            description: event.description,
            location: event.location,
            date: event.start_datetime,
            start_datetime: event.start_datetime,
            end_datetime: event.end_datetime,
            volunteersNeeded: event.volunteer_slots || 1,
            volunteersRegistered: event.registered_volunteers || 0,
            status: mapStatus(event.status),
            category: event.category || 'community',
            created_by: event.created_by,
            created_at: event.created_at,
            image: '/default-event-image.jpg' // Default image
        }));
        
        console.log('Loaded events:', allEvents); // Debug log
        applyFilters();
        
    } catch (error) {
        console.error('Error loading events:', error);
        showError('Failed to load events: ' + error.message);
        
        // For debugging - show the actual error details
        console.log('Full error object:', error);
    } finally {
        showLoading(false);
    }
}


// Map database status to frontend status
function mapStatus(dbStatus) {
    const statusMap = {
        'upcoming': 'active',
        'ongoing': 'active', 
        'completed': 'completed',
        'cancelled': 'cancelled'
    };
    return statusMap[dbStatus] || 'active';
}

// Filter events based on selected filters
function filterEvents() {
    applyFilters();
}

function applyFilters() {
    const statusFilter = document.getElementById('statusFilter').value;
    const locationFilter = document.getElementById('locationFilter').value.toLowerCase();
    const dateFilter = document.getElementById('dateFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    const showYourEvents = document.getElementById('showYourEvents').checked;

    let filteredEvents = allEvents.filter(event => {
        // Status filter - map frontend status to database status
        if (statusFilter) {
            if (statusFilter === 'active') {
                // Active includes both upcoming and ongoing in database
                if (event.status !== 'active') return false;
            } else if (statusFilter === 'completed' && event.status !== 'completed') {
                return false;
            } else if (statusFilter === 'cancelled' && event.status !== 'cancelled') {
                return false;
            }
        }

        // Location filter
        if (locationFilter && !event.location.toLowerCase().includes(locationFilter)) {
            return false;
        }

        // Category filter
        if (categoryFilter && event.category !== categoryFilter) {
            return false;
        }

        // Your events filter (requires user authentication)
        if (showYourEvents) {
            // You'll need to get current user ID and compare with event.created_by
            const currentUserId = getCurrentUserId(); // Implement this function
            if (event.created_by !== currentUserId) return false;
        }

        // Date filter - using start_datetime
        if (dateFilter && !matchesDateFilter(event.start_datetime, dateFilter)) {
            return false;
        }

        return true;
    });

    displayEvents(filteredEvents);
}

// Check if event matches date filter
function matchesDateFilter(eventDateTime, filterType) {
    const now = new Date();
    const eventDate = new Date(eventDateTime);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const eventDateOnly = new Date(eventDate);
    eventDateOnly.setHours(0, 0, 0, 0);

    switch (filterType) {
        case 'today':
            return eventDateOnly.getTime() === today.getTime();
            
        case 'week':
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            return eventDateOnly >= startOfWeek && eventDateOnly <= endOfWeek;
            
        case 'month':
            return eventDateOnly.getMonth() === today.getMonth() && 
                   eventDateOnly.getFullYear() === today.getFullYear();
                   
        case 'upcoming':
            return eventDate >= now;
            
        case 'past':
            return eventDate < today; // Events that ended before today
            
        default:
            return true;
    }
}



// Display events in the container
function displayEvents(events) {
    const container = document.getElementById('eventsContainer');
    const noEvents = document.getElementById('noEvents');
    
    if (events.length === 0) {
        container.innerHTML = '';
        noEvents.style.display = 'block';
        return;
    }
    
    noEvents.style.display = 'none';
    
    if (currentView === 'grid') {
        container.className = 'events-container-grid';
        container.innerHTML = events.map(event => createEventCard(event)).join('');
    } else {
        container.className = 'events-container-list';
        container.innerHTML = events.map(event => createEventListItem(event)).join('');
    }
}

// Create event card for grid view
function createEventCard(event) {
    const volunteersRegistered = event.volunteersRegistered || 0;
    const volunteersNeeded = event.volunteersNeeded || 1;
    
    return `
        <div class="event-card" data-event-id="${event.id}">
            <div class="event-image">
                
                <span class="event-status ${event.status}">${event.status}</span>
            </div>
            <div class="event-content">
                <h3 class="event-title">${event.title}</h3>
                <p class="event-description">${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}</p>
                
                <div class="event-details">
                    <div class="event-detail">
                        <span class="icon">📅</span>
                        <span>${formatDateTime(event.start_datetime, event.end_datetime)}</span>
                    </div>
                    <div class="event-detail">
                        <span class="icon">📍</span>
                        <span>${event.location}</span>
                    </div>
                    <div class="event-detail">
                        <span class="icon">👥</span>
                        <span>${volunteersRegistered}/${volunteersNeeded} volunteers</span>
                    </div>
                    <div class="event-detail">
                        <span class="icon">${getCategoryIcon(event.category)}</span>
                        <span>${event.category}</span>
                    </div>
                </div>
                
                <div class="event-actions">
                    <button class="btn-primary" onclick="viewEventDetails(${event.id})">
                        View Details
                    </button>
                    <button class="btn-secondary" onclick="showRegisterModal(${event.id}, ${event.created_by})">
                        Register
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Create event item for list view
function createEventListItem(event) {
    const volunteersRegistered = event.volunteersRegistered || 0;
    const volunteersNeeded = event.volunteersNeeded || 1;
    
    return `
        <div class="event-list-item" data-event-id="${event.id}">
            <div class="event-list-main">
                <div class="event-list-info">
                    <h3 class="event-title">${event.title}</h3>
                    <p class="event-description">${event.description.substring(0, 150)}${event.description.length > 150 ? '...' : ''}</p>
                    
                    <div class="event-meta">
                        <span class="event-meta-item">
                            <span class="icon">📅</span>
                            ${formatDateTime(event.start_datetime, event.end_datetime)}
                        </span>
                        <span class="event-meta-item">
                            <span class="icon">📍</span>
                            ${event.location}
                        </span>
                        <span class="event-meta-item">
                            <span class="icon">${getCategoryIcon(event.category)}</span>
                            ${event.category}
                        </span>
                        <span class="event-meta-item">
                            <span class="icon">👥</span>
                            ${volunteersRegistered}/${volunteersNeeded}
                        </span>
                        <span class="event-status ${event.status}">${event.status}</span>
                    </div>
                </div>
                
                <div class="event-list-actions">
                    <button class="btn-primary" onclick="viewEventDetails(${event.id})">
                        View Details
                    </button>
                    <button class="btn-secondary" onclick="showRegisterModal(${event.id}, ${event.created_by})">
                        Register
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Helper functions
function formatDateTime(startDateTime, endDateTime) {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    
    // If same day, show date once with time range
    if (start.toDateString() === end.toDateString()) {
        return `${start.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })} ${start.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })} - ${end.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })}`;
    } else {
        // Different days, show full date range
        return `${start.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        })} - ${end.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })}`;
    }
}

function getCategoryIcon(category) {
    const icons = {
        'environment': '🌱',
        'education': '📚',
        'healthcare': '🏥',
        'community': '🏘️',
        'animals': '🐾',
        'seniors': '👵',
        'children': '🧒',
        'other': '🎯'
    };
    return icons[category] || '🎯';
}


// View management
function toggleViewDropdown() {
    const dropdown = document.getElementById('viewDropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}


// Close dropdown if clicked outside
window.addEventListener('click', function(e) {
    const dropdown = document.getElementById('viewDropdown');
    const btn = document.getElementById('viewBtn');
    if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

// Update button text when a view is selected
function changeView(view) {
    const container = document.getElementById('eventsContainer');
    const btn = document.getElementById('viewBtn');

    if (view === 'grid') {
        container.classList.remove('events-container-list');
        container.classList.add('events-container-grid');
        btn.innerHTML = 'Grid View ';
    } else if (view === 'list') {
        container.classList.remove('events-container-grid');
        container.classList.add('events-container-list');
        btn.innerHTML = 'List View ';
    }

    // Close dropdown after selection
    document.getElementById('viewDropdown').style.display = 'none';
}


// Clear all filters
function clearFilters() {
    document.getElementById('statusFilter').value = '';
    document.getElementById('locationFilter').value = '';
    document.getElementById('dateFilter').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('showYourEvents').checked = false;
    
    applyFilters();
}

// Refresh events
function refreshEvents() {
    loadEvents();
}



// UI helpers
function showLoading(show) {
    document.getElementById('loadingEvents').style.display = show ? 'block' : 'none';
}

function showError(message) {
    // You can implement a toast or alert system here
    alert(message);
}

// Placeholder functions - implement these based on your needs


function viewEventDetails(eventId) {
    const event = allEvents.find(e => e.id === eventId);
    if (!event) return;

    const modal = document.getElementById('eventDetailsModal');
    const content = document.getElementById('eventDetailsContent');

    content.innerHTML = `
        <h2>${event.title}</h2>
        <img src="${event.image}" alt="${event.title}" style="width:100%; max-height:300px; object-fit:cover; border-radius:5px; margin-bottom:15px;">
        <p><strong>Description:</strong> ${event.description}</p>
        <p><strong>Date & Time:</strong> ${formatDateTime(event.start_datetime, event.end_datetime)}</p>
        <p><strong>Location:</strong> ${event.location}</p>
        <p><strong>Volunteers:</strong> ${event.volunteersRegistered}/${event.volunteersNeeded}</p>
        <p><strong>Category:</strong> ${event.category}</p>
        <p><strong>Status:</strong> ${event.status}</p>
    `;

    modal.style.display = 'block';
}
function closeEventDetails() {
    document.getElementById('eventDetailsModal').style.display = 'none';
}

const modal = document.getElementById('eventDetailsModal');
modal.addEventListener('click', (e) => {
    const content = document.getElementById('eventDetailsContentWrapper'); // the inner div
    if (!content.contains(e.target)) {
        closeEventDetails();
    }
});

function toggleEventCreation() {
    // Implement event creation modal or navigation
    console.log('Toggle event creation');
    // window.location.href = '/create-event.html';
}

