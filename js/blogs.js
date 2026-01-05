// Global variables
let allBlogs = [];

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Blogs script loaded');
    loadBlogs();
    setupEventListeners();
});

function setupEventListeners() {
    const titleInput = document.getElementById('blogTitle');
    if (titleInput) {
        titleInput.addEventListener('input', updateCharCount);
    }

    const blogForm = document.getElementById('createBlogForm');
    if (blogForm) {
        blogForm.addEventListener('submit', handleBlogSubmit);
    }
}

// Load blogs
async function loadBlogs() {
    try {
        showBlogLoading(true);

        const response = await fetch('api/blogs/showBlogs.php');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Failed to load blogs');
        }

        allBlogs = result.data || [];
        displayBlogs();

    } catch (error) {
        console.error('❌ Error loading blogs:', error);
        showBlogError(error.message);
    } finally {
        showBlogLoading(false);
    }
}

// Display blogs
function displayBlogs() {
    const container = document.getElementById('blogsList');

    if (!allBlogs.length) {
        container.innerHTML = '';
        showNoBlogs();
        return;
    }

    hideNoBlogs();
    container.innerHTML = allBlogs.map(createBlogCard).join('');
}

// Blog card
function createBlogCard(blog) {
    const excerpt = blog.content.length > 150
        ? blog.content.substring(0, 150) + '...'
        : blog.content;

    const date = formatDate(blog.created_at);

    return `
        <div class="blog-card" data-blog-id="${blog.blog_id}">
            <h3>${blog.title}</h3>

            <p style="opacity:.8;font-size:14px">
                By ${blog.author_name || 'Unknown'} • ${date}
            </p>

            <p>${excerpt}</p>

            <div class="blog-actions">
                <button class="btn-primary" onclick="viewBlogDetails(${blog.blog_id})">
                    Read More
                </button>
                <button class="btn-secondary" onclick="shareBlog(${blog.blog_id})">
                    Share
                </button>
            </div>
        </div>
    `;
}

// Submit blog (NO TAGS)
async function handleBlogSubmit(event) {
    event.preventDefault();

    const title = document.getElementById('blogTitle').value.trim();
    const content = document.getElementById('blogContent').value.trim();

    if (!title || !content) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        showPublishLoading(true);

        const userRes = await fetch('api/users/profile.php', {
            method: 'GET',
            credentials: 'include'
        });
        const userData = await userRes.json();
        if (!userData.success) throw new Error(userData.message);

        const blogData = {
            title,
            content,
            user_id: userData.data.user_id
        };

        const response = await fetch('api/blogs/createBlog.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(blogData)
        });

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Failed to publish blog');
        }

        // ✅ Add this line to make the notification appear
        sessionStorage.setItem('blogPublished', 'true');

        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error('❌ Error publishing blog:', error);
        alert(error.message);
    } finally {
        showPublishLoading(false);
    }
}

// Character count
function updateCharCount() {
    const titleInput = document.getElementById('blogTitle');
    const count = document.getElementById('titleCharCount');
    if (count) count.textContent = titleInput.value.length;
}

// UI helpers
function showBlogLoading(show) {
    document.getElementById('loadingBlogs').style.display = show ? 'block' : 'none';
}

function showNoBlogs() {
    const el = document.getElementById('noBlogs');
    if (el) el.style.display = 'block';
}

function hideNoBlogs() {
    const el = document.getElementById('noBlogs');
    if (el) el.style.display = 'none';
}

function showBlogError(message) {
    document.getElementById('blogsList').innerHTML = `
        <p style="color:red">Error: ${message}</p>
        <button onclick="loadBlogs()">Retry</button>
    `;
}

// Blog modal
function viewBlogDetails(blogId) {
    const blog = allBlogs.find(b => b.blog_id == blogId);
    if (!blog) return;

    document.getElementById('blogModalContent').innerHTML = `
        <h2>${blog.title}</h2>
        <p style="opacity:0.8; color:black; font-size:14px; margin-bottom:10px;">
            By ${blog.author_name || 'Unknown'} • ${formatDate(blog.created_at)}
        </p>
        <p style="line-height:1.7; color:black;">${blog.content}</p>
    `;

    document.getElementById('blogModal').style.display = 'flex';
}

function closeBlogModal() {
    document.getElementById('blogModal').style.display = 'none';
}

// Share
function shareBlog(blogId) { 
    const url = window.location.href; 
    if (navigator.share) { 
        navigator.share({ title: 'Check out this blog post', url: url }); 
    } else { 
        navigator.clipboard.writeText(url); alert('Blog link copied to clipboard!'); 

    } 
}

// Date helper
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Cancel create
function cancelBlogCreation() {
    if (confirm('Discard changes?')) {
        window.location.href = 'dashboard.html';
    }
}

function showPublishLoading(show) {
    const publishText = document.getElementById('publishText');
    const publishLoading = document.getElementById('publishLoading');
    
    if (publishText && publishLoading) {
        publishText.style.display = show ? 'none' : 'inline';
        publishLoading.style.display = show ? 'inline-block' : 'none';
    }
}

