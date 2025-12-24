// Volunteer App Class
class VolunteerApp {
    constructor() {
        this.opportunities = [];
        this.init();
    }

    init() {
        this.loadOpportunities();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Mobile menu toggle
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('navMenu');
        
        if (hamburger) {
            hamburger.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }

        // Smooth scrolling for navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                    if (navMenu) navMenu.classList.remove('active');
                }
            });
        });
    }

    async loadOpportunities() {
        try {
            showLoading();
            
            // Use actual API call
            this.opportunities = await this.getOpportunities();
            this.displayOpportunities(this.opportunities);
        } catch (error) {
            console.error('Error loading opportunities:', error);
            showNotification('Failed to load opportunities', 'error');
        } finally {
            hideLoading();
        }
    }

    async getOpportunities() {
        try {
            const response = await fetch('api/opportunities/get_opportunities.php');
            const data = await response.json();
            
            if (data.success) {
                return data.data;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error fetching opportunities:', error);
            // Return fallback mock data if API fails
            return await this.getFallbackOpportunities();
        }
    }

    displayOpportunities(opportunities) {
        const container = document.getElementById('opportunitiesList');
        if (!container) return;
        
        if (opportunities.length === 0) {
            container.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; color: #7f8c8d; font-size: 1.2rem;">No opportunities found matching your criteria.</p>';
            return;
        }

        container.innerHTML = opportunities.map(opp => `
            <div class="opportunity-card" data-category="${opp.category}" data-location="${opp.location}">
                <div class="category-badge">${this.getCategoryLabel(opp.category)}</div>
                <h3>${opp.title}</h3>
                <p>${opp.description}</p>
                <div class="opportunity-meta">
                    <div class="meta-item">
                        <span>📍 ${opp.location === 'remote' ? 'Remote' : 'On-site'}</span>
                    </div>
                    <div class="meta-item">
                        <span>⏱ ${opp.duration}</span>
                    </div>
                    <div class="meta-item">
                        <span>👥 ${opp.volunteersNeeded} needed</span>
                    </div>
                </div>
                <button class="btn-apply" onclick="app.applyToOpportunity(${opp.id})" ${!auth.currentUser ? 'disabled' : ''}>
                    ${!auth.currentUser ? 'Login to Apply' : 'Apply Now'}
                </button>
            </div>
        `).join('');
    }

    getCategoryLabel(category) {
        const labels = {
            'education': 'Education',
            'environment': 'Environment',
            'healthcare': 'Healthcare',
            'community': 'Community'
        };
        return labels[category] || category;
    }

    filterOpportunities() {
        const categoryFilter = document.getElementById('categoryFilter')?.value || '';
        const locationFilter = document.getElementById('locationFilter')?.value || '';
        
        let filtered = this.opportunities;
        
        if (categoryFilter) {
            filtered = filtered.filter(opp => opp.category === categoryFilter);
        }
        
        if (locationFilter) {
            filtered = filtered.filter(opp => opp.location === locationFilter);
        }
        
        this.displayOpportunities(filtered);
    }

    async applyToOpportunity(opportunityId) {
        if (!auth.currentUser) {
            showNotification('Please login to apply for opportunities', 'error');
            showLoginModal();
            return;
        }

        try {
            showLoading();
            
            const response = await fetch('api/opportunities/apply.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    opportunityId: opportunityId,
                    userId: auth.currentUser.id
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification(data.message, 'success');
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            showNotification('Application failed. Please try again.', 'error');
        } finally {
            hideLoading();
        }
    }

    // Fallback mock data method (used when API fails)
    async getFallbackOpportunities() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return [
            {
                id: 1,
                title: 'Community Garden Volunteer',
                description: 'Help maintain our community garden and teach visitors about sustainable gardening practices. Perfect for nature lovers!',
                category: 'environment',
                location: 'onsite',
                duration: '4 hours/week',
                volunteersNeeded: 5
            },
            {
                id: 2,
                title: 'Online Tutoring for Kids',
                description: 'Provide online tutoring sessions for underprivileged children in math and science. Make a difference from home!',
                category: 'education',
                location: 'remote',
                duration: '2 hours/week',
                volunteersNeeded: 10
            },
            {
                id: 3,
                title: 'Food Bank Assistant',
                description: 'Help sort and distribute food items at our local food bank. Your help ensures families get the nutrition they need.',
                category: 'community',
                location: 'onsite',
                duration: '3 hours/week',
                volunteersNeeded: 8
            },
            {
                id: 4,
                title: 'Hospital Companion',
                description: 'Provide companionship and support to patients in local hospitals. Bring comfort to those in need.',
                category: 'healthcare',
                location: 'onsite',
                duration: '4 hours/week',
                volunteersNeeded: 6
            },
            {
                id: 5,
                title: 'Virtual Fundraising Coordinator',
                description: 'Help organize and coordinate online fundraising events for our charity. Use your skills for a great cause!',
                category: 'community',
                location: 'remote',
                duration: '3 hours/week',
                volunteersNeeded: 3
            },
            {
                id: 6,
                title: 'Environmental Awareness Campaign',
                description: 'Join our team to spread awareness about environmental conservation through social media and community events.',
                category: 'environment',
                location: 'remote',
                duration: '2 hours/week',
                volunteersNeeded: 15
            }
        ];
    }
}