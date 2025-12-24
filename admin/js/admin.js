document.addEventListener('DOMContentLoaded', () => {
    loadUsers();

    document.getElementById('add-user-btn').addEventListener('click', addUser);
});

function loadUsers(){
    let formData = new FormData();
    formData.append('action','list');

    fetch('ajax/users.php', {
        method:'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        const tbody = document.querySelector("#users-table tbody");
        tbody.innerHTML = '';
        data.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.user_id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.full_name}</td>
                <td>
                    <button class="edit" onclick="editUser(${user.user_id})">Edit</button>
                    <button class="delete" onclick="deleteUser(${user.user_id})">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    })
    .catch(err => console.error(err));
}

function addUser(){
    const username = prompt("Enter username");
    const email = prompt("Enter email");
    const full_name = prompt("Enter full name");
    const password = prompt("Enter password");

    if(!username || !email || !full_name || !password) return;

    let formData = new FormData();
    formData.append('action','add');
    formData.append('username',username);
    formData.append('email',email);
    formData.append('full_name',full_name);
    formData.append('password',password);

    fetch('ajax/users.php',{
        method:'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        if(data.success) loadUsers();
    })
    .catch(err => console.error(err));
}


// ===== Edit User =====
function editUser(user_id){
    const username = prompt("New username:");
    const email = prompt("New email:");
    const full_name = prompt("New full name:");

    fetch('ajax/users.php', {
        method: 'POST',
        body: new URLSearchParams({
            action: 'edit',
            user_id,
            username,
            email,
            full_name
        })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        if(data.success) loadUsers();
    });
}


// ===== Delete User =====
function deleteUser(id){
    if(confirm("Are you sure to delete this user?")){
        fetch('ajax/users.php', {
            method: 'POST',
            body: new URLSearchParams({
                action: 'delete',
                id
            })
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            if(data.success) loadUsers();
        });
    }
}

function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });

    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) selectedTab.style.display = 'block';

    // Load data dynamically if events tab
    if (tabName === 'events') {
        loadEvents();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 1️⃣ Load events immediately on page load
    loadEvents();

    // 2️⃣ Bind Add Event form submission
    const addForm = document.getElementById('addEventForm');
    addForm.addEventListener('submit', function(e){
        e.preventDefault();

        let fd = new FormData(this);
        fd.append('action', 'add');  // important for PHP

        console.log([...fd.entries()]); // optional: debug form data

        fetch('ajax/events.php', {
            method: 'POST',
            body: fd
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message || (data.success ? 'Event added' : 'Failed'));
            if(data.success){
                closeAddEventModal();  // hide modal
                loadEvents();          // refresh table
                this.reset();          // clear form
            }
        })
        .catch(err => {
            console.error(err);
            alert('Error adding event');
        });
    });

    // Optional: Bind Add Event button to show modal
    const addBtn = document.getElementById('add-event-btn');
    if(addBtn){
        addBtn.addEventListener('click', showAddEventModal);
    }
});

// ===== Load Events =====
function loadEvents() {
    const tbody = document.querySelector("#events-table tbody");
    tbody.innerHTML = '<tr><td colspan="9">Loading...</td></tr>';

    let fd = new FormData();
    fd.append('action','list');

    fetch('ajax/events.php',{method:'POST',body:fd})
    .then(res=>res.json())
    .then(data=>{
        tbody.innerHTML='';
        if(!Array.isArray(data)||data.length===0){
            tbody.innerHTML='<tr><td colspan="9">No events found</td></tr>';
            return;
        }
        data.forEach(ev=>{
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${ev.event_id}</td>
                <td>${ev.title}</td>
                <td>${ev.description}</td>
                <td>${ev.location}</td>
                <td>${ev.start_datetime}</td>
                <td>${ev.end_datetime}</td>
                <td>${ev.volunteer_slots}</td>
                <td>${ev.status}</td>
                <td>
                    <button class="edit" onclick="editEvent(${ev.event_id})">Edit</button>
                    <button class="delete" onclick="deleteEvent(${ev.event_id})">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    })
    .catch(err=>{console.error(err); tbody.innerHTML='<tr><td colspan="9">Error loading events</td></tr>';});
}

// ===== Edit Event =====
function editEvent(id){
    let fd = new FormData();
    fd.append('action','get');
    fd.append('event_id',id);

    fetch('ajax/events.php',{method:'POST',body:fd})
    .then(res=>res.json())
    .then(data=>{
        if(!data.event_id && !data.success){ alert(data.message||'Error'); return; }

        document.getElementById('edit_event_id').value=data.event_id;
        document.getElementById('edit_title').value=data.title;
        document.getElementById('edit_description').value=data.description;
        document.getElementById('edit_location').value=data.location;
        document.getElementById('edit_start').value=data.start_datetime.replace(' ','T');
        document.getElementById('edit_end').value=data.end_datetime.replace(' ','T');
        document.getElementById('edit_slots').value=data.volunteer_slots;
        document.getElementById('edit_status').value=data.status;

        document.getElementById('editEventModal').style.display='flex';
    });
}

document.getElementById('editEventForm').addEventListener('submit',function(e){
    e.preventDefault();
    let fd = new FormData(this);
    fd.append('action','edit');

    fetch('ajax/events.php',{method:'POST',body:fd})
    .then(res=>res.json())
    .then(data=>{
        alert(data.message || (data.success?'Updated':'Failed'));
        if(data.success){ closeEditEventModal(); loadEvents(); }
    });
});

function closeEditEventModal(){ document.getElementById('editEventModal').style.display='none'; }

// ===== Add Event =====
function showAddEventModal(){ document.getElementById('addEventModal').style.display='flex'; }
function closeAddEventModal(){ document.getElementById('addEventModal').style.display='none'; }

document.getElementById('addEventForm').addEventListener('submit', function(e){
    e.preventDefault();
    
    let fd = new FormData(this);

    // Convert datetime-local fields to MySQL DATETIME format
    let start = fd.get('start_datetime'); // "2025-11-23T20:00"
    let end = fd.get('end_datetime');
    fd.set('start_datetime', start.replace('T',' ') + ':00'); // "2025-11-23 20:00:00"
    fd.set('end_datetime', end.replace('T',' ') + ':00');

    fd.append('action','add');

    fetch('ajax/events.php',{
        method:'POST',
        body: fd
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message || (data.success?'Added':'Failed'));
        if(data.success){
            closeAddEventModal();
            loadEvents();
            this.reset();
        }
    })
    .catch(err=>{
        console.error(err);
        alert('Error adding event');
    });
});



// ===== Delete Event =====
function deleteEvent(id){
    if(!confirm('Delete this event?')) return;
    let fd = new FormData();
    fd.append('action','delete');
    fd.append('event_id',id);

    fetch('ajax/events.php',{method:'POST',body:fd})
    .then(res=>res.json())
    .then(data=>{
        alert(data.message || (data.success?'Deleted':'Failed'));
        if(data.success) loadEvents();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // 1️⃣ Load all blogs immediately when page loads
    loadBlogs();

    // 2️⃣ Bind Add Blog form
    const addForm = document.getElementById('addBlogForm');
    addForm.addEventListener('submit', function(e){
        e.preventDefault();

        let fd = new FormData(this);
        fd.append('action', 'add');  // important for PHP to detect 'add'

        console.log([...fd.entries()]); // debug: see all form fields in console

        fetch('ajax/blogs.php', {
            method: 'POST',
            body: fd
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message || (data.success ? 'Added' : 'Failed'));
            if(data.success){
                closeAddBlogModal();  // hide modal
                loadBlogs();          // reload table
                this.reset();         // clear form
            }
        })
        .catch(err => {
            console.error(err);
            alert('Error submitting blog');
        });
    });

    // Optional: Bind Add Blog button to show modal
    const addBtn = document.getElementById('add-blog-btn');
    if(addBtn){
        addBtn.addEventListener('click', showAddBlogModal);
    }
});

// ===== Load Blogs =====
function loadBlogs(){
    const tbody = document.querySelector("#blogs-table tbody");
    tbody.innerHTML='<tr><td colspan="7">Loading...</td></tr>';

    let fd = new FormData();
    fd.append('action','list');

    fetch('ajax/blogs.php',{method:'POST',body:fd})
    .then(res=>res.json())
    .then(data=>{
        tbody.innerHTML='';

        if(!Array.isArray(data) || data.length===0){
            tbody.innerHTML='<tr><td colspan="7">No blogs found</td></tr>';
            return;
        }

        data.forEach(blog=>{
            const tr=document.createElement('tr');
            tr.innerHTML=`
                <td>${blog.blog_id}</td>
                <td>${blog.title}</td>
                <td>${blog.content.substring(0,50)}...</td>
                <td>${blog.author_id}</td>
                <td>${blog.created_at}</td>
                <td>${blog.updated_at}</td>
                <td>
                    <button class="edit" onclick="editBlog(${blog.blog_id})">Edit</button>
                    <button class="delete" onclick="deleteBlog(${blog.blog_id})">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    })
    .catch(err=>{
        console.error(err);
        tbody.innerHTML='<tr><td colspan="7">Error loading blogs</td></tr>';
    });
}


// ===== Add Blog =====
function showAddBlogModal(){ document.getElementById('addBlogModal').style.display='flex'; }
function closeAddBlogModal(){ document.getElementById('addBlogModal').style.display='none'; }

document.getElementById('addBlogForm').addEventListener('submit',function(e){
    e.preventDefault();
    let fd=new FormData(this);
    fd.append('action','add');

    fetch('ajax/blogs.php',{method:'POST',body:fd})
    .then(res=>res.json())
    .then(data=>{
        alert(data.message || (data.success?'Added':'Failed'));
        if(data.success){ closeAddBlogModal(); loadBlogs(); this.reset(); }
    });
});

// ===== Edit Blog =====
function editBlog(id){
    let fd=new FormData();
    fd.append('action','get');
    fd.append('blog_id',id);

    fetch('ajax/blogs.php',{method:'POST',body:fd})
    .then(res=>res.json())
    .then(data=>{
        if(!data.blog_id){ alert(data.message||'Error'); return; }

        document.getElementById('edit_blog_id').value=data.blog_id;
        document.getElementById('edit_blog_title').value=data.title;
        document.getElementById('edit_blog_content').value=data.content;

        document.getElementById('editBlogModal').style.display='flex';
    });
}

document.getElementById('editBlogForm').addEventListener('submit',function(e){
    e.preventDefault();
    let fd=new FormData(this);
    fd.append('action','edit');

    fetch('ajax/blogs.php',{method:'POST',body:fd})
    .then(res=>res.json())
    .then(data=>{
        alert(data.message || (data.success?'Updated':'Failed'));
        if(data.success){ closeEditBlogModal(); loadBlogs(); }
    });
});

function closeEditBlogModal(){ document.getElementById('editBlogModal').style.display='none'; }

// ===== Delete Blog =====
function deleteBlog(id){
    if(!confirm('Delete this blog?')) return;
    let fd=new FormData();
    fd.append('action','delete');
    fd.append('blog_id',id);

    fetch('ajax/blogs.php',{method:'POST',body:fd})
    .then(res=>res.json())
    .then(data=>{
        alert(data.message || (data.success?'Deleted':'Failed'));
        if(data.success) loadBlogs();
    });
}
