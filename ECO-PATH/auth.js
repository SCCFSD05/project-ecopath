// Authentication JavaScript

document.addEventListener("DOMContentLoaded", () => {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const userType = urlParams.get("type") || "user"
    const mode = urlParams.get("mode") || "signin"

    // Initialize the page
    initializePage(userType, mode)

    // User type selection
    const userTypes = document.querySelectorAll(".user-type")
    userTypes.forEach((type) => {
        type.addEventListener("click", function () {
            const selectedType = this.getAttribute("data-type")
            selectUserType(selectedType)
        })
    })

    // Form switching
    const switchFormLinks = document.querySelectorAll(".switch-form")
    switchFormLinks.forEach((link) => {
        link.addEventListener("click", function (e) {
            e.preventDefault()
            switchForm()
        })
    })

    // Password toggle
    const passwordToggles = document.querySelectorAll(".password-toggle")
    passwordToggles.forEach((toggle) => {
        toggle.addEventListener("click", function () {
            const input = this.parentElement.querySelector("input")
            const icon = this.querySelector("i")

            if (input.type === "password") {
                input.type = "text"
                icon.classList.remove("fa-eye")
                icon.classList.add("fa-eye-slash")
            } else {
                input.type = "password"
                icon.classList.remove("fa-eye-slash")
                icon.classList.add("fa-eye")
            }
        })
    })

    // Form submissions
    const signinForm = document.getElementById("signinForm")
    const signupForm = document.getElementById("signupForm")

    if (signinForm) {
        signinForm.addEventListener("submit", handleSignIn)
    }

    if (signupForm) {
        signupForm.addEventListener("submit", handleSignUp)
    }

    // Social sign in
    const socialButtons = document.querySelectorAll(".social-btn")
    socialButtons.forEach((btn) => {
        btn.addEventListener("click", function () {
            const provider = this.classList.contains("google-btn") ? "Google" : "Facebook"
            handleSocialSignIn(provider)
        })
    })

    // Role-specific field visibility
    const userTypeElements = document.querySelectorAll(".user-type")
    userTypeElements.forEach((element) => {
        element.addEventListener("click", function () {
            const type = this.getAttribute("data-type")
            showRoleSpecificFields(type)
        })
    })
})

// Initialize page based on URL parameters
function initializePage(userType, mode) {
    // Select user type
    selectUserType(userType)

    // Show appropriate form
    if (mode === "signup") {
        switchToSignUp()
    } else {
        switchToSignIn()
    }

    // Show role-specific fields
    showRoleSpecificFields(userType)
}

// Select user type
function selectUserType(type) {
    const userTypes = document.querySelectorAll(".user-type")
    userTypes.forEach((userType) => {
        userType.classList.remove("active")
        if (userType.getAttribute("data-type") === type) {
            userType.classList.add("active")
        }
    })

    // Update form text
    updateFormText(type)

    // Show role-specific fields
    showRoleSpecificFields(type)

    // Update URL
    const url = new URL(window.location)
    url.searchParams.set("type", type)
    window.history.replaceState({}, "", url)
}

// Update form text based on user type
function updateFormText(type) {
    const typeTexts = {
        user: "User Account",
        rider: "Rider Account",
        renter: "Vehicle Owner Account",
        admin: "Admin Account",
    }

    const userTypeText = document.getElementById("userTypeText")
    const userTypeTextSignup = document.getElementById("userTypeTextSignup")

    if (userTypeText) {
        userTypeText.textContent = typeTexts[type] || "account"
    }
    if (userTypeTextSignup) {
        userTypeTextSignup.textContent = typeTexts[type] || "account"
    }
}

// Show role-specific fields
function showRoleSpecificFields(type) {
    const riderFields = document.querySelector(".rider-fields")
    const renterFields = document.querySelector(".renter-fields")

    // Hide all role-specific fields
    if (riderFields) riderFields.style.display = "none"
    if (renterFields) renterFields.style.display = "none"

    // Show relevant fields
    if (type === "rider" && riderFields) {
        riderFields.style.display = "block"
    } else if (type === "renter" && renterFields) {
        renterFields.style.display = "block"
    }
}

// Switch between forms
function switchForm() {
    const signinForm = document.querySelector(".signin-form")
    const signupForm = document.querySelector(".signup-form")

    if (signinForm.style.display === "none") {
        switchToSignIn()
    } else {
        switchToSignUp()
    }
}

// Switch to sign in form
function switchToSignIn() {
    const signinForm = document.querySelector(".signin-form")
    const signupForm = document.querySelector(".signup-form")

    signinForm.style.display = "block"
    signupForm.style.display = "none"

    // Update URL
    const url = new URL(window.location)
    url.searchParams.set("mode", "signin")
    window.history.replaceState({}, "", url)
}

// Switch to sign up form
function switchToSignUp() {
    const signinForm = document.querySelector(".signin-form")
    const signupForm = document.querySelector(".signup-form")

    signinForm.style.display = "none"
    signupForm.style.display = "block"

    // Update URL
    const url = new URL(window.location)
    url.searchParams.set("mode", "signup")
    window.history.replaceState({}, "", url)
}

// Handle sign in
function handleSignIn(e) {
    e.preventDefault()

    const email = document.getElementById("signinEmail").value
    const password = document.getElementById("signinPassword").value
    const selectedUserType = document.querySelector(".user-type.active")?.getAttribute("data-type") || "user"

    // Basic validation
    if (!email || !password) {
        showNotification("Please fill in all fields", "error")
        return
    }

    // Show loading
    showLoading("Signing you in...")

    // Simulate API call
    setTimeout(() => {
        hideLoading()

        // For demo purposes, accept any credentials
        if (email && password) {
            showNotification("Sign in successful!", "success")

            // Store user info in localStorage
            const userInfo = {
                email: email,
                type: selectedUserType,
                name: email.split("@")[0],
                loginTime: new Date().toISOString(),
            }
            localStorage.setItem("ecoride_user", JSON.stringify(userInfo))

            // Redirect to appropriate dashboard
            setTimeout(() => {
                redirectToDashboard(selectedUserType)
            }, 1500)
        } else {
            showNotification("Invalid credentials", "error")
        }
    }, 2000)
}

// Handle sign up
function handleSignUp(e) {
    e.preventDefault()

    const firstName = document.getElementById("firstName").value
    const lastName = document.getElementById("lastName").value
    const email = document.getElementById("signupEmail").value
    const phone = document.getElementById("phoneNumber").value
    const password = document.getElementById("signupPassword").value
    const confirmPassword = document.getElementById("confirmPassword").value
    const agreeTerms = document.getElementById("agreeTerms").checked
    const selectedUserType = document.querySelector(".user-type.active")?.getAttribute("data-type") || "user"

    // Validation
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
        showNotification("Please fill in all required fields", "error")
        return
    }

    if (password !== confirmPassword) {
        showNotification("Passwords do not match", "error")
        return
    }

    if (password.length < 6) {
        showNotification("Password must be at least 6 characters", "error")
        return
    }

    if (!agreeTerms) {
        showNotification("Please agree to the Terms of Service", "error")
        return
    }

    // Role-specific validation
    if (selectedUserType === "rider") {
        const licenseNumber = document.getElementById("licenseNumber").value
        const vehicleType = document.getElementById("vehicleType").value

        if (!licenseNumber || !vehicleType) {
            showNotification("Please fill in all rider-specific fields", "error")
            return
        }
    }

    if (selectedUserType === "renter") {
        const vehicleCount = document.getElementById("vehicleCount").value

        if (!vehicleCount) {
            showNotification("Please specify the number of vehicles", "error")
            return
        }
    }

    // Show loading
    showLoading("Creating your account...")

    // Simulate API call
    setTimeout(() => {
        hideLoading()
        showNotification("Account created successfully!", "success")

        // Store user info
        const userInfo = {
            email: email,
            name: `${firstName} ${lastName}`,
            type: selectedUserType,
            phone: phone,
            signupTime: new Date().toISOString(),
        }
        localStorage.setItem("ecoride_user", JSON.stringify(userInfo))

        // For riders, show approval message
        if (selectedUserType === "rider") {
            showNotification("Your rider application is under review. You'll be notified once approved.", "info")
            setTimeout(() => {
                window.location.href = "index.html"
            }, 3000)
        } else {
            // Redirect to dashboard
            setTimeout(() => {
                redirectToDashboard(selectedUserType)
            }, 1500)
        }
    }, 2500)
}

// Handle social sign in
function handleSocialSignIn(provider) {
    showLoading(`Connecting with ${provider}...`)

    setTimeout(() => {
        hideLoading()
        showNotification(`${provider} sign in successful!`, "success")

        const selectedUserType = document.querySelector(".user-type.active")?.getAttribute("data-type") || "user"

        // Store user info
        const userInfo = {
            email: `user@${provider.toLowerCase()}.com`,
            name: `${provider} User`,
            type: selectedUserType,
            provider: provider,
            loginTime: new Date().toISOString(),
        }
        localStorage.setItem("ecoride_user", JSON.stringify(userInfo))

        setTimeout(() => {
            redirectToDashboard(selectedUserType)
        }, 1500)
    }, 2000)
}

// Redirect to appropriate dashboard
function redirectToDashboard(userType) {
    const dashboardUrls = {
        user: "user.html",
        rider: "rider.html",
        renter: "renting.html",
        admin: "admin.html",
    }

    const url = dashboardUrls[userType] || "user.html"
    window.location.href = url
}

// Show loading overlay
function showLoading(message = "Loading...") {
    const overlay = document.querySelector(".loading-overlay")
    const loadingText = overlay.querySelector("p")

    loadingText.textContent = message
    overlay.style.display = "flex"
}

// Hide loading overlay
function hideLoading() {
    const overlay = document.querySelector(".loading-overlay")
    overlay.style.display = "none"
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
        case "info":
            notification.style.backgroundColor = "#17a2b8"
            break
        default:
            notification.style.backgroundColor = "#6c757d"
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
    }, 4000)
}

// Form validation helpers
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

function validatePhone(phone) {
    const phoneRegex = /^[6-9]\d{9}$/
    return phoneRegex.test(phone)
}

// Password strength checker
function checkPasswordStrength(password) {
    let strength = 0
    const checks = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        numbers: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    Object.values(checks).forEach((check) => {
        if (check) strength++
    })

    return {
        score: strength,
        checks: checks,
    }
}

// Real-time password validation
document.addEventListener("DOMContentLoaded", () => {
    const passwordInput = document.getElementById("signupPassword")
    if (passwordInput) {
        passwordInput.addEventListener("input", function () {
            const strength = checkPasswordStrength(this.value)
            // You can add visual feedback here
        })
    }
})