class Dashboard {
    constructor() {
        this.currentBlogId = null;
        this.init();
    }

    async init() {
        // Check if user is logged in
        const userData = sessionStorage.getItem('currentUser');
        if (!userData) {
            window.location.href = 'index.html';
            return;
        }

        await this.loadDashboardData();
        this.attachEventListeners();
    }

    async loadDashboardData() {
        try {
            showLoading();
            
            const response = await fetch('api/dashboard/get_dashboard_data.php');
            const data = await response.json();
            
            if (data.success) {
                this.displayDashboard(data.data);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
            showNotification('Failed to load dashboard data', 'error');
        } finally {
            hideLoading();
        }
    }

    displayDashboard(data) {
        this.displayWelcome(data.user);
        this.displayStats(data.user_stats);
        this.displayEvents(data.upcoming_events);
        this.displayBlogs(data.recent_blogs);
        this.displayRegistrations(data.user_registrations);
    }

    displayWelcome(user) {
        document.getElementById('welcomeName').textContent = user.full_name;
        document.getElementById('userName').textContent = user.full_name;
    }

    displayStats(stats) {
        const statsGrid = document.getElementById('statsGrid');
        statsGrid.innerHTML = `
            <div class="stat-card">
                <h3>${stats.total_registrations}</h3>
                <p>Total Event Registrations</p>
            </div>
            <div class="stat-card">
                <h3>${stats.confirmed_registrations}</h3>
                <p>Confirmed Participations</p>
            </div>
            <div class="stat-card">
                <h3>${stats.blog_posts}</h3>
                <p>Blog Posts Written</p>
            </div>
        `;
    }

    displayEvents(events) {
        const eventsList = document.getElementById('eventsList');
        
        if (events.length === 0) {
            eventsList.innerHTML = '<p class="no-data">No upcoming events found.</p>';
            return;
        }

        eventsList.innerHTML = events.map(event => `
            <div class="event-item">
                <h3>${event.title}</h3>
                <p>${event.description.substring(0, 100)}...</p>
                <div class="event-meta">
                    <div class="meta-item">
                        <span>📍 ${event.location}</span>
                    </div>
                    <div class="meta-item">
                        <span>📅 ${this.formatDate(event.start_datetime)}</span>
                    </div>
                    <div class="meta-item">
                        <span>👥 ${event.volunteer_slots} slots</span>
                    </div>
                </div>
                <button class="btn-register" onclick="registerForEvent(${event.event_id})">
                    Register Now
                </button>
            </div>
        `).join('');
    }

    displayBlogs(blogs) {
        const blogsList = document.getElementById('blogsList');
        
        if (blogs.length === 0) {
            blogsList.innerHTML = '<p class="no-data">No blog posts yet. Be the first to share your story!</p>';
            return;
        }

        blogsList.innerHTML = blogs.map(blog => `
            <div class="blog-item">
                <h3>${blog.title}</h3>
                <div class="blog-content">${blog.content.substring(0, 150)}...</div>
                <div class="blog-meta">
                    <span class="blog-author">By ${blog.full_name}</span>
                    <div class="blog-actions">
                        <span>💬 ${blog.comment_count || 0}</span>
                        <button class="btn-comment" onclick="showComments(${blog.blog_id})">
                            Comment
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    displayRegistrations(registrations) {
        const registrationsGrid = document.getElementById('registrationsGrid');
        
        if (registrations.length === 0) {
            registrationsGrid.innerHTML = '<p class="no-data">You haven\'t registered for any events yet.</p>';
            return;
        }

        registrationsGrid.innerHTML = registrations.map(reg => `
            <div class="registration-card ${reg.status}">
                <div class="registration-status status-${reg.status}">
                    ${reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                </div>
                <h4>${reg.title}</h4>
                <p><strong>Location:</strong> ${reg.location}</p>
                <p><strong>Date:</strong> ${this.formatDate(reg.start_datetime)}</p>
                <p><strong>Registered:</strong> ${this.formatDate(reg.registered_at)}</p>
            </div>
        `).join('');
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    attachEventListeners() {
        // Create blog form
        const blogForm = document.getElementById('createBlogForm');
        if (blogForm) {
            blogForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.createBlogPost();
            });
        }

        // Add comment form
        const commentForm = document.getElementById('addCommentForm');
        if (commentForm) {
            commentForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.addComment();
            });
        }
    }

    async createBlogPost() {
        const title = document.getElementById('blogTitle').value;
        const content = document.getElementById('blogContent').value;
        const userData = JSON.parse(sessionStorage.getItem('currentUser'));

        if (!title || !content) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        try {
            showLoading();
            const response = await fetch('api/blogs/create_blog.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: title,
                    content: content,
                    author_id: userData.user_id
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification('Blog post published successfully!', 'success');
                document.getElementById('createBlogForm').reset();
                this.loadDashboardData(); // Reload to show new post
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            console.error('Error creating blog:', error);
            showNotification('Failed to publish blog post', 'error');
        } finally {
            hideLoading();
        }
    }

    async addComment() {
        const content = document.getElementById('commentContent').value;
        const userData = JSON.parse(sessionStorage.getItem('currentUser'));

        if (!content || !this.currentBlogId) {
            showNotification('Please enter a comment', 'error');
            return;
        }

        try {
            showLoading();
            const response = await fetch('api/blogs/add_comment.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: content,
                    user_id: userData.user_id,
                    blog_id: this.currentBlogId
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification('Comment added successfully!', 'success');
                document.getElementById('commentContent').value = '';
                this.loadComments(this.currentBlogId);
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            showNotification('Failed to add comment', 'error');
        } finally {
            hideLoading();
        }
    }

    async loadComments(blogId) {
        try {
            const response = await fetch(`api/blogs/get_comments.php?blog_id=${blogId}`);
            const data = await response.json();
            
            if (data.success) {
                this.displayComments(data.data);
            }
        } catch (error) {
            console.error('Error loading comments:', error);
        }
    }

    displayComments(comments) {
        const commentsList = document.getElementById('commentsList');
        
        if (comments.length === 0) {
            commentsList.innerHTML = '<p class="no-data">No comments yet. Be the first to comment!</p>';
            return;
        }

        commentsList.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <div class="comment-author">${comment.full_name}</div>
                <div class="comment-content">${comment.content}</div>
                <small>${this.formatDate(comment.created_at)}</small>
            </div>
        `).join('');
    }
}

// Global functions
function showComments(blogId) {
    const dashboard = window.dashboard;
    dashboard.currentBlogId = blogId;
    dashboard.loadComments(blogId);
    document.getElementById('commentsModal').style.display = 'block';
}

function closeCommentsModal() {
    document.getElementById('commentsModal').style.display = 'none';
    document.getElementById('commentContent').value = '';
}

async function registerForEvent(eventId) {
    try {
        showLoading();
        const response = await fetch('api/events/register.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ event_id: eventId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Successfully registered for the event!', 'success');
            window.dashboard.loadDashboardData(); // Reload dashboard
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Registration failed. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

function viewAllEvents() {
    // Navigate to events page (to be implemented)
    showNotification('Events page coming soon!', 'info');
}

function viewAllBlogs() {
    // Navigate to blogs page (to be implemented)
    showNotification('Blogs page coming soon!', 'info');
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Utility functions
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showNotification(message, type) {
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
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        animation: slideIn 0.3s;
    `;
    
    document.body.appendChild(notification);
    
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

// Add CSS animations
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
    .no-data {
        text-align: center;
        color: #6c757d;
        font-style: italic;
        padding: 2rem;
    }
`;
document.head.appendChild(style);

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.dashboard = new Dashboard();
});