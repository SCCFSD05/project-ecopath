// Rider Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function () {
    // Sidebar navigation
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    const pageTitle = document.getElementById('page-title');

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            // Remove active class from all links and sections
            navLinks.forEach(l => l.classList.remove('active'));
            contentSections.forEach(s => s.classList.remove('active'));

            // Add active class to clicked link
            this.classList.add('active');

            // Show corresponding section
            const sectionId = this.getAttribute('data-section');
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');

                // Update page title
                const linkText = this.textContent.trim();
                pageTitle.textContent = linkText;
            }
        });
    });

    // Online/Offline status toggle
    const statusToggle = document.getElementById('statusToggle');
    if (statusToggle) {
        statusToggle.addEventListener('click', function () {
            const isOnline = this.classList.contains('online');

            if (isOnline) {
                this.classList.remove('online');
                this.classList.add('offline');
                this.innerHTML = '<i class="fas fa-circle"></i><span>Offline</span>';
                showNotification('You are now offline. You will not receive ride requests.', 'warning');
            } else {
                this.classList.remove('offline');
                this.classList.add('online');
                this.innerHTML = '<i class="fas fa-circle"></i><span>Online</span>';
                showNotification('You are now online. You can receive ride requests.', 'success');

                // Simulate incoming ride request after going online
                setTimeout(() => {
                    simulateRideRequest();
                }, Math.random() * 30000 + 10000); // Random between 10-40 seconds
            }
        });
    }

    // Sidebar toggle for mobile
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            sidebar.classList.toggle('active');
        });
    }

    // FAQ toggle functionality
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function () {
            const faqItem = this.parentElement;
            const isActive = faqItem.classList.contains('active');

            // Close all FAQ items
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });

            // Open clicked item if it wasn't active
            if (!isActive) {
                faqItem.classList.add('active');
            }
        });
    });

    // Filter functionality
    const filterSelects = document.querySelectorAll('.filter-select');
    filterSelects.forEach(select => {
        select.addEventListener('change', function () {
            filterRides(this.value);
        });
    });

    // Goal progress animation
    animateProgressBars();

    // Initialize earnings chart
    initializeEarningsChart();
});

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;

    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#28a745';
            break;
        case 'error':
            notification.style.backgroundColor = '#dc3545';
            break;
        case 'warning':
            notification.style.backgroundColor = '#ffc107';
            notification.style.color = '#000';
            break;
        case 'ride-request':
            notification.style.backgroundColor = '#007bff';
            break;
        default:
            notification.style.backgroundColor = '#17a2b8';
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, type === 'ride-request' ? 8000 : 3000);
}

// Simulate ride request
function simulateRideRequest() {
    const statusToggle = document.getElementById('statusToggle');
    if (!statusToggle || !statusToggle.classList.contains('online')) {
        return;
    }

    const rideRequest = {
        id: 'R' + Math.floor(Math.random() * 10000),
        pickup: 'Tech Park, Sector 5',
        destination: 'City Mall',
        distance: '8.5 km',
        fare: '₹45',
        customerName: 'Alice Johnson',
        customerRating: '4.9'
    };

    // Create ride request modal
    const modal = document.createElement('div');
    modal.className = 'ride-request-modal';
    modal.innerHTML = `
        <div class="ride-request-content">
            <h3>New Ride Request</h3>
            <div class="request-details">
                <div class="customer-info">
                    <strong>${rideRequest.customerName}</strong>
                    <span>${rideRequest.customerRating} ⭐</span>
                </div>
                <div class="route-info">
                    <div class="route-point">
                        <i class="fas fa-circle" style="color: #28a745;"></i>
                        <span>${rideRequest.pickup}</span>
                    </div>
                    <div class="route-point">
                        <i class="fas fa-map-marker-alt" style="color: #dc3545;"></i>
                        <span>${rideRequest.destination}</span>
                    </div>
                </div>
                <div class="ride-details">
                    <span>Distance: ${rideRequest.distance}</span>
                    <span>Fare: ${rideRequest.fare}</span>
                </div>
            </div>
            <div class="request-actions">
                <button class="btn btn-success" onclick="acceptRide('${rideRequest.id}')">Accept</button>
                <button class="btn btn-danger" onclick="rejectRide('${rideRequest.id}')">Reject</button>
            </div>
            <div class="request-timer">
                <span id="timer">15</span> seconds remaining
            </div>
        </div>
    `;

    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;

    document.body.appendChild(modal);

    // Timer countdown
    let timeLeft = 15;
    const timerElement = modal.querySelector('#timer');
    const countdown = setInterval(() => {
        timeLeft--;
        timerElement.textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(countdown);
            rejectRide(rideRequest.id);
        }
    }, 1000);

    // Store timer reference for cleanup
    modal.countdownTimer = countdown;

    // Play notification sound (if available)
    playNotificationSound();
}

// Accept ride function
function acceptRide(rideId) {
    const modal = document.querySelector('.ride-request-modal');
    if (modal) {
        clearInterval(modal.countdownTimer);
        document.body.removeChild(modal);
    }

    showNotification('Ride accepted! Customer has been notified.', 'success');

    // Add ride to recent rides
    addRideToHistory(rideId, 'accepted');

    // Update stats
    updateDashboardStats();
}

// Reject ride function
function rejectRide(rideId) {
    const modal = document.querySelector('.ride-request-modal');
    if (modal) {
        clearInterval(modal.countdownTimer);
        document.body.removeChild(modal);
    }

    showNotification('Ride request declined.', 'info');
}

// Add ride to history
function addRideToHistory(rideId, status) {
    const rideList = document.querySelector('.ride-list');
    if (rideList) {
        const newRide = document.createElement('div');
        newRide.className = 'ride-item';
        newRide.innerHTML = `
            <div class="ride-info">
                <div class="ride-route">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>Tech Park → City Mall</span>
                </div>
                <div class="ride-details">
                    <span class="ride-time">Just now</span>
                    <span class="ride-earning">₹45</span>
                </div>
            </div>
            <div class="ride-status ${status}">${status === 'accepted' ? 'In Progress' : 'Completed'}</div>
        `;

        rideList.insertBefore(newRide, rideList.firstChild);

        // Remove last item if more than 5 rides
        const rideItems = rideList.querySelectorAll('.ride-item');
        if (rideItems.length > 5) {
            rideList.removeChild(rideItems[rideItems.length - 1]);
        }
    }
}

// Update dashboard stats
function updateDashboardStats() {
    const totalRidesElement = document.querySelector('.stat-info h3');
    if (totalRidesElement) {
        const currentRides = parseInt(totalRidesElement.textContent);
        totalRidesElement.textContent = currentRides + 1;
    }

    const todayEarningsElement = document.querySelectorAll('.stat-info h3')[1];
    if (todayEarningsElement) {
        const currentEarnings = parseInt(todayEarningsElement.textContent.replace(/[^0-9]/g, ''));
        todayEarningsElement.textContent = `₹${currentEarnings + 45}`;
    }
}

// Filter rides
function filterRides(filterValue) {
    const rideRows = document.querySelectorAll('.data-table tbody tr');

    rideRows.forEach(row => {
        const status = row.querySelector('.status').textContent.toLowerCase();

        if (filterValue === 'All Rides' || filterValue === '' || status.includes(filterValue.toLowerCase())) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Animate progress bars
function animateProgressBars() {
    const progressBars = document.querySelectorAll('.progress-fill');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progressBar = entry.target;
                const width = progressBar.style.width;
                progressBar.style.width = '0%';

                setTimeout(() => {
                    progressBar.style.width = width;
                }, 500);
            }
        });
    });

    progressBars.forEach(bar => {
        observer.observe(bar);
    });
}

// Initialize earnings chart
function initializeEarningsChart() {
    const chartPlaceholder = document.querySelector('.earnings-chart .chart-placeholder');
    if (chartPlaceholder) {
        chartPlaceholder.addEventListener('click', function () {
            showNotification('Detailed earnings chart would be displayed here', 'info');
        });
    }
}

// Play notification sound
function playNotificationSound() {
    // Create audio context for notification sound
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('Audio notification not available');
    }
}

// Vehicle maintenance reminders
function checkMaintenanceReminders() {
    const maintenanceItems = document.querySelectorAll('.maintenance-status.due');
    if (maintenanceItems.length > 0) {
        showNotification(`You have ${maintenanceItems.length} maintenance item(s) due`, 'warning');
    }
}

// Initialize maintenance check
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(checkMaintenanceReminders, 3000);
});

// Earnings request
function requestPayout() {
    const availableBalance = document.querySelector('.earning-amount');
    if (availableBalance) {
        const amount = availableBalance.textContent;
        if (confirm(`Request payout of ${amount}?`)) {
            showNotification('Payout request submitted successfully!', 'success');
        }
    }
}

// Support functions
function startChat() {
    showNotification('Connecting to support chat...', 'info');
    setTimeout(() => {
        showNotification('Connected to support agent', 'success');
    }, 2000);
}

function callSupport() {
    if (confirm('Call support at +91 1800-123-4567?')) {
        showNotification('Initiating call to support...', 'info');
    }
}

// Real-time location simulation
function simulateLocationUpdates() {
    if (document.getElementById('statusToggle')?.classList.contains('online')) {
        // Simulate location updates every 30 seconds when online
        setTimeout(() => {
            console.log('Location updated');
            simulateLocationUpdates();
        }, 30000);
    }
}

// Start location updates when going online
document.addEventListener('DOMContentLoaded', function () {
    const statusToggle = document.getElementById('statusToggle');
    if (statusToggle?.classList.contains('online')) {
        simulateLocationUpdates();
    }
});