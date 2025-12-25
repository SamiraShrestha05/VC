// Global variables
let allBlogs = [];
let currentPage = 1;
let hasMoreBlogs = true;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Blogs script loaded');
    loadBlogs();
    setupEventListeners();
    testBlogSystem();
});

function setupEventListeners() {
    // Character count for title
    const titleInput = document.getElementById('blogTitle');
    if (titleInput) {
        titleInput.addEventListener('input', updateCharCount);
    }
    
    // Blog form submission
    const blogForm = document.getElementById('createBlogForm');
    if (blogForm) {
        blogForm.addEventListener('submit', handleBlogSubmit);
    }
}

// Load blogs from database
async function loadBlogs() {
    try {
        showBlogLoading(true);
        console.log('🔄 Loading blogs...');
        
        const response = await fetch('api/blogs/showBlogs.php');
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📊 API response:', result);
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to load blogs');
        }
        
        allBlogs = result.data || [];
        console.log(`📝 Loaded ${allBlogs.length} blogs`);
        
        displayBlogs();
        updateStats(); // Add this line
        
    } catch (error) {
        console.error('❌ Error loading blogs:', error);
        showBlogError('Failed to load blogs: ' + error.message);
    } finally {
        showBlogLoading(false);
    }
}

// Display blogs in the container
function displayBlogs() {
    const container = document.getElementById('blogsList');
    const noBlogs = document.getElementById('noBlogs');
    
    console.log('🎨 Displaying blogs:', allBlogs.length);
    
    if (allBlogs.length === 0) {
        container.innerHTML = '';
        showNoBlogs();
        return;
    }
    
    hideNoBlogs();
    
    const blogsHTML = allBlogs.map(blog => createBlogCard(blog)).join('');
    container.innerHTML = blogsHTML;
}

// Create blog card HTML
function createBlogCard(blog) {
    const excerpt = blog.content.length > 150 ? 
        blog.content.substring(0, 150) + '...' : blog.content;
    
    const date = new Date(blog.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    return `
        <div class="blog-card" data-blog-id="${blog.blog_id}">
            <div class="blog-header">
                <h3 class="blog-title">${blog.title}</h3>
                <div class="blog-meta">
                    <span class="author">By ${blog.author_name || 'Unknown'}</span>
                    <span class="date">${date}</span>
                </div>
            </div>
            
            <div class="blog-content">
                <p class="blog-excerpt">${excerpt}</p>
            </div>
            
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

// Update statistics
function updateStats() {
    document.getElementById('totalBlogs').textContent = allBlogs.length;
    document.getElementById('totalComments').textContent = allBlogs.reduce((sum, blog) => sum + (blog.comment_count || 0), 0);
    document.getElementById('yourPosts').textContent = allBlogs.filter(blog => blog.author_id === 1).length;
}

// Handle blog form submission
async function handleBlogSubmit(event) {
    event.preventDefault();

    const title = document.getElementById('blogTitle').value.trim();
    const content = document.getElementById('blogContent').value.trim();
    const tags = document.getElementById('blogTags').value.trim();

    if (!title || !content) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        showPublishLoading(true);

        // Fetch current user from profile.php
        const userRes = await fetch('api/users/profile.php', {
            method: 'GET',
            credentials: 'include' // only needed if your auth relies on cookies
        });
        const userData = await userRes.json();
        if (!userData.success) throw new Error(userData.message);

        const user_id = userData.data.user_id;

        // Prepare blog data with user_id
        const blogData = { title, content, tags, user_id };

        const response = await fetch('api/blogs/createBlog.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(blogData)
        });

        const result = await response.json();
        if (result.success) {
            sessionStorage.setItem('blogPublished', 'true');
            window.location.href = 'dashboard.html';
        } else {
            throw new Error(result.message || 'Failed to publish blog');
        }

    } catch (error) {
        console.error('❌ Error creating blog:', error);
        alert('❌ Failed to publish blog: ' + error.message);
    } finally {
        showPublishLoading(false);
    }
}


// Clear blog form
function clearBlogForm() {
    document.getElementById('createBlogForm').reset();
    document.getElementById('titleCharCount').textContent = '0';
}

// Update character count
function updateCharCount() {
    const titleInput = document.getElementById('blogTitle');
    const charCount = document.getElementById('titleCharCount');
    if (titleInput && charCount) {
        charCount.textContent = titleInput.value.length;
    }
}

// Text formatting
function formatText(type) {
    const textarea = document.getElementById('blogContent');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let formattedText = '';
    switch (type) {
        case 'bold':
            formattedText = `**${selectedText}**`;
            break;
        case 'italic':
            formattedText = `*${selectedText}*`;
            break;
        case 'underline':
            formattedText = `__${selectedText}__`;
            break;
    }
    
    textarea.value = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    textarea.focus();
}

// UI helper functions
function showBlogLoading(show) {
    const loading = document.getElementById('loadingBlogs');
    const container = document.getElementById('blogsList');
    
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
    if (container) {
        container.style.display = show ? 'none' : 'block';
    }
}

function showNoBlogs() {
    const noBlogs = document.getElementById('noBlogs');
    if (noBlogs) {
        noBlogs.style.display = 'block';
    }
}

function hideNoBlogs() {
    const noBlogs = document.getElementById('noBlogs');
    if (noBlogs) {
        noBlogs.style.display = 'none';
    }
}

function showBlogError(message) {
    const container = document.getElementById('blogsList');
    container.innerHTML = `
        <div class="error-message">
            <h3>Error Loading Blogs</h3>
            <p>${message}</p>
            <button class="btn-primary" onclick="loadBlogs()">Try Again</button>
        </div>
    `;
}

function showPublishLoading(show) {
    const publishText = document.getElementById('publishText');
    const publishLoading = document.getElementById('publishLoading');
    
    if (publishText && publishLoading) {
        publishText.style.display = show ? 'none' : 'inline';
        publishLoading.style.display = show ? 'inline-block' : 'none';
    }
}

// Test function
async function testBlogSystem() {
    console.log('🧪 Testing blog system...');
    
    try {
        const response = await fetch('api/blogs/showBlogs.php');
        const result = await response.json();
        console.log('🔍 Blog API test:', result);
    } catch (error) {
        console.error('❌ Blog API test failed:', error);
    }
}

// Navigation functions
function scrollToCreateSection() {
    document.getElementById('createBlogSection').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

function refreshBlogs() {
    loadBlogs();
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}

// Placeholder functions
// ================= BLOG MODAL =================

function viewBlogDetails(blogId) {
    // ✅ FIX: use allBlogs
    const blog = allBlogs.find(b => b.blog_id == blogId);
    if (!blog) {
        console.error("❌ Blog not found:", blogId);
        return;
    }

    const modal = document.getElementById('blogModal');
    const content = document.getElementById('blogModalContent');

    content.innerHTML = `
        <h2>${blog.title}</h2>

        <p style="opacity:0.8; font-size:14px; margin-bottom:10px;">
            <strong>By:</strong> ${blog.author_name || 'Unknown'} |
            <strong>Date:</strong> ${formatDate(blog.created_at)}
        </p>

        <p style="line-height:1.7;">${blog.content}</p>
    `;

    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
}

function closeBlogModal() {
    const modal = document.getElementById('blogModal');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
}

// ✅ Safe click-outside-to-close
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('blogModal');
    if (!modal) return;

    modal.addEventListener('click', (e) => {
        const wrapper = document.getElementById('blogModalContentWrapper');
        if (!wrapper.contains(e.target)) {
            closeBlogModal();
        }
    });
});

// ================= HELPERS =================

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}


function shareBlog(blogId) {
    const url = window.location.href;
    if (navigator.share) {
        navigator.share({
            title: 'Check out this blog post',
            url: url
        });
    } else {
        navigator.clipboard.writeText(url);
        alert('Blog link copied to clipboard!');
    }
}

function sortBlogs() {
    const sortBy = document.getElementById('sortBy').value;
    console.log('Sort by:', sortBy);
}

function loadMoreBlogs() {
    console.log('Load more blogs');
}

function closeBlogModal() {
    document.getElementById('blogModal').style.display = 'none';
}

  // Cancel function
        function cancelBlogCreation() {
            if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
                window.location.href = 'dashboard.html'; // or wherever you want to redirect
            }
        }

