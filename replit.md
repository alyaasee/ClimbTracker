# Climbing Tracker App

## Overview

This is a full-stack climbing tracking application built with React, Express, and PostgreSQL. The app allows users to log their climbing activities, track progress, and view statistics about their climbing performance. It's designed as a mobile-first progressive web app with a clean, modern interface.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- Photo/video upload for climb documentation
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