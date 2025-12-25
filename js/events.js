   document.addEventListener('DOMContentLoaded', function() {
            const form = document.getElementById('createEventForm'); // Fixed form ID
            const alertSuccess = document.getElementById('alert-success');
            const alertError = document.getElementById('alert-error');
            
            // Set minimum datetime to current time
            const now = new Date();
            const timezoneOffset = now.getTimezoneOffset() * 60000;
            const localISOTime = new Date(now - timezoneOffset).toISOString().slice(0, 16);
            document.getElementById('eventStartDate').min = localISOTime;
            document.getElementById('eventEndDate').min = localISOTime;
            
            // Form validation
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Basic validation
                const title = document.getElementById('eventTitle').value.trim();
                const description = document.getElementById('eventDescription').value.trim();
                const location = document.getElementById('eventLocation').value.trim();
                const startDatetime = document.getElementById('eventStartDate').value;
                const endDatetime = document.getElementById('eventEndDate').value;
                const category = document.getElementById('eventCategory').value;
                const slots = document.getElementById('eventSlots').value;
                
                // Hide any previous alerts
                alertSuccess.style.display = 'none';
                alertError.style.display = 'none';
                
                if (!title || !description || !location || !startDatetime || !endDatetime || !category) {
                    showAlert('Please fill in all required fields.', 'error');
                    return;
                }
                
                // Validate dates
                const startDate = new Date(startDatetime);
                const endDate = new Date(endDatetime);
                
                if (endDate <= startDate) {
                    showAlert('End date must be after start date.', 'error');
                    return;
                }
                
                // Submit form via AJAX
                submitForm();
            });
            
          
           
            // Function to submit form via AJAX
            async function submitForm() {
    const formData = new FormData(form);

    // Fetch current user from profile.php
    const userRes = await fetch('api/users/profile.php', { method: 'GET', credentials: 'include' });
    const userData = await userRes.json();
    if (!userData.success) {
        showAlert('Error fetching user info', 'error');
        return;
    }

    // Append user_id to formData
    formData.append('user_id', userData.data.user_id);

    // Show loading spinner
    document.getElementById('loading').style.display = 'block';

    fetch('api/events/testEvent.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Response:', data);
        document.getElementById('loading').style.display = 'none';
        if (data.success) {
            sessionStorage.setItem('notificationType', 'success');
            sessionStorage.setItem('notificationMessage', 'Event created successfully!');
            window.location.href = 'dashboard.html';
        } else {
            sessionStorage.setItem('notificationType', 'error');
            sessionStorage.setItem('notificationMessage', 'Failed to create event.');
            showAlert('error', 'Failed to create event.');
        }
    })
    .catch(error => {
        console.error(error);
        document.getElementById('loading').style.display = 'none';
        sessionStorage.setItem('notificationType', 'error');
        sessionStorage.setItem('notificationMessage', 'An error occurred while creating the event.');
        showAlert('error', 'An error occurred while creating the event.');
    });
}

});

        // Cancel function
        function cancelEventCreation() {
            if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
                window.location.href = 'dashboard.html'; // or wherever you want to redirect
            }
            
        }



