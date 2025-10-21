# ZeroWaste DineMap Backend API

A Node.js Express backend API for the ZeroWaste DineMap application, providing food donation management, user authentication, and real-time data synchronization.

## Features

- 🔐 Firebase Authentication integration
- 🍽️ Food donation management (CRUD operations)
- 👥 User management (Donors and NGOs)
- 📍 Location-based donation queries
- 📊 Statistics and analytics
- 🖼️ Image upload to Firebase Storage
- 🚀 Real-time data with Firestore
- 🛡️ Security middleware (Helmet, CORS, Rate limiting)
- ✅ Input validation with express-validator

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Firebase Firestore
- **Authentication**: Firebase Admin SDK
- **Storage**: Firebase Storage
- **Validation**: express-validator
- **Security**: Helmet, CORS, express-rate-limit

## Project Structure

```
backend/
├── controllers/          # Request handlers
│   ├── authController.js
│   ├── donationController.js
│   ├── uploadController.js
│   └── userController.js
├── models/              # Data models
│   ├── User.js
│   ├── FoodDonation.js
│   └── ClaimRequest.js
├── routes/              # API routes
│   ├── auth.js
│   ├── donations.js
│   ├── users.js
│   └── upload.js
├── middleware/          # Custom middleware
│   └── validation.js
├── server.js           # Main server file
├── package.json
└── README.md
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Fill in your Firebase configuration and other environment variables.

4. **Start the development server**
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_CLIENT_CERT_URL=your_client_cert_url
FIREBASE_STORAGE_BUCKET=your_storage_bucket

# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## API Endpoints

### Authentication
- `POST /api/auth/create-profile` - Create user profile after Firebase signup
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `DELETE /api/auth/account` - Delete user account
- `GET /api/auth/stats` - Get user statistics

### Donations
- `GET /api/donations` - Get all donations (with filters)
- `GET /api/donations/stats` - Get donation statistics
- `GET /api/donations/location` - Get donations by location
- `GET /api/donations/:id` - Get donation by ID
- `POST /api/donations` - Create new donation
- `PUT /api/donations/:id` - Update donation
- `DELETE /api/donations/:id` - Delete donation
- `POST /api/donations/:id/claim` - Claim donation
- `POST /api/donations/:id/pickup` - Mark donation as picked up

### Users
- `GET /api/users` - Get all users
- `GET /api/users/search` - Search users
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/:id/profile` - Get user profile with stats
- `GET /api/users/:id/donations` - Get user's donations
- `GET /api/users/:id/dashboard-stats` - Get dashboard statistics
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### File Upload
- `POST /api/upload/image` - Upload image
- `GET /api/upload/images` - Get user's images
- `GET /api/upload/image/:fileName` - Get image info
- `DELETE /api/upload/image/:fileName` - Delete image

## Authentication

The API uses Firebase Authentication. Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase_id_token>
```

## Data Models

### User
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  role: 'donor' | 'ngo',
  photoURL?: string,
  createdAt: string,
  updatedAt: string
}
```

### FoodDonation
```javascript
{
  id: string,
  donorId: string,
  donorName: string,
  title: string,
  description: string,
  quantity: string,
  foodType: string,
  expiryTime: string,
  pickupWindow: {
    start: string,
    end: string
  },
  location: {
    lat: number,
    lng: number,
    address: string
  },
  status: 'available' | 'claimed' | 'picked' | 'expired',
  claimedBy?: string,
  claimedByName?: string,
  createdAt: string,
  imageUrl?: string
}
```

## Error Handling

The API returns consistent error responses:

```javascript
{
  error: "Error message",
  details?: "Additional error details"
}
```

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Validate all inputs
- **Firebase Admin**: Secure server-side operations

## Development

```bash
# Start development server with hot reload
npm run dev

# Start production server
npm start

# Run tests
npm test
```

## Deployment

1. Set up your production environment variables
2. Build the application
3. Deploy to your preferred platform (Heroku, AWS, Google Cloud, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
