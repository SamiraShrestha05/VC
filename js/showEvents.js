// Global variables
let allEvents = [];
let currentView = 'grid';

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function () {
    loadEvents();
});

// Load events from database
async function loadEvents() {
    try {
        showLoading(true);

        const response = await fetch('api/events/showEvents.php');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to load events');
        }

        // Transform DB data
        allEvents = result.data.map(event => ({
            id: event.event_id,
            title: event.title,
            description: event.description,
            location: event.location,
            start_datetime: event.start_datetime,
            end_datetime: event.end_datetime,
            volunteersNeeded: event.volunteer_slots || 1,
            volunteersRegistered: event.registered_volunteers || 0,
            status: mapStatus(event.status),
            category: event.category || 'community',
            created_by: event.created_by,
            created_at: event.created_at,
            image: '/default-event-image.jpg'
        }));

        console.log('Loaded events:', allEvents);

        displayEvents(allEvents);

    } catch (error) {
        console.error('Error loading events:', error);
        showError('Failed to load events: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Map database status to frontend status
function mapStatus(dbStatus) {
    const statusMap = {
        upcoming: 'active',
        ongoing: 'active',
        completed: 'completed',
        cancelled: 'cancelled'
    };
    return statusMap[dbStatus] || 'active';
}

// Display events
function displayEvents(events) {
    const container = document.getElementById('eventsContainer');
    const noEvents = document.getElementById('noEvents');

    if (!events.length) {
        container.innerHTML = '';
        noEvents.style.display = 'block';
        return;
    }

    noEvents.style.display = 'none';

    container.className =
        currentView === 'grid'
            ? 'events-container-grid'
            : 'events-container-list';

    container.innerHTML =
        currentView === 'grid'
            ? events.map(createEventCard).join('')
            : events.map(createEventListItem).join('');
}

// Grid card
function createEventCard(event) {
    return `
        <div class="event-card">
            <div class="event-image">
                <span class="event-status ${event.status}">${event.status}</span>
            </div>

            <div class="event-content">
                <h3>${event.title}</h3>
                <p>${event.description.substring(0, 100)}...</p>

                <div class="event-details">
                    <div>📅 ${formatDateTime(event.start_datetime, event.end_datetime)}</div>
                    <div>📍 ${event.location}</div>
                    <div>👥 ${event.volunteersRegistered}/${event.volunteersNeeded}</div>
                    <div>${getCategoryIcon(event.category)} ${event.category}</div>
                </div>

                <div class="event-actions">
                    <button class="btn-primary" onclick="viewEventDetails(${event.id})">View Details</button>
                    <button class="btn-secondary" onclick="showRegisterModal(${event.id}, ${event.created_by})">
                        Register
                    </button>
                </div>
            </div>
        </div>
    `;
}

// List item
function createEventListItem(event) {
    return `
        <div class="event-list-item">
            <h3>${event.title}</h3>
            <p>${event.description.substring(0, 150)}...</p>

            <div class="event-meta">
                📅 ${formatDateTime(event.start_datetime, event.end_datetime)} |
                📍 ${event.location} |
                ${getCategoryIcon(event.category)} ${event.category} |
                👥 ${event.volunteersRegistered}/${event.volunteersNeeded}
            </div>

            <div class="event-actions">
                <button onclick="viewEventDetails(${event.id})">View Details</button>
                <button onclick="showRegisterModal(${event.id}, ${event.created_by})">
                    Register
                </button>
            </div>
        </div>
    `;
}

// Helpers
function formatDateTime(startDateTime, endDateTime) {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    return `${start.toLocaleDateString()} ${start.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    })} - ${end.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    })}`;
}

function getCategoryIcon(category) {
    const icons = {
        environment: '🌱',
        education: '📚',
        healthcare: '🏥',
        community: '🏘️',
        animals: '🐾',
        seniors: '👵',
        children: '🧒',
        other: '🎯'
    };
    return icons[category] || '🎯';
}

// View toggle
function changeView(view) {
    currentView = view;
    displayEvents(allEvents);
    document.getElementById('viewDropdown').style.display = 'none';
}

// UI helpers
function showLoading(show) {
    document.getElementById('loadingEvents').style.display = show ? 'block' : 'none';
}

function showError(message) {
    alert(message);
}

// Event details modal
function viewEventDetails(eventId) {
    const event = allEvents.find(e => e.id === eventId);
    if (!event) return;

    document.getElementById('eventDetailsContent').innerHTML = `
        <h2>${event.title}</h2>
        <p>${event.description}</p>
        <p><strong>Date:</strong> ${formatDateTime(event.start_datetime, event.end_datetime)}</p>
        <p><strong>Location:</strong> ${event.location}</p>
        <p><strong>Volunteers:</strong> ${event.volunteersRegistered}/${event.volunteersNeeded}</p>
        <p><strong>Status:</strong> ${event.status}</p>
    `;

    document.getElementById('eventDetailsModal').style.display = 'block';
}

function closeEventDetails() {
    document.getElementById('eventDetailsModal').style.display = 'none';
}
