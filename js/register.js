let currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || null;
document.addEventListener("DOMContentLoaded", () => {
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
            console.error("Failed to load profile:", err);
        });
});


async function getCurrentUserId() {
    if (currentUser && currentUser.user_id) return currentUser.user_id;

    try {
        const res = await fetch('/api/users/profile.php', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch profile');

        const data = await res.json();
        console.log('Profile API response:', data);

        if (data.success && data.data && data.data.user_id) {
            currentUser = data.data; // update global
            return currentUser.user_id;
        } else {
            return 0;
        }
    } catch (err) {
        console.error(err);
        return 0;
    }
}


async function showRegisterModal(eventId, authorId) {
    const currentUserId = await getCurrentUserId(); // ✅ must await

    console.log('Current User ID:', currentUserId);

    if (!currentUserId) {
    showNotification("You must be logged in to register.", "error");
    return;
}

if (currentUserId === authorId) {
    showNotification("You cannot register for your own event.", "error");
    return;
}


    const modal = document.getElementById('registerModal');
    modal.style.display = 'block';
    document.getElementById('registerEventId').value = eventId;
    document.getElementById('registerUserId').value = currentUserId;

    console.log('Opening register modal for:', { eventId, currentUserId });
}




// Close modal
function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
}

async function confirmRegistration() {
    const eventId = document.getElementById('registerEventId')?.value;
    const userId = document.getElementById('registerUserId')?.value;

    if (!eventId || !userId) {
        alert('Event ID or User ID missing!');
        return;
    }

    try {
        const response = await fetch('/samira/VC/api/volunteers/register.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_id: eventId, user_id: userId }),
            credentials: 'include'
        });

        const text = await response.text(); // read as text first
        let result;
        try {
            result = JSON.parse(text);
        } catch(e) {
            console.error("Invalid JSON from server:", text);
            alert("Server returned invalid response. Check console.");
            return;
        }

        console.log('Registration response:', result);

        if (result.success) {
    showNotification("Successfully registered!");
    closeRegisterModal();
    loadEvents();
} else {
    showNotification("Registration failed: " + result.error, "error");
}


    } catch (err) {
        console.error(err);
        alert("An error occurred during registration.");
    }
}


function showNotification(message, type = "success") {
    const notif = document.getElementById("notification");
    notif.textContent = message;

    // Change color based on type
    notif.style.background = type === "success" ? "#4caf50" : "#f44336";

    notif.classList.add("show");

    // Hide after 3 seconds
    setTimeout(() => {
        notif.classList.remove("show");
    }, 3000);
}

