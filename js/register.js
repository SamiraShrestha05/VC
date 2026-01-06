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
    const currentUserId = await getCurrentUserId();
    
    if (!currentUserId) {
        showNotification("You must be logged in to register.", "error");
        return;
    }

    if (currentUserId == authorId) {
        showNotification("You cannot register for your own event.", "error");
        return;
    }

    // Pre-populate form with user data if available
    if (currentUser) {
        document.getElementById('fullName').value = currentUser.full_name || '';
        document.getElementById('email').value = currentUser.email || '';
    }

    // Set hidden fields
    document.getElementById('registerEventId').value = eventId;
    document.getElementById('registerUserId').value = currentUserId;

    // Reset form
    document.getElementById('volunteerRegistrationForm').reset();

    // Show modal
    document.getElementById('registerModal').style.display = 'block';
    
    console.log('Opening register modal for:', { eventId, currentUserId });
}

// Close modal
function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
}

// Handle form submission
document.getElementById('volunteerRegistrationForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    await confirmRegistration();
});

async function confirmRegistration() {
    const eventId = document.getElementById('registerEventId').value;
    const userId = document.getElementById('registerUserId').value;
    
    if (!eventId || !userId) {
        showNotification("Event ID or User ID missing!", "error");
        return;
    }
    
    // Validate required fields
    const requiredFields = [
        { id: 'fullName', name: 'Full Name' },
        { id: 'email', name: 'Email Address' },
        { id: 'phone', name: 'Phone Number' },
        { id: 'emergencyContact', name: 'Emergency Contact' },
        { id: 'dateOfBirth', name: 'Date of Birth' }
    ];
    
    for (const field of requiredFields) {
        const element = document.getElementById(field.id);
        if (!element.value.trim()) {
            showNotification(`${field.name} is required`, "error");
            element.focus();
            return;
        }
    }
    
    // Validate volunteer role
    const volunteerRole = document.getElementById('volunteerRole').value;
    if (!volunteerRole) {
        showNotification("Please select a preferred role", "error");
        return;
    }
    
    // Validate at least one time slot
    const timeSlots = document.querySelectorAll('input[name="timeSlots[]"]:checked');
    if (timeSlots.length === 0) {
        showNotification("Please select at least one time commitment slot", "error");
        return;
    }
    
    // Validate required checkboxes
    if (!document.getElementById('agreeTerms').checked) {
        showNotification("You must agree to the Terms of Service and Privacy Policy", "error");
        return;
    }
    
    if (!document.getElementById('agreeCode').checked) {
        showNotification("You must agree to the Volunteer Code of Conduct", "error");
        return;
    }
    
    // Validate date of birth (must be at least 16 years old)
    const dob = new Date(document.getElementById('dateOfBirth').value);
    const today = new Date();
    const minAgeDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
    
    if (dob > minAgeDate) {
        showNotification("You must be at least 16 years old to volunteer", "error");
        return;
    }
    
    // Validate email format
    const email = document.getElementById('email').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification("Please enter a valid email address", "error");
        return;
    }
    
    // Validate phone number (basic validation)
    const phone = document.getElementById('phone').value;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
        showNotification("Please enter a valid phone number", "error");
        return;
    }
    
    // Collect form data
    const formData = {
        event_id: eventId,
        user_id: userId,
        fullName: document.getElementById('fullName').value.trim(),
        email: email,
        phone: phone,
        emergencyContact: document.getElementById('emergencyContact').value.trim(),
        dateOfBirth: document.getElementById('dateOfBirth').value,
        volunteerRole: volunteerRole,
        timeSlots: Array.from(timeSlots).map(cb => cb.value),
        experience: document.getElementById('experience').value.trim(),
        skills: document.getElementById('skills').value.trim(),
        photoRelease: document.getElementById('photoRelease').checked,
        additionalNotes: document.getElementById('additionalNotes').value.trim()
    };
    
    // Show loading state
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const spinner = submitBtn.querySelector('.spinner');
    btnText.textContent = 'Submitting...';
    spinner.style.display = 'inline-block';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('/samira/VC/api/volunteers/register.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
            credentials: 'include'
        });

        const text = await response.text();
        let result;
        try {
            result = JSON.parse(text);
        } catch(e) {
            console.error("Invalid JSON from server:", text);
            showNotification("Server returned invalid response.", "error");
            return;
        }

        console.log('Registration response:', result);

        if (result.success) {
            showNotification("Successfully registered! You will receive a confirmation email.");
            closeRegisterModal();
            if (typeof loadEvents === 'function') {
                loadEvents();
            }
        } else {
            showNotification("Registration failed: " + result.error, "error");
        }
    } catch (err) {
        console.error(err);
        showNotification("An error occurred during registration.", "error");
    } finally {
        // Reset button state
        btnText.textContent = 'Submit Registration';
        spinner.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('registerModal');
    if (event.target == modal) {
        closeRegisterModal();
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

