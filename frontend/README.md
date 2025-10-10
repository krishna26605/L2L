# ZeroWaste DineMap Frontend

A Next.js frontend application for the ZeroWaste DineMap platform, enabling food donation and collection between donors and NGOs.

## Features

- 🔐 Firebase Authentication
- 🍽️ Food donation management
- 📍 Interactive Google Maps integration
- 👥 Role-based dashboards (Donor/NGO)
- 📱 Responsive design with Tailwind CSS
- 🚀 Real-time updates
- 🖼️ Image upload functionality
- 🗺️ Multi-location pickup routes

## Tech Stack

- **Framework**: Next.js 14
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Maps**: Google Maps API
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Icons**: Lucide React

## Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── Auth/           # Authentication components
│   │   ├── Donor/          # Donor-specific components
│   │   ├── NGO/            # NGO-specific components
│   │   └── Layout/         # Layout components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   ├── pages/              # Next.js pages
│   ├── styles/             # Global styles
│   └── config/             # Configuration files
├── public/                 # Static assets
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── package.json
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your Firebase and Google Maps API keys.

4. **Start the development server**
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env.local` file in the frontend directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Pages

- `/` - Home page with role-based routing
- `/auth` - Authentication page
- `/donor` - Donor dashboard
- `/ngo` - NGO dashboard

## Components

### Authentication
- `AuthPage` - Main authentication container
- `LoginForm` - User login form
- `SignupForm` - User registration form

### Donor Components
- `DonorDashboard` - Main donor interface
- `PostFoodForm` - Form to post food donations
- `DonationCard` - Display individual donations

### NGO Components
- `NGODashboard` - Main NGO interface
- `FoodMap` - Interactive map showing donations
- `DonationListItem` - List view of donations
- `MultiLocationSelector` - Select multiple donations for pickup
- `RouteTracker` - Track pickup progress

### Layout
- `Navbar` - Navigation bar with user menu

## Hooks

- `useAuth` - Authentication state management
- `useGoogleMaps` - Google Maps integration

## API Integration

The frontend communicates with the backend API through:

- `authAPI` - Authentication endpoints
- `donationsAPI` - Donation management
- `usersAPI` - User management
- `uploadAPI` - File upload functionality

## Styling

The application uses Tailwind CSS for styling with:

- Custom color palette (green/blue theme)
- Responsive design
- Custom animations
- Component classes
- Form styling utilities

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Deployment

1. Build the application
   ```bash
   npm run build
   ```

2. Deploy to your preferred platform:
   - Vercel (recommended for Next.js)
   - Netlify
   - AWS Amplify
   - Any static hosting service

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
