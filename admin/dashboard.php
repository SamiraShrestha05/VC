<?php
session_start();
if(!isset($_SESSION['admin_logged_in'])){
    header("Location: login.php");
    exit();
}
require_once("db/connection.php");
?>
<!DOCTYPE html>
<html>
<head>
    <title>Admin Dashboard</title>
    <link rel="stylesheet" href="css/admin.css">
</head>
<body>
<div class="sidebar">
    <h2>Admin Panel</h2>
    <ul>
        <li onclick="showTab('users')">Users</li>
        <li onclick="showTab('events')">Events</li>
        <li onclick="showTab('blogs')">Blogs</li>
        <li><a href="logout.php">Logout</a></li>
    </ul>
</div>

<div class="main-content">
    <h1>Welcome, <?= $_SESSION['admin_name'] ?> 👋</h1>

    <div id="users" class="tab-content" >
        <h2>Users</h2>
        <button id="openAddUserModal" class="add">Add User</button>
        <table id="users-table">
            <thead>
                <tr>
                    <th>ID</th><th>Username</th><th>Email</th><th>Full Name</th><th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php
                $res = $conn->query("SELECT * FROM user");
                while($row = $res->fetch_assoc()){
                    echo "<tr>
                            <td>{$row['user_id']}</td>
                            <td>{$row['username']}</td>
                            <td>{$row['email']}</td>
                            <td>{$row['full_name']}</td>
                            <td>
                                <button onclick='editUser( {$row['user_id']} )'>Edit</button>
                                <button onclick='deleteUser({$row['user_id']})'>Delete</button>
                            </td>
                          </tr>";
                }
                ?>
            </tbody>
        </table>
        
    </div>

<!-- Add User Modal -->
<div id="addUserModal" class="modal" style="display:none;" >
    <div class="modal-backdrop" onclick="closeAddUserModal()"></div>
     <div class="modal-card">
        <h3>Add User</h3>
    
      <form id="addUserForm">
      <label for="username">Username</label>
      <input type="text" id="username" name="username" required>

      <label for="email">Email</label>
      <input type="email" id="email" name="email" required>

      <label for="full_name">Full Name</label>
      <input type="text" id="full_name" name="full_name" required>

      <label for="password">Password</label>
      <input type="password" id="password" name="password" required>

      <button type="submit" class="add">Add User</button>
    </form>
    </div>
  </div>




<div id="events" class="tab-content" style="display:none;">
    <h2>Events</h2>
     <button class="add" onclick="showAddEventModal()">Add Event</button>
    <table id="events-table">
        <thead>
            <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Description</th>
                <th>Location</th>
                <th>Start</th>
                <th>End</th>
                <th>Slots</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody></tbody>
    </table>
</div>
<!-- Edit Event Modal -->
<div id="editEventModal" class="modal" style="display:none;">
    <div class="modal-backdrop" onclick="closeEditEventModal()"></div>
    <div class="modal-card">
        <h3>Edit Event</h3>
        <form id="editEventForm">
            <input type="hidden" id="edit_event_id" name="event_id">

            <label>Title</label>
            <input id="edit_title" name="title" type="text" required>

            <label>Description</label>
            <textarea id="edit_description" name="description" required></textarea>

            <label>Location</label>
            <input id="edit_location" name="location" type="text" required>

            <label>Start Date & Time</label>
            <input id="edit_start" name="start_datetime" type="datetime-local" required>

            <label>End Date & Time</label>
            <input id="edit_end" name="end_datetime" type="datetime-local" required>

            <label>Volunteer Slots</label>
            <input id="edit_slots" name="volunteer_slots" type="number" min="1" required>

            <label>Status</label>
            <select id="edit_status" name="status">
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
            </select>

            <div style="margin-top:12px;">
                <button type="submit" class="btn primary">Save Changes</button>
                <button type="button" class="btn" onclick="closeEditEventModal()">Cancel</button>
            </div>
        </form>
    </div>
</div>

<!-- Add Event Modal -->
<div id="addEventModal" class="modal" style="display:none;">
    <div class="modal-backdrop" onclick="closeAddEventModal()"></div>
    <div class="modal-card">
        <h3>Add Event</h3>
        <form id="addEventForm">
            <label>Title</label>
            <input id="add_title" name="title" type="text" required>

            <label>Description</label>
            <textarea id="add_description" name="description" required></textarea>

            <label>Location</label>
            <input id="add_location" name="location" type="text" required>

            <label>Start Date & Time</label>
            <input id="add_start" name="start_datetime" type="datetime-local" required>

            <label>End Date & Time</label>
            <input id="add_end" name="end_datetime" type="datetime-local" required>

            <label>Volunteer Slots</label>
            <input id="add_slots" name="volunteer_slots" type="number" min="1" value="1" required>

            <label>Status</label>
            <select id="add_status" name="status">
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
            </select>

            <div style="margin-top:12px;">
                <button type="submit" class="btn primary">Add Event</button>
                <button type="button" class="btn" onclick="closeAddEventModal()">Cancel</button>
            </div>
        </form>
    </div>
</div>

<div id="blogs" class="tab-content" style="display:none;">
    <h2>Blogs</h2>
    <button class="add" onclick="showAddBlogModal()">Add Blog</button>
    <table id="blogs-table">
        <thead>
            <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Content</th>
                <th>Author ID</th>
                <th>Created At</th>
                <th>Updated At</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody></tbody>
    </table>
</div>

<!-- Add Blog Modal -->
<div id="addBlogModal" class="modal" style="display:none;">
    <div class="modal-backdrop" onclick="closeAddBlogModal()"></div>
    <div class="modal-card">
        <h3>Add Blog</h3>
        <form id="addBlogForm">
            <label>Title</label>
            <input type="text" id="add_blog_title" name="title" required>

            <label>Content</label>
            <textarea id="add_blog_content" name="content" required></textarea>

            <div style="margin-top:12px;">
                <button type="submit" class="btn primary">Add Blog</button>
                <button type="button" class="btn" onclick="closeAddBlogModal()">Cancel</button>
            </div>
        </form>
    </div>
</div>

<!-- Edit Blog Modal -->
<div id="editBlogModal" class="modal" style="display:none;">
    <div class="modal-backdrop" onclick="closeEditBlogModal()"></div>
    <div class="modal-card">
        <h3>Edit Blog</h3>
        <form id="editBlogForm">
            <input type="hidden" id="edit_blog_id" name="blog_id">

            <label>Title</label>
            <input type="text" id="edit_blog_title" name="title" required>

            <label>Content</label>
            <textarea id="edit_blog_content" name="content" required></textarea>

            <div style="margin-top:12px;">
                <button type="submit" class="btn primary">Save Changes</button>
                <button type="button" class="btn" onclick="closeEditBlogModal()">Cancel</button>
            </div>
        </form>
    </div>
</div>


</div>
<script src="js/admin.js"></script>
</body>
</html>
