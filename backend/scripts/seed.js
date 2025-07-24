const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
require("dotenv").config()

// Import models
const User = require("./user")
const Rider = require("./rider")
const Vehicle = require("./vehicle")
const Booking = require("./booking")
const RideRequest = require("./Riderequest")

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/ecopath", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...")

    // Clear existing data
    await User.deleteMany({})
    await Rider.deleteMany({})
    await Vehicle.deleteMany({})
    await Booking.deleteMany({})
    await RideRequest.deleteMany({})

    console.log("🗑️  Cleared existing data")

    // Create sample users
    const users = [
      {
        firstName: "Alice",
        lastName: "Johnson",
        email: "alice@example.com",
        phone: "9876543210",
        password: await bcrypt.hash("password123", 12),
        userType: "user",
        walletBalance: 500,
        favoriteLocations: [
          {
            name: "Home",
            address: "123 Green Street, Eco City",
            coordinates: { lat: 28.6139, lng: 77.209 },
          },
          {
            name: "Office",
            address: "Tech Park, Sector 5",
            coordinates: { lat: 28.6129, lng: 77.2295 },
          },
        ],
      },
      {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "9876543211",
        password: await bcrypt.hash("password123", 12),
        userType: "rider",
        walletBalance: 200,
      },
      {
        firstName: "Mike",
        lastName: "Brown",
        email: "mike@example.com",
        phone: "9876543212",
        password: await bcrypt.hash("password123", 12),
        userType: "renter",
        walletBalance: 1000,
      },
      {
        firstName: "Admin",
        lastName: "User",
        email: "admin@ecopath.com",
        phone: "9876543213",
        password: await bcrypt.hash("admin123", 12),
        userType: "admin",
        walletBalance: 0,
      },
    ]

    const createdUsers = await User.insertMany(users)
    console.log("👥 Created sample users")

    // Create rider profile for John
    const johnUser = createdUsers.find((u) => u.email === "john@example.com")
    const rider = new Rider({
      userId: johnUser._id,
      licenseNumber: "DL123456789",
      vehicleType: "cycle",
      vehicleDetails: {
        brand: "Trek",
        model: "X-Caliber 8",
        registrationNumber: "CY123456",
        color: "Blue",
      },
      isOnline: true,
      isAvailable: true,
      currentLocation: {
        type: "Point",
        coordinates: [77.209, 28.6139],
      },
      totalRides: 156,
      totalEarnings: 12450,
      rating: 4.8,
      ratingCount: 156,
      isApproved: true,
    })

    await rider.save()
    console.log("🚴 Created rider profile")

    // Create vehicles for Mike (renter)
    const mikeUser = createdUsers.find((u) => u.email === "mike@example.com")
    const vehicles = [
      {
        ownerId: mikeUser._id,
        vehicleType: "cycle",
        brand: "Trek",
        model: "X-Caliber 8",
        year: 2023,
        description: "High-quality mountain bike perfect for city rides",
        pricing: {
          daily: 50,
          weekly: 300,
          monthly: 1000,
          securityDeposit: 500,
        },
        location: {
          address: "456 Business Street, Commercial Area",
          coordinates: {
            type: "Point",
            coordinates: [77.2295, 28.6129],
          },
        },
        specifications: {
          color: "Blue",
          features: ["21-speed", "Front suspension", "LED lights"],
          condition: "excellent",
        },
        rating: 4.8,
        ratingCount: 25,
        totalBookings: 25,
        totalEarnings: 18500,
        isVerified: true,
      },
      {
        ownerId: mikeUser._id,
        vehicleType: "electric-vehicle",
        brand: "Ather",
        model: "450X",
        year: 2023,
        description: "Premium electric scooter with smart features",
        pricing: {
          daily: 200,
          weekly: 1200,
          monthly: 4000,
          securityDeposit: 2000,
        },
        location: {
          address: "456 Business Street, Commercial Area",
          coordinates: {
            type: "Point",
            coordinates: [77.2295, 28.6129],
          },
        },
        specifications: {
          color: "White",
          features: ["Smart dashboard", "Fast charging", "GPS navigation"],
          condition: "excellent",
        },
        rating: 4.9,
        ratingCount: 15,
        totalBookings: 15,
        totalEarnings: 22000,
        isVerified: true,
      },
    ]

    await Vehicle.insertMany(vehicles)
    console.log("🚲 Created sample vehicles")

    // Create sample ride requests
    const aliceUser = createdUsers.find((u) => u.email === "alice@example.com")
    const rideRequests = [
      {
        userId: aliceUser._id,
        riderId: rider._id,
        pickup: {
          address: "123 Green Street, Eco City",
          coordinates: { lat: 28.6139, lng: 77.209 },
        },
        destination: {
          address: "Tech Park, Sector 5",
          coordinates: { lat: 28.6129, lng: 77.2295 },
        },
        vehicleType: "cycle",
        estimatedFare: 45,
        actualFare: 45,
        distance: 8.5,
        duration: 25,
        status: "completed",
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        endTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
        paymentStatus: "paid",
        rating: {
          userRating: 5,
          riderRating: 5,
          userReview: "Great ride, very smooth!",
          riderReview: "Polite and punctual passenger",
        },
      },
      {
        userId: aliceUser._id,
        pickup: {
          address: "City Mall, Downtown",
          coordinates: { lat: 28.6304, lng: 77.2177 },
        },
        destination: {
          address: "123 Green Street, Eco City",
          coordinates: { lat: 28.6139, lng: 77.209 },
        },
        vehicleType: "electric-vehicle",
        estimatedFare: 65,
        status: "pending",
      },
    ]

    await RideRequest.insertMany(rideRequests)
    console.log("🛣️  Created sample ride requests")

    console.log("✅ Database seeding completed successfully!")
    console.log("\n📋 Sample Login Credentials:")
    console.log("User: alice@example.com / password123")
    console.log("Rider: john@example.com / password123")
    console.log("Renter: mike@example.com / password123")
    console.log("Admin: admin@ecopath.com / admin123")

    process.exit(0)
  } catch (error) {
    console.error("❌ Error seeding database:", error)
    process.exit(1)
  }
}

// Run seeding
seedDatabase()
