# ECO-PATH - Sustainable Transportation Platform

ECO-PATH is a comprehensive cycle ride booking and rental platform built with Node.js, Express.js, MongoDB, and Socket.IO. It connects users, riders, and vehicle owners in an eco-friendly transportation ecosystem.

## 🌟 Features

### For Users
- **Ride Booking**: Book cycle or electric vehicle rides with real-time rider matching
- **Vehicle Rental**: Rent cycles and EVs for daily, weekly, or monthly periods
- **Wallet System**: Integrated digital wallet for seamless payments
- **Favorite Locations**: Save frequently visited places
- **Ride History**: Track all past rides and expenses
- **Real-time Tracking**: Live updates on ride status and rider location

### For Riders
- **Earnings Dashboard**: Track daily, weekly, and monthly earnings
- **Ride Management**: Accept, start, and complete rides
- **Online/Offline Status**: Control availability for ride requests
- **Performance Analytics**: View ratings, ride statistics, and goals
- **Real-time Notifications**: Instant ride request alerts

### For Vehicle Owners (Renters)
- **Vehicle Management**: List and manage multiple vehicles
- **Booking Management**: Handle rental requests and bookings
- **Earnings Tracking**: Monitor rental income and performance
- **Maintenance Scheduling**: Track vehicle maintenance and service history
- **Analytics Dashboard**: Detailed insights on vehicle utilization

### Admin Features
- **User Management**: Manage all user accounts and verifications
- **Rider Approvals**: Review and approve rider applications
- **Vehicle Verification**: Verify vehicle documents and listings
- **Platform Analytics**: Comprehensive platform statistics and insights

## 🚀 Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time Communication**: Socket.IO
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **File Uploads**: Multer + Cloudinary
- **Email Service**: Nodemailer
- **Security**: Helmet, CORS, Rate Limiting

## 📦 Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/eco-path/eco-path-app.git
   cd eco-path-app
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**
   \`\`\`bash
   cp .env.example .env
   # Edit .env file with your configuration
   \`\`\`

4. **Start MongoDB**
   \`\`\`bash
   # Make sure MongoDB is running on your system
   mongod
   \`\`\`

5. **Seed the database (optional)**
   \`\`\`bash
   npm run seed
   \`\`\`

6. **Start the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

7. **Access the application**
   - Open your browser and go to `http://localhost:3000`

## 🗄️ Database Schema

### User Model
- Personal information (name, email, phone)
- Authentication credentials
- Wallet balance and transaction history
- Favorite locations and preferences
- Ratings and reviews

### Rider Model
- Vehicle details and license information
- Location tracking and availability status
- Earnings and performance statistics
- Service area and working hours

### Vehicle Model
- Vehicle specifications and images
- Pricing and availability settings
- Location and pickup instructions
- Maintenance history and issues

### Booking Model
- Rental details and timeline
- Payment and pricing information
- Vehicle handover documentation
- Ratings and communication logs

### RideRequest Model
- Pickup and destination details
- Real-time tracking and status updates
- Fare calculation and payment processing
- Route information and timeline

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### User Routes
- `GET /api/user/dashboard` - User dashboard data
- `GET /api/user/rides` - User ride history
- `GET /api/user/favorites` - Favorite locations
- `POST /api/user/wallet/add` - Add money to wallet

### Rider Routes
- `GET /api/rider/dashboard` - Rider dashboard data
- `PUT /api/rider/status` - Update online status
- `GET /api/rider/rides` - Rider ride history
- `POST /api/rider/rides/:id/accept` - Accept ride request

### Vehicle Routes
- `GET /api/vehicle` - Browse available vehicles
- `POST /api/vehicle` - Add new vehicle
- `GET /api/vehicle/owner/vehicles` - Owner's vehicles
- `PUT /api/vehicle/:id/availability` - Toggle availability

### Booking Routes
- `POST /api/booking` - Create new booking
- `GET /api/booking/user` - User bookings
- `GET /api/booking/owner` - Owner bookings
- `POST /api/booking/:id/cancel` - Cancel booking

## 🔄 Real-time Features

The application uses Socket.IO for real-time communication:

### Events
- `ride-request` - User requests a ride
- `new-ride-request` - Notify nearby riders
- `accept-ride` - Rider accepts ride request
- `ride-accepted` - Notify user of acceptance
- `complete-ride` - Mark ride as completed
- `location-update` - Real-time location tracking

### Usage Example
\`\`\`javascript
// Client-side
socket.emit('ride-request', {
  userId: 'user123',
  pickup: { lat: 28.6139, lng: 77.2090 },
  destination: { lat: 28.6129, lng: 77.2295 },
  vehicleType: 'cycle'
});

// Server-side
socket.on('ride-request', async (data) => {
  // Find nearby riders and send notifications
  const nearbyRiders = await findNearbyRiders(data);
  nearbyRiders.forEach(rider => {
    io.to(`rider-${rider._id}`).emit('new-ride-request', data);
  });
});
\`\`\`

## 🧪 Testing

Run the test suite:
\`\`\`bash
npm test
\`\`\`

Run tests with coverage:
\`\`\`bash
npm run test:coverage
\`\`\`

## 📱 Sample Login Credentials

After running the seed script, you can use these credentials:

- **User**: alice@example.com / password123
- **Rider**: john@example.com / password123  
- **Renter**: mike@example.com / password123
- **Admin**: admin@ecopath.com / admin123

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting to prevent abuse
- CORS configuration
- Input validation and sanitization
- Secure HTTP headers with Helmet

## 🌍 Environment Variables

Key environment variables to configure:

\`\`\`env
MONGODB_URI=mongodb://localhost:27017/ecopath
JWT_SECRET=your-secret-key
PORT=3000
CLOUDINARY_CLOUD_NAME=your-cloud-name
GOOGLE_MAPS_API_KEY=your-maps-key
\`\`\`

## 📈 Performance Optimization

- Database indexing for location-based queries
- Image optimization with Cloudinary
- Compression middleware for responses
- Efficient aggregation pipelines
- Connection pooling for MongoDB

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and queries:
- Email: support@ecopath.com
- Phone: +91-1800-123-4567
- Documentation: [docs.ecopath.com](https://docs.ecopath.com)

## 🚀 Deployment

### Using PM2 (Production)
\`\`\`bash
npm install -g pm2
pm2 start server.js --name "eco-path"
pm2 startup
pm2 save
\`\`\`

### Using Docker
\`\`\`bash
docker build -t eco-path .
docker run -p 3000:3000 eco-path
\`\`\`

### Environment Setup
1. Set up MongoDB Atlas or local MongoDB
2. Configure Cloudinary for image uploads
3. Set up email service (Gmail/SendGrid)
4. Configure payment gateway (Razorpay/Stripe)
5. Set up Google Maps API for location services

---

Built with ❤️ for a sustainable future 🌱
