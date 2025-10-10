
# L2L
=======
# ZeroWaste DineMap

A comprehensive food donation platform connecting donors with NGOs to reduce food waste and fight hunger. Built with Node.js Express backend and Next.js frontend.

## 🌟 Features

- **Food Donation Management**: Post, claim, and track food donations
- **Interactive Maps**: Google Maps integration for location-based services
- **Role-based Access**: Separate dashboards for donors and NGOs
- **Real-time Updates**: Live notifications and status updates
- **Multi-location Pickup**: Optimized routes for multiple donations
- **Image Upload**: Visual representation of food items
- **Authentication**: Secure Firebase-based authentication
- **Responsive Design**: Mobile-friendly interface

## 🏗️ Architecture

### Backend (Node.js + Express)
- RESTful API with Express.js
- MongoDB with Mongoose ODM for database
- JWT-based authentication with bcrypt
- File upload handling with Multer
- Input validation and security middleware
- Rate limiting and CORS protection

### Frontend (Next.js + React)
- Server-side rendering with Next.js
- React hooks for state management
- Tailwind CSS for styling
- Google Maps integration
- JWT-based authentication with cookies
- Responsive design

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local installation or MongoDB Atlas account)
- Google Maps API key

### MongoDB Setup

#### Option 1: Local MongoDB Installation
1. Download and install MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Start MongoDB service:
   ```bash
   # On macOS with Homebrew
   brew services start mongodb-community
   
   # On Ubuntu/Debian
   sudo systemctl start mongod
   
   # On Windows
   net start MongoDB
   ```

#### Option 2: MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string and update `MONGODB_URI` in your `.env` file

### 1. Clone the Repository
```bash
git clone <repository-url>
cd LAST-YEAR-PROJECT
```

### 2. Backend Setup
```bash
cd backend
npm install
cp env.example .env
```

Configure your `.env` file with MongoDB and other credentials:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/zerowaste-dinemap
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/zerowaste-dinemap

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
JWT_EXPIRE=7d

# Google Maps API (for backend geocoding if needed)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
cp env.example .env.local
```

Configure your `.env.local` file:
```env
# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Start the frontend:
```bash
npm run dev
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/health

## 📁 Project Structure

```
LAST-YEAR-PROJECT/
├── backend/                 # Express.js API server
│   ├── controllers/         # Request handlers
│   ├── models/             # Data models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── server.js           # Main server file
│   └── package.json
├── frontend/               # Next.js React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilities
│   │   ├── pages/          # Next.js pages
│   │   └── styles/         # Global styles
│   ├── next.config.js      # Next.js configuration
│   └── package.json
└── Left2Lift/             # Original TypeScript version
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password
- `DELETE /api/auth/account` - Delete account
- `GET /api/auth/stats` - Get user statistics

### Donations
- `GET /api/donations` - Get all donations
- `POST /api/donations` - Create donation
- `GET /api/donations/:id` - Get donation by ID
- `PUT /api/donations/:id` - Update donation
- `DELETE /api/donations/:id` - Delete donation
- `POST /api/donations/:id/claim` - Claim donation
- `POST /api/donations/:id/pickup` - Mark as picked up

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Upload
- `POST /api/upload/image` - Upload image
- `GET /api/upload/images` - Get user images
- `DELETE /api/upload/image/:fileName` - Delete image

## 🎨 User Roles

### Donor
- Post food donations with details
- Set pickup locations and times
- Track donation status
- View donation history
- Upload food images

### NGO
- Browse available donations
- Claim donations
- View interactive map
- Plan multi-location pickups
- Track pickup progress
- Mark donations as collected

## 🛡️ Security Features

- JWT-based authentication with bcrypt password hashing
- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet security headers
- File upload restrictions
- Role-based access control
- Secure cookie storage

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- Various screen sizes

## 🚀 Deployment

### Backend Deployment
1. Set up production environment variables
2. Deploy to platforms like:
   - Heroku
   - AWS EC2
   - Google Cloud Run
   - DigitalOcean

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to platforms like:
   - Vercel (recommended)
   - Netlify
   - AWS Amplify
   - Any static hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- MongoDB for database services
- Google Maps for location services
- Next.js and React communities
- All contributors and testers

## 📞 Support

For support and questions, please create an issue in the repository or contact the development team.

---

**Made with ❤️ for a better world with less food waste**

