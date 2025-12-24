document.addEventListener("DOMContentLoaded", () => {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) {
        alert("No user session found. Please login.");
        window.location.href = "index.html";
        return;
    }

    const userId = currentUser.user_id;

    const userNameEl = document.getElementById("userName");
    const userEmailEl = document.getElementById("userEmail");
    const userBioEl = document.getElementById("userBio");
    const userIdEl = document.getElementById("userId");

    // Fetch user profile
    fetch(`api/users/profile.php?user_id=${userId}`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                alert("Error: " + data.message);
                return;
            }
            const user = data.data;
            userNameEl.textContent = user.full_name || "N/A";
            userEmailEl.textContent = user.email || "N/A";
            userBioEl.textContent = user.profile_bio || "N/A";
            if(userIdEl) userIdEl.textContent = user.user_id || "N/A";

            // Pre-fill edit form
            document.getElementById('name').value = user.full_name || "";
            document.getElementById('email').value = user.email || "";
            document.getElementById('bio').value = user.profile_bio || "";
        })
        .catch(err => {
            console.error(err);
            alert("Failed to load profile.");
        });

    // Utility function to create content cards
    function createContentCard(item, type) {
        const card = document.createElement('div');
        card.classList.add('content-card');

        let dateField = type === "event" ? item.date : item.created_at;

        card.innerHTML = `
            <h4>${item.title}</h4>
            <p>${item.description || item.content}</p>
            <p><small>${dateField}</small></p>
            <button class="editBtn">Edit</button>
            <button class="deleteBtn">Delete</button>
        `;

        const deleteBtn = card.querySelector('.deleteBtn');
        const editBtn = card.querySelector('.editBtn');
        
        editBtn.addEventListener('click', () => {
            window.location.href = type === "event" 
                ? `components/event-edit.html?event_id=${item.event_id}` 
                : `components/blog-edit.html?blog_id=${item.blog_id}`;
        });

        deleteBtn.addEventListener('click', () => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    // Make sure you have currentUser from sessionStorage
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) {
        alert("User not logged in");
        return;
    }

    const api = type === "event"
        ? 'api/profile/myEvents.php'
        : 'api/profile/myBlogs.php';

    const bodyData = type === "event"
        ? { event_id: item.event_id, user_id: currentUser.user_id }
        : { blog_id: item.blog_id, user_id: currentUser.user_id };

    fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            location.reload();
        } else {
            alert(data.message || 'Delete failed');
        }
    });
});

        return card;
    }

   fetch(`api/profile/myEvents.php?user_id=${userId}`)
    .then(res => res.json())
    .then(result => {
        const events = result.data || [];
        const container = document.getElementById('userEvents');
        container.innerHTML = '';
        if(events.length === 0){
            container.innerHTML = "<p>You have not created any events yet.</p>";
            return;
        }
        events.forEach(event => container.appendChild(createContentCard(event, "event")));
    });

    // Fetch user blogs
  fetch(`api/profile/myBlogs.php?user_id=${userId}`)
    .then(res => res.json())
    .then(result => {
        const blogs = result.data || [];
        const container = document.getElementById('userBlogs');
        container.innerHTML = '';
        if(blogs.length === 0){
            container.innerHTML = "<p>You have not created any blogs yet.</p>";
            return;
        }
        blogs.forEach(blog => container.appendChild(createContentCard(blog, "blog")));
    });
     // =========================
    // Fetch notifications
    // =========================
    function loadNotifications() {
        fetch(`api/notifications/get.php?user_id=${userId}`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                const container = document.getElementById('notificationsList');
                container.innerHTML = '';
                
                if (!data.success || !data.data || data.data.length === 0) {
                    container.innerHTML = "<li>No notifications yet.</li>";
                    return;
                }

                data.data.forEach(notif => {
                    const li = document.createElement('li');
                    li.textContent = `${notif.message} - ${new Date(notif.created_at).toLocaleString()}`;
                    if (!notif.is_read) li.style.fontWeight = 'bold';
                    container.appendChild(li);
                });
            })
            .catch(err => {
                console.error("Error loading notifications:", err);
                document.getElementById('notificationsList').innerHTML = "<li>Error loading notifications</li>";
            });
    }

    // Load notifications on page load
    loadNotifications();

    // =========================
// Fetch My Registrations
// =========================
function loadRegistrations() {
    fetch(`api/registrations/my.php?user_id=${userId}`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('myRegistrationsList');
            container.innerHTML = ''; // clear previous items

            if (!data.success || !data.data || data.data.length === 0) {
                container.innerHTML = "<li>No registrations yet.</li>";
                return;
            }

            data.data.forEach(reg => {
    const li = document.createElement('li');

    // Highlight registrations for events today or tomorrow
    const eventDate = new Date(reg.start_datetime.replace(' ', 'T'));
    const today = new Date();
    const diffDays = Math.floor((eventDate - today)/(1000*60*60*24));
    if (diffDays <= 1 && diffDays >= 0) {
        li.style.fontWeight = 'bold';
        li.style.borderLeft = '4px solid #38a169';
        li.style.background = '#f0fff4';
    }

    li.innerHTML = `
        <span class="msg">Your registration for this event:</span>
        <div class="event-info">
            <strong>${reg.event_title}</strong><br>
            Date: ${eventDate.toLocaleDateString()}<br>
            Status: ${reg.registration_status || "Confirmed"}
        </div>
    `;

    container.appendChild(li);
});

        })
        .catch(err => {
            console.error("Error loading registrations:", err);
            document.getElementById('myRegistrationsList').innerHTML = "<li>Error loading registrations</li>";
        });
}

// Load registrations on page load
loadRegistrations();

});
