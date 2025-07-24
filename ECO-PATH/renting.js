// Renting Dashboard JavaScript

document.addEventListener("DOMContentLoaded", () => {
    // Sidebar navigation
    const navLinks = document.querySelectorAll(".nav-link")
    const contentSections = document.querySelectorAll(".content-section")
    const pageTitle = document.getElementById("page-title")

    navLinks.forEach((link) => {
        link.addEventListener("click", function (e) {
            e.preventDefault()

            // Remove active class from all links and sections
            navLinks.forEach((l) => l.classList.remove("active"))
            contentSections.forEach((s) => s.classList.remove("active"))

            // Add active class to clicked link
            this.classList.add("active")

            // Show corresponding section
            const sectionId = this.getAttribute("data-section")
            const targetSection = document.getElementById(sectionId)
            if (targetSection) {
                targetSection.classList.add("active")

                // Update page title
                const linkText = this.textContent.trim()
                pageTitle.textContent = linkText
            }
        })
    })

    // Sidebar toggle for mobile
    const sidebarToggle = document.querySelector(".sidebar-toggle")
    const sidebar = document.querySelector(".sidebar")

    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", () => {
            sidebar.classList.toggle("active")
        })
    }

    // Add vehicle form submission
    const addVehicleForm = document.querySelector(".add-vehicle-form")
    if (addVehicleForm) {
        addVehicleForm.addEventListener("submit", (e) => {
            e.preventDefault()
            processVehicleAddition()
        })
    }

    // Photo upload functionality
    const uploadArea = document.querySelector(".upload-area")
    const fileInput = uploadArea?.querySelector('input[type="file"]')

    if (uploadArea && fileInput) {
        uploadArea.addEventListener("click", () => fileInput.click())

        uploadArea.addEventListener("dragover", function (e) {
            e.preventDefault()
            this.style.backgroundColor = "rgba(44, 85, 48, 0.1)"
        })

        uploadArea.addEventListener("dragleave", function (e) {
            e.preventDefault()
            this.style.backgroundColor = ""
        })

        uploadArea.addEventListener("drop", function (e) {
            e.preventDefault()
            this.style.backgroundColor = ""
            const files = e.dataTransfer.files
            handleFileUpload(files)
        })

        fileInput.addEventListener("change", function () {
            handleFileUpload(this.files)
        })
    }

    // Filter functionality
    const filterSelects = document.querySelectorAll(".filter-select")
    filterSelects.forEach((select) => {
        select.addEventListener("change", function () {
            filterBookings(this.value)
        })
    })

    // Initialize performance bars animation
    animatePerformanceBars()

    // Initialize maintenance alerts
    checkMaintenanceAlerts()

    // Initialize earnings animation
    animateEarningsCards()
})

// Show section function
function showSection(sectionId) {
    const navLinks = document.querySelectorAll(".nav-link")
    const contentSections = document.querySelectorAll(".content-section")
    const pageTitle = document.getElementById("page-title")

    // Remove active class from all
    navLinks.forEach((l) => l.classList.remove("active"))
    contentSections.forEach((s) => s.classList.remove("active"))

    // Activate target section
    const targetSection = document.getElementById(sectionId)
    const targetNavLink = document.querySelector(`[data-section="${sectionId}"]`)

    if (targetSection && targetNavLink) {
        targetSection.classList.add("active")
        targetNavLink.classList.add("active")
        pageTitle.textContent = targetNavLink.textContent.trim()
    }
}

// Notification system
function showNotification(message, type = "info") {
    const notification = document.createElement("div")
    notification.className = `notification notification-${type}`
    notification.textContent = message

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
    `

    switch (type) {
        case "success":
            notification.style.backgroundColor = "#28a745"
            break
        case "error":
            notification.style.backgroundColor = "#dc3545"
            break
        case "warning":
            notification.style.backgroundColor = "#ffc107"
            notification.style.color = "#000"
            break
        default:
            notification.style.backgroundColor = "#17a2b8"
    }

    document.body.appendChild(notification)

    setTimeout(() => {
        notification.style.transform = "translateX(0)"
    }, 100)

    setTimeout(() => {
        notification.style.transform = "translateX(100%)"
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification)
            }
        }, 300)
    }, 3000)
}

// Process vehicle addition
function processVehicleAddition() {
    const formData = new FormData(document.querySelector(".add-vehicle-form"))
    const vehicleData = {}

    for (const [key, value] of formData.entries()) {
        vehicleData[key] = value
    }

    // Validate required fields
    const requiredFields = ["vehicle-type", "brand", "model", "year", "daily-rate", "security-deposit", "pickup-location"]
    const missingFields = requiredFields.filter((field) => !vehicleData[field])

    if (missingFields.length > 0) {
        showNotification("Please fill in all required fields", "error")
        return
    }

    // Simulate API call
    showNotification("Adding vehicle...", "info")

    setTimeout(() => {
        showNotification("Vehicle added successfully!", "success")
        addVehicleToList(vehicleData)
        document.querySelector(".add-vehicle-form").reset()
        showSection("my-vehicles")
    }, 2000)
}

// Add vehicle to list
function addVehicleToList(vehicleData) {
    const vehiclesGrid = document.querySelector(".vehicles-grid")
    if (vehiclesGrid) {
        const newVehicleCard = document.createElement("div")
        newVehicleCard.className = "vehicle-card"
        newVehicleCard.innerHTML = `
            <div class="vehicle-image">
                <i class="fas fa-${vehicleData["vehicle-type"] === "cycle" ? "bicycle" : "bolt"}"></i>
            </div>
            <div class="vehicle-info">
                <h3>${vehicleData.brand} ${vehicleData.model}</h3>
                <p>${vehicleData.year}</p>
                <div class="vehicle-stats">
                    <div class="stat">
                        <span class="stat-label">Status:</span>
                        <span class="status active">Available</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Rate:</span>
                        <span>₹${vehicleData["daily-rate"]}/day</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Rating:</span>
                        <span>New</span>
                    </div>
                </div>
            </div>
            <div class="vehicle-actions">
                <button class="btn btn-secondary btn-sm">Edit</button>
                <button class="btn btn-secondary btn-sm">View Details</button>
                <button class="btn btn-danger btn-sm">Remove</button>
            </div>
        `

        vehiclesGrid.appendChild(newVehicleCard)

        // Update stats
        updateVehicleStats()
    }
}

// Handle file upload
function handleFileUpload(files) {
    const uploadArea = document.querySelector(".upload-area")
    const fileList = Array.from(files)

    if (fileList.length > 0) {
        uploadArea.innerHTML = `
            <i class="fas fa-check-circle" style="color: #28a745;"></i>
            <p>${fileList.length} file(s) selected</p>
            <small>${fileList.map((f) => f.name).join(", ")}</small>
        `

        showNotification(`${fileList.length} photo(s) selected`, "success")
    }
}

// Filter bookings
function filterBookings(filterValue) {
    const bookingRows = document.querySelectorAll(".data-table tbody tr")

    bookingRows.forEach((row) => {
        const status = row.querySelector(".status")?.textContent.toLowerCase() || ""

        if (filterValue === "All Bookings" || filterValue === "" || status.includes(filterValue.toLowerCase())) {
            row.style.display = ""
        } else {
            row.style.display = "none"
        }
    })
}

// Animate performance bars
function animatePerformanceBars() {
    const performanceBars = document.querySelectorAll(".performance-fill")

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const bar = entry.target
                const width = bar.style.width
                bar.style.width = "0%"

                setTimeout(() => {
                    bar.style.width = width
                }, 500)
            }
        })
    })

    performanceBars.forEach((bar) => {
        observer.observe(bar)
    })
}

// Check maintenance alerts
function checkMaintenanceAlerts() {
    const urgentItems = document.querySelectorAll(".maintenance-card.urgent .maintenance-item")
    if (urgentItems.length > 0) {
        setTimeout(() => {
            showNotification(`You have ${urgentItems.length} urgent maintenance item(s)`, "warning")
        }, 2000)
    }
}

// Animate earnings cards
function animateEarningsCards() {
    const earningAmounts = document.querySelectorAll(".earning-amount")

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const element = entry.target
                const target = Number.parseInt(element.textContent.replace(/[^0-9]/g, ""))
                animateNumber(element, 0, target, 2000)
            }
        })
    })

    earningAmounts.forEach((amount) => {
        observer.observe(amount)
    })
}

// Animate number
function animateNumber(element, start, end, duration) {
    const range = end - start
    const increment = range / (duration / 16)
    let current = start

    const timer = setInterval(() => {
        current += increment
        if (current >= end) {
            current = end
            clearInterval(timer)
        }
        element.textContent = `₹${Math.floor(current).toLocaleString()}`
    }, 16)
}

// Update vehicle stats
function updateVehicleStats() {
    const totalVehiclesElement = document.querySelector(".stat-info h3")
    if (totalVehiclesElement) {
        const currentCount = Number.parseInt(totalVehiclesElement.textContent)
        totalVehiclesElement.textContent = currentCount + 1
    }
}

// Vehicle management functions
function editVehicle(vehicleId) {
    showNotification("Edit vehicle functionality would be implemented here", "info")
}

function viewVehicleDetails(vehicleId) {
    showNotification("Vehicle details modal would be displayed here", "info")
}

function removeVehicle(vehicleId) {
    if (confirm("Are you sure you want to remove this vehicle?")) {
        showNotification("Vehicle removed successfully", "success")
        // Remove vehicle card from DOM
        // Update stats
    }
}

// Booking management functions
function viewBookingDetails(bookingId) {
    showNotification("Booking details modal would be displayed here", "info")
}

function contactCustomer(bookingId) {
    if (confirm("Call customer for booking " + bookingId + "?")) {
        showNotification("Initiating call to customer...", "info")
    }
}

function endRental(bookingId) {
    if (confirm("End rental for booking " + bookingId + "?")) {
        showNotification("Rental ended successfully", "success")
        // Update booking status in table
        updateBookingStatus(bookingId, "completed")
    }
}

// Update booking status
function updateBookingStatus(bookingId, newStatus) {
    const bookingRows = document.querySelectorAll(".data-table tbody tr")
    bookingRows.forEach((row) => {
        const idCell = row.querySelector("td:first-child")
        if (idCell && idCell.textContent === bookingId) {
            const statusCell = row.querySelector(".status")
            if (statusCell) {
                statusCell.textContent = newStatus
                statusCell.className = `status ${newStatus}`
            }
        }
    })
}

// Earnings functions
function requestPayout() {
    const availableBalance = document.querySelector(".earning-card:last-child .earning-amount")
    if (availableBalance) {
        const amount = availableBalance.textContent
        if (confirm(`Request payout of ${amount}?`)) {
            showNotification("Payout request submitted successfully!", "success")

            // Reset available balance
            availableBalance.textContent = "₹0"
        }
    }
}

// Maintenance functions
function scheduleMaintenance() {
    const vehicleSelect = prompt("Enter vehicle name for maintenance:")
    const serviceType = prompt("Enter service type:")

    if (vehicleSelect && serviceType) {
        showNotification(`Maintenance scheduled for ${vehicleSelect}`, "success")

        // Add to upcoming maintenance
        addMaintenanceItem(vehicleSelect, serviceType, "upcoming")
    }
}

function addMaintenanceItem(vehicle, service, type) {
    const maintenanceCard = document.querySelector(`.maintenance-card.${type}`)
    if (maintenanceCard) {
        const maintenanceList = maintenanceCard.querySelector(".maintenance-list")
        const newItem = document.createElement("div")
        newItem.className = "maintenance-item"
        newItem.innerHTML = `
            <span>${vehicle} - ${service}</span>
            <span class="due-date">Due: ${getNextWeekDate()}</span>
        `

        maintenanceList.appendChild(newItem)

        // Update count
        const countElement = maintenanceCard.querySelector(".maintenance-count")
        const currentCount = Number.parseInt(countElement.textContent)
        countElement.textContent = currentCount + 1
    }
}

function getNextWeekDate() {
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    return nextWeek.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
    })
}

// Support functions
function startSupportChat() {
    showNotification("Connecting to rental support chat...", "info")
    setTimeout(() => {
        showNotification("Connected to rental support agent", "success")
    }, 2000)
}

function callSupport() {
    if (confirm("Call rental support at +91 1800-123-4567?")) {
        showNotification("Initiating call to rental support...", "info")
    }
}

function sendSupportEmail() {
    const subject = prompt("Enter email subject:")
    const message = prompt("Enter your message:")

    if (subject && message) {
        showNotification("Support email sent successfully!", "success")
    }
}

// Analytics functions
function exportEarningsReport() {
    showNotification("Exporting earnings report...", "info")
    setTimeout(() => {
        showNotification("Earnings report exported successfully!", "success")
    }, 2000)
}

function exportBookingsReport() {
    showNotification("Exporting bookings report...", "info")
    setTimeout(() => {
        showNotification("Bookings report exported successfully!", "success")
    }, 2000)
}

// Real-time updates simulation
function simulateRealTimeUpdates() {
    setInterval(() => {
        // Randomly update booking counts
        const activeBookingsElement = document.querySelectorAll(".stat-info h3")[1]
        if (activeBookingsElement && Math.random() > 0.9) {
            const currentBookings = Number.parseInt(activeBookingsElement.textContent)
            const change = Math.random() > 0.5 ? 1 : -1
            const newBookings = Math.max(0, currentBookings + change)
            activeBookingsElement.textContent = newBookings

            // Show notification for new booking
            if (change > 0) {
                showNotification("New booking received!", "success")
            }
        }

        // Update earnings occasionally
        const earningsElement = document.querySelectorAll(".stat-info h3")[2]
        if (earningsElement && Math.random() > 0.95) {
            const currentEarnings = Number.parseInt(earningsElement.textContent.replace(/[^0-9]/g, ""))
            const newEarnings = currentEarnings + Math.floor(Math.random() * 500) + 100
            earningsElement.textContent = `₹${newEarnings.toLocaleString()}`
        }
    }, 15000) // Update every 15 seconds
}

// Initialize real-time updates
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(simulateRealTimeUpdates, 5000) // Start after 5 seconds
})

// Vehicle availability toggle
function toggleVehicleAvailability(vehicleId) {
    const vehicleCard = document.querySelector(`[data-vehicle-id="${vehicleId}"]`)
    if (vehicleCard) {
        const statusElement = vehicleCard.querySelector(".status")
        const isAvailable = statusElement.classList.contains("active")

        if (isAvailable) {
            statusElement.classList.remove("active")
            statusElement.classList.add("inactive")
            statusElement.textContent = "Unavailable"
            showNotification("Vehicle marked as unavailable", "info")
        } else {
            statusElement.classList.remove("inactive")
            statusElement.classList.add("active")
            statusElement.textContent = "Available"
            showNotification("Vehicle marked as available", "success")
        }
    }
}

// Bulk operations
function selectAllVehicles() {
    const checkboxes = document.querySelectorAll('.vehicle-card input[type="checkbox"]')
    checkboxes.forEach((checkbox) => {
        checkbox.checked = true
    })
}

function bulkUpdatePricing() {
    const selectedVehicles = document.querySelectorAll('.vehicle-card input[type="checkbox"]:checked')
    if (selectedVehicles.length === 0) {
        showNotification("Please select at least one vehicle", "warning")
        return
    }

    const newRate = prompt("Enter new daily rate (₹):")
    if (newRate && !isNaN(newRate) && newRate > 0) {
        showNotification(`Pricing updated for ${selectedVehicles.length} vehicles`, "success")
    }
}