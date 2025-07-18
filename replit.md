# Climbing Tracker App

## Overview

This is a full-stack climbing tracking application built with React, Express, and PostgreSQL. The app allows users to log their climbing activities, track progress, and view statistics about their climbing performance. It's designed as a mobile-first progressive web app with a clean, modern interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Data Display and Stats Fixes (July 17, 2025)
- Fixed climb log display issue by updating query keys to use correct API paths ("/api/climbs")
- Resolved stats page month selection - dropdown now properly shows available months with logged climbs
- Fixed grade progression chart mapping issue - chart now correctly displays grades (6c+ instead of 7a)
- Updated frontend grade array to match backend system: ['5c', '6a', '6a+', '6b', '6b+', '6c', '6c+', '7a', '7b', '7c']
- Stats cards now only display when a month is selected, proper empty state handling
- Fixed cache invalidation across all components to use consistent "api" prefix in query keys

### Email-Based User Identification (July 17, 2025)
- Updated authentication system to use email-based user identification instead of hardcoded user IDs
- Created `getDevelopmentUser()` helper function for flexible development testing
- Added `DEV_USER_EMAIL` environment variable for customizable development user
- Enhanced `getUserByEmailOrCreate()` method for user lookup and creation
- All security fixes maintained: environment-gated bypass, secure cache headers, user-specific query keys, persistent sessions

### Hamburger Menu Profile Dropdown (July 17, 2025)
- Made hamburger menu (three horizontal bars) clickable in mobile header
- Added dropdown menu displaying user profile information (name and email)
- Included profile icons for better visual hierarchy
- Added logout functionality with red styling for clear user action
- Responsive dropdown design that fits mobile-first interface

### Profile Page with Photo Upload (July 17, 2025)
- Created dedicated profile page accessible from hamburger menu
- Added name editing functionality with immediate updates across the app
- Implemented profile photo upload with automatic image compression
- Added profile image persistence - photos are saved and displayed when returning
- Enhanced mobile header to show profile photos in dropdown menu
- Fixed cache invalidation to ensure name updates reflect immediately on home page
- Profile images are stored as base64 data URLs for seamless integration

### Profile Data Persistence Fix (July 17, 2025)
- Fixed profile photo persistence - uploaded photos now save and display when returning to profile page
- Enhanced home page to immediately reflect name changes after profile updates
- Added profile image display in hamburger menu dropdown with proper fallback
- Updated server responses to include profileImageUrl in all authentication endpoints
- Improved cache invalidation to sync profile changes across all app components

### Logout Functionality (July 17, 2025)
- Implemented proper logout route that clears user sessions and cookies
- Added session cleanup to prevent unauthorized access after logout
- Enhanced logout button to redirect users to login page after successful logout
- Fixed logout process to handle errors gracefully with fallback redirect

### Lexend Font Implementation (July 17, 2025)
- Added Google Fonts import for Lexend font with multiple weights (300-700)
- Updated Tailwind config to use Lexend as default sans-serif font family
- Applied Lexend font globally throughout the app for consistent typography
- Included proper font fallbacks for reliability and performance optimization

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with custom styling
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Validation**: Zod for runtime type validation
- **Session Management**: Express sessions with PostgreSQL store

### Mobile-First Design
- Responsive design optimized for mobile devices
- Bottom navigation for easy thumb navigation
- Mobile header with status bar simulation
- Touch-friendly interface components

## Key Components

### Database Schema
- **Users Table**: Stores user information, current streak, and last climb date
- **Climbs Table**: Records individual climbing sessions with gym, route type, grade, outcome, and notes
- **Relations**: One-to-many relationship between users and climbs

### API Endpoints
- `GET /api/user`: Retrieve or create demo user
- `GET /api/climbs`: Get all climbs for the current user
- `POST /api/climbs`: Create a new climb entry
- `PUT /api/climbs/:id`: Update an existing climb
- `DELETE /api/climbs/:id`: Delete a climb
- `GET /api/stats/today`: Get today's climbing statistics
- `GET /api/stats/monthly`: Get monthly climbing statistics with route breakdown
- `GET /api/stats/available-months`: Get months with logged climbs
- `GET /api/stats/grade-progression`: Get grade progression data up to selected month

### Frontend Pages
- **Home**: Dashboard with today's climbing stats and quick actions
- **Climb Log**: List of all climbs with filtering and CRUD operations
- **Stats**: Monthly statistics and progress tracking

### Core Features
- Climb logging with route type (Boulder, Top Rope, Lead, Auto Belay)
- Grade tracking with climbing-specific grading system
- Outcome tracking (Send, Flash, Project, Attempt)
- Daily and monthly statistics with visual charts
- Weekly streak tracking (unique days within current week, Sunday-Saturday)
- Photo/video upload for climb documentation (stored as base64 data URLs)
- Automatic media compression for files over 5MB (images resized to 1920x1080, videos converted to thumbnails)
- Gym-specific dropdown with predefined locations (Camp5 KL Eco, Camp5 KL East, Camp5 1U, Camp5 Utro, Camp5 Jumpa, Batuu, Bump J1, Bump PBJ)
- Grade progression tracking with line charts
- Route type breakdown with donut charts

## Data Flow

1. **User Authentication**: Currently uses a demo user system for simplicity
2. **Climb Logging**: Form submissions are validated with Zod schemas and stored in PostgreSQL
3. **Real-time Updates**: TanStack Query handles cache invalidation and real-time UI updates
4. **Statistics Calculation**: Server-side aggregation of climb data for dashboard metrics

## External Dependencies

### Core Libraries
- **@neondatabase/serverless**: PostgreSQL connection for serverless environments
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight React router
- **date-fns**: Date manipulation and formatting

### UI Libraries
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **class-variance-authority**: Utility for component variants

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production
- **vite**: Frontend build tool and dev server

## Deployment Strategy

### Build Process
1. **Frontend**: Vite builds React app to `dist/public`
2. **Backend**: esbuild bundles server code to `dist/index.js`
3. **Database**: Drizzle handles schema migrations

### Environment Requirements
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment setting (development/production)
- **DEV_USER_EMAIL**: Email for development user bypass (optional, defaults to 'lyhakim@gmail.com')

### Scripts
- `npm run dev`: Start development server with hot reload
- `npm run build`: Build both frontend and backend for production
- `npm run start`: Start production server
- `npm run db:push`: Push database schema changes

### Production Considerations
- Uses Neon serverless PostgreSQL for scalability
- Express serves both API and static files
- Environment-specific configuration for development vs production
- Error handling and logging for production debugging

The application is designed to be easily deployable on platforms like Replit, Vercel, or any Node.js hosting service with PostgreSQL support.