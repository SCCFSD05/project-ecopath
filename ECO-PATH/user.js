// User Dashboard JavaScript

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

    // Sidebar toggle for mobile
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            sidebar.classList.toggle('active');
        });
    }

    // Vehicle selection
    const vehicleOptions = document.querySelectorAll('.vehicle-option');
    vehicleOptions.forEach(option => {
        option.addEventListener('click', function () {
            vehicleOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            updateBookingPrice();
        });
    });

    // Booking form submission
    const bookingForm = document.querySelector('.booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', function (e) {
            e.preventDefault();
            processBooking();
        });
    }

    // Location inputs
    const pickupInput = document.getElementById('pickup');
    const destinationInput = document.getElementById('destination');

    if (pickupInput && destinationInput) {
        pickupInput.addEventListener('input', updateBookingPrice);
        destinationInput.addEventListener('input', updateBookingPrice);
    }

    // Booking type radio buttons
    const bookingTypeRadios = document.querySelectorAll('input[name="booking-type"]');
    const scheduleTimeDiv = document.querySelector('.schedule-time');

    bookingTypeRadios.forEach(radio => {
        radio.addEventListener('change', function () {
            if (this.value === 'later') {
                scheduleTimeDiv.style.display = 'block';
            } else {
                scheduleTimeDiv.style.display = 'none';
            }
        });
    });

    // Initialize wallet balance animation
    animateWalletBalance();

    // Initialize favorite places
    initializeFavorites();
});

// Show section function
function showSection(sectionId) {
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    const pageTitle = document.getElementById('page-title');

    // Remove active class from all
    navLinks.forEach(l => l.classList.remove('active'));
    contentSections.forEach(s => s.classList.remove('active'));

    // Activate target section
    const targetSection = document.getElementById(sectionId);
    const targetNavLink = document.querySelector(`[data-section="${sectionId}"]`);

    if (targetSection && targetNavLink) {
        targetSection.classList.add('active');
        targetNavLink.classList.add('active');
        pageTitle.textContent = targetNavLink.textContent.trim();
    }
}

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
    }, 3000);
}

// Get current location
function getCurrentLocation(inputId) {
    if (navigator.geolocation) {
        showNotification('Getting your location...', 'info');

        navigator.geolocation.getCurrentPosition(
            function (position) {
                // Simulate reverse geocoding
                const locations = [
                    '123 Green Street, Eco City',
                    'Tech Park, Sector 5',
                    'City Mall, Downtown',
                    'Central Station, Platform 1'
                ];

                const randomLocation = locations[Math.floor(Math.random() * locations.length)];
                document.getElementById(inputId).value = randomLocation;
                showNotification('Location found!', 'success');
                updateBookingPrice();
            },
            function (error) {
                showNotification('Unable to get location. Please enter manually.', 'error');
            }
        );
    } else {
        showNotification('Geolocation is not supported by this browser.', 'error');
    }
}

// Update booking price
function updateBookingPrice() {
    const activeVehicle = document.querySelector('.vehicle-option.active');
    const pickup = document.getElementById('pickup')?.value;
    const destination = document.getElementById('destination')?.value;

    if (activeVehicle && pickup && destination) {
        // Simulate distance calculation
        const distance = Math.floor(Math.random() * 15) + 3; // 3-18 km
        const vehicleType = activeVehicle.getAttribute('data-type');
        const ratePerKm = vehicleType === 'cycle' ? 5 : 12;
        const totalPrice = distance * ratePerKm;

        // Update price in the vehicle option
        const priceElement = activeVehicle.querySelector('.vehicle-price');
        if (priceElement) {
            priceElement.textContent = `₹${totalPrice}`;
        }

        // Update vehicle info
        const infoElement = activeVehicle.querySelector('.vehicle-info p');
        if (infoElement) {
            infoElement.innerHTML = `${distance} km • ₹${ratePerKm}/km`;
        }
    }
}

// Process booking
function processBooking() {
    const pickup = document.getElementById('pickup').value;
    const destination = document.getElementById('destination').value;
    const activeVehicle = document.querySelector('.vehicle-option.active');
    const bookingType = document.querySelector('input[name="booking-type"]:checked').value;

    if (!pickup || !destination) {
        showNotification('Please enter pickup and destination locations', 'error');
        return;
    }

    if (!activeVehicle) {
        showNotification('Please select a vehicle type', 'error');
        return;
    }

    // Show booking confirmation
    const vehicleType = activeVehicle.querySelector('h4').textContent;
    const price = activeVehicle.querySelector('.vehicle-price').textContent;

    if (confirm(`Confirm booking:\n${vehicleType}\nFrom: ${pickup}\nTo: ${destination}\nFare: ${price}`)) {
        showBookingProgress();
    }
}

// Show booking progress
function showBookingProgress() {
    const modal = document.createElement('div');
    modal.className = 'booking-progress-modal';
    modal.innerHTML = `
        <div class="booking-progress-content">
            <h3>Finding your ride...</h3>
            <div class="progress-steps">
                <div class="step active">
                    <i class="fas fa-search"></i>
                    <span>Searching for riders</span>
                </div>
                <div class="step">
                    <i class="fas fa-user-check"></i>
                    <span>Rider assigned</span>
                </div>
                <div class="step">
                    <i class="fas fa-route"></i>
                    <span>Rider on the way</span>
                </div>
            </div>
            <div class="estimated-time">
                <p>Estimated arrival: <strong>5-8 minutes</strong></p>
            </div>
            <button class="btn btn-danger" onclick="cancelBooking()">Cancel Booking</button>
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

    // Simulate booking progress
    setTimeout(() => {
        const steps = modal.querySelectorAll('.step');
        steps[1].classList.add('active');
        modal.querySelector('h3').textContent = 'Rider assigned!';
    }, 3000);

    setTimeout(() => {
        const steps = modal.querySelectorAll('.step');
        steps[2].classList.add('active');
        modal.querySelector('h3').textContent = 'Rider is on the way';

        // Show rider details
        const riderInfo = document.createElement('div');
        riderInfo.className = 'rider-info';
        riderInfo.innerHTML = `
            <div class="rider-details">
                <img src="/placeholder.svg?height=50&width=50" alt="Rider">
                <div>
                    <h4>John Doe</h4>
                    <p>4.8 ⭐ • Cycle Rider</p>
                    <p>Phone: +91 9876543210</p>
                </div>
            </div>
        `;

        modal.querySelector('.booking-progress-content').insertBefore(
            riderInfo,
            modal.querySelector('.estimated-time')
        );
    }, 6000);

    setTimeout(() => {
        document.body.removeChild(modal);
        showNotification('Ride completed successfully!', 'success');
        addRideToHistory();
        updateUserStats();
    }, 12000);
}

// Cancel booking
function cancelBooking() {
    const modal = document.querySelector('.booking-progress-modal');
    if (modal) {
        document.body.removeChild(modal);
        showNotification('Booking cancelled', 'info');
    }
}

// Add ride to history
function addRideToHistory() {
    const pickup = document.getElementById('pickup').value;
    const destination = document.getElementById('destination').value;
    const activeVehicle = document.querySelector('.vehicle-option.active');
    const price = activeVehicle.querySelector('.vehicle-price').textContent;

    const rideList = document.querySelector('.ride-list');
    if (rideList) {
        const newRide = document.createElement('div');
        newRide.className = 'ride-item';
        newRide.innerHTML = `
            <div class="ride-info">
                <div class="ride-route">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${pickup.split(',')[0]} → ${destination.split(',')[0]}</span>
                </div>
                <div class="ride-details">
                    <span class="ride-time">Just now</span>
                    <span class="ride-cost">${price}</span>
                </div>
            </div>
            <div class="ride-type">
                <i class="fas fa-${activeVehicle.getAttribute('data-type') === 'cycle' ? 'bicycle' : 'bolt'}"></i>
            </div>
        `;

        rideList.insertBefore(newRide, rideList.firstChild);

        // Keep only last 5 rides
        const rideItems = rideList.querySelectorAll('.ride-item');
        if (rideItems.length > 5) {
            rideList.removeChild(rideItems[rideItems.length - 1]);
        }
    }
}

// Update user stats
function updateUserStats() {
    const totalRidesElement = document.querySelector('.stat-info h3');
    if (totalRidesElement) {
        const currentRides = parseInt(totalRidesElement.textContent);
        totalRidesElement.textContent = currentRides + 1;
    }

    const totalSpentElement = document.querySelectorAll('.stat-info h3')[2];
    if (totalSpentElement) {
        const activeVehicle = document.querySelector('.vehicle-option.active');
        const price = parseInt(activeVehicle.querySelector('.vehicle-price').textContent.replace(/[^0-9]/g, ''));
        const currentSpent = parseInt(totalSpentElement.textContent.replace(/[^0-9]/g, ''));
        totalSpentElement.textContent = `₹${(currentSpent + price).toLocaleString()}`;
    }
}

// Repeat last ride
function repeatLastRide() {
    const lastRide = document.querySelector('.ride-item');
    if (lastRide) {
        const routeText = lastRide.querySelector('.ride-route span').textContent;
        const [pickup, destination] = routeText.split(' → ');

        // Switch to book ride section and populate fields
        showSection('book-ride');

        setTimeout(() => {
            document.getElementById('pickup').value = pickup + ', Eco City';
            document.getElementById('destination').value = destination + ', Eco City';
            updateBookingPrice();
        }, 500);

        showNotification('Last ride details loaded', 'success');
    } else {
        showNotification('No previous rides found', 'info');
    }
}

// Wallet functions
function addMoneyToWallet() {
    const amount = prompt('Enter amount to add (₹):');
    if (amount && !isNaN(amount) && amount > 0) {
        const currentBalance = parseInt(document.querySelector('.balance-amount').textContent.replace(/[^0-9]/g, ''));
        const newBalance = currentBalance + parseInt(amount);

        document.querySelector('.balance-amount').textContent = `₹${newBalance}`;
        showNotification(`₹${amount} added to wallet successfully!`, 'success');

        // Add transaction to history
        addTransaction('Wallet Top-up', `+₹${amount}`, 'credit');
    }
}

// Add transaction to history
function addTransaction(type, amount, transactionType) {
    const transactionList = document.querySelector('.transaction-list');
    if (transactionList) {
        const newTransaction = document.createElement('div');
        newTransaction.className = 'transaction-item';
        newTransaction.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-type">
                    <i class="fas fa-${transactionType === 'credit' ? 'plus' : 'minus'}-circle ${transactionType}"></i>
                    <span>${type}</span>
                </div>
                <div class="transaction-date">Just now</div>
            </div>
            <div class="transaction-amount ${transactionType}">${amount}</div>
        `;

        transactionList.insertBefore(newTransaction, transactionList.firstChild);

        // Keep only last 10 transactions
        const transactions = transactionList.querySelectorAll('.transaction-item');
        if (transactions.length > 10) {
            transactionList.removeChild(transactions[transactions.length - 1]);
        }
    }
}

// Animate wallet balance
function animateWalletBalance() {
    const balanceElement = document.querySelector('.balance-amount');
    if (balanceElement) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = parseInt(entry.target.textContent.replace(/[^0-9]/g, ''));
                    animateNumber(entry.target, 0, target, 1500);
                }
            });
        });

        observer.observe(balanceElement);
    }
}

// Animate number
function animateNumber(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = `₹${Math.floor(current)}`;
    }, 16);
}

// Initialize favorites
function initializeFavorites() {
    const favoriteCards = document.querySelectorAll('.favorite-card');
    favoriteCards.forEach(card => {
        const bookRideBtn = card.querySelector('.btn-primary');
        if (bookRideBtn) {
            bookRideBtn.addEventListener('click', function () {
                const address = card.querySelector('p').textContent;
                showSection('book-ride');

                setTimeout(() => {
                    document.getElementById('destination').value = address;
                    updateBookingPrice();
                }, 500);

                showNotification('Favorite location set as destination', 'success');
            });
        }
    });
}

// Support functions
function startSupportChat() {
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

// Quick action functions
document.addEventListener('DOMContentLoaded', function () {
    // Wallet action buttons
    const walletActionBtns = document.querySelectorAll('.wallet-action-btn');
    walletActionBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const action = this.querySelector('span').textContent;

            switch (action) {
                case 'Add Money':
                    addMoneyToWallet();
                    break;
                case 'Redeem Coupon':
                    redeemCoupon();
                    break;
                case 'Transaction History':
                    showSection('wallet');
                    break;
            }
        });
    });
});

// Redeem coupon
function redeemCoupon() {
    const couponCode = prompt('Enter coupon code:');
    if (couponCode) {
        // Simulate coupon validation
        const validCoupons = ['SAVE10', 'NEWUSER', 'RIDE50'];

        if (validCoupons.includes(couponCode.toUpperCase())) {
            const discount = couponCode.toUpperCase() === 'SAVE10' ? 10 :
                couponCode.toUpperCase() === 'NEWUSER' ? 25 : 50;

            showNotification(`Coupon applied! You saved ₹${discount}`, 'success');
            addTransaction('Coupon Discount', `+₹${discount}`, 'credit');
        } else {
            showNotification('Invalid coupon code', 'error');
        }
    }
}

// Rating system for completed rides
function rateRide(rideId, rating) {
    showNotification(`Thank you for rating your ride ${rating} stars!`, 'success');

    // Update user rating
    const userRating = document.querySelector('.profile-rating span');
    if (userRating) {
        const currentRating = parseFloat(userRating.textContent);
        const newRating = ((currentRating * 44 + rating) / 45).toFixed(1); // Assuming 45 total rides
        userRating.textContent = `${newRating} ⭐`;
    }
}

// Emergency contact
function emergencyContact() {
    if (confirm('This will immediately contact emergency services and share your location. Continue?')) {
        showNotification('Emergency services contacted. Help is on the way.', 'error');
        // In a real app, this would contact emergency services
    }
}