class Auth {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check if user is logged in (from sessionStorage)
        const userData = sessionStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.updateUI();
        }
    }

    async login(email, password) {
        try {
            showLoading();
            
            const response = await fetch('api/auth/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentUser = data.data;
                sessionStorage.setItem('currentUser', JSON.stringify(data.data));
                this.updateUI();
                closeLoginModal();
                showNotification(data.message, 'success');
                window.location.href = 'dashboard.html';
                return true;
            } else {
                showNotification(data.message, 'error');
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            showNotification('Login failed. Please try again.', 'error');
            return false;
        } finally {
            hideLoading();
        }
    }

    async register(userData) {
        try {
            showLoading();
            
            const response = await fetch('api/auth/register.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification(data.message, 'success');
                closeRegisterModal();
                // Auto-login after registration
                const loginSuccess = await this.login(userData.email, userData.password);
                return loginSuccess;
            } else {
                showNotification(data.message, 'error');
                return false;
            }
        } catch (error) {
            console.error('Registration error:', error);
            showNotification('Registration failed. Please try again.', 'error');
            return false;
        } finally {
            hideLoading();
        }
    }

    logout() {
        this.currentUser = null;
        sessionStorage.removeItem('currentUser');
        this.updateUI();
        showNotification('Logged out successfully', 'success');
        
        // Call logout API if needed
        fetch('api/auth/logout.php', { method: 'POST' })
            .catch(error => console.error('Logout API error:', error));
    }

    updateUI() {
        const authButtons = document.getElementById('authButtons');
        const userMenu = document.getElementById('userMenu');
        const userName = document.getElementById('userName');
        const userRole = document.getElementById('userRole');

        if (this.currentUser) {
            if (authButtons) authButtons.style.display = 'none';
            if (userMenu) {
                userMenu.style.display = 'flex';
                if (userName) userName.textContent = this.currentUser.full_name;
                if (userRole) userRole.textContent = `(${this.currentUser.role})`;
            }
        } else {
            if (authButtons) authButtons.style.display = 'block';
            if (userMenu) userMenu.style.display = 'none';
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Check if user is organization
    isOrganization() {
        return this.currentUser && this.currentUser.role === 'organization';
    }

    // Check if user is admin
    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }
}