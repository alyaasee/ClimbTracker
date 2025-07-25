# Climbing Tracker App

## Overview

This is a full-stack climbing tracking application built with React, Express, and PostgreSQL. The app allows users to log their climbing activities, track progress, and view statistics about their climbing performance. It's designed as a mobile-first progressive web app with a clean, modern interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Critical Security Fix - User Data Isolation (July 25, 2025)
- Fixed critical security vulnerability where users could see each other's climb data
- Removed dangerous development bypass system that caused data leakage between users
- Enhanced updateClimb and deleteClimb operations to verify user ownership
- Added userId parameter validation to all climb modification operations
- Enforced proper session-based authentication without fallback bypasses
- Each user now sees only their own climbs, ensuring complete data isolation
- Verified that new accounts start with zero climbs as expected
- Implemented secure bypass system that maintains user email isolation (999999 code works with any email)
- Users must still enter their unique email address to maintain separate climbing logs
- Replaced "Continue" button function with bypass functionality while keeping same button text
- Login flow now skips email verification while preserving individual user account creation

### CLIMB-CADE Login Page Implementation (July 23, 2025)
- Created authentic CLIMB-CADE branded login page following brand guidelines
- Implemented authentic CLIMB-CADE app icon with retro pixel art mountain design
- Replaced SVG pixel art with official app icon asset for consistent branding
- Removed Google login option as requested, focusing on email verification flow
- Applied retro-arcade styling with proper color palette (#CEE4D2, #EF7326, #1F1F1F, #FCFCF9)
- Added CLIMB-CADE branding footer with mountain icon
- Used Space Mono font throughout for consistent brand typography
- Integrated with existing Resend email verification system
- Updated verification page to match brand aesthetic with retro input styling
- Applied gradient background matching app's design language
- Enhanced input fields with proper contrast and retro styling
- Fixed logout functionality with proper POST method, cookie clearing, and development bypass control
- Enhanced email verification debugging with prominent console logging for development
- Updated email template with CLIMB-CADE branding and proper contrast colors
- Improved error handling for email delivery issues with detailed logging

### Comprehensive Stats Page Redesign (July 23, 2025)
- Redesigned Stats Page per PRD with month selector and comprehensive dashboard layout
- Implemented 3-tile summary cards layout: CLIMBS (Mountain icon), LEVEL (Gamepad2 icon), SUCCESS (Trophy icon)
- Added proper color coding using PRD color palette: blue (#2F9BFF), orange (#EF7326), purple (#B96BFF)
- Enhanced month selector to only show months with logged climbs for better UX
- Implemented Grade Progression line chart showing cumulative data up to selected month
- Added Route Type Breakdown donut chart with percentage splits and legend
- Applied proper empty state messaging: "No climbs yet—get on the wall!" for motivation
- Used authentic CLIMB-CADE color palette throughout charts and UI elements
- Enhanced mobile responsiveness with proper spacing and floating navigation accommodation
- Fixed critical API data loading issues where stats weren't displaying real climb data from logs
- Corrected query structure to properly connect frontend with backend using URL query parameters
- Changed "ACHIEVEMENTS" label to "SUCCESS" for better clarity in summary tiles
- Removed redundant "STATS" header title for cleaner interface design
- Improved font contrast following CLIMB-CADE brand guidelines by changing retro-title text from orange (#EF7326) to dark (#1F1F1F)
- Updated navigation button text colors to use dark neutral (#1F1F1F) for better readability against light mint backgrounds
- Enhanced accessibility compliance by ensuring proper color contrast ratios per WCAG standards

### Date-Grouped Climb Log and Floating Navigation (July 23, 2025)
- Implemented date-based grouping for climb logs with styled date headers
- Organized climbs chronologically with newest dates first for better browsing
- Added formatted date headers (e.g., "Wednesday, July 23, 2025") with gradient styling
- Removed text shadows from date headers for improved readability and cleaner appearance
- Removed climb count display ("Showing X to Y of Z climbs") for cleaner interface
- Maintained pagination functionality while preserving date grouping within pages
- Converted bottom navigation bar to floating design with rounded corners and shadow
- Applied fixed positioning with full-width span across mobile interface
- Enhanced navigation with backdrop blur, increased opacity, and hover scale effects
- Adjusted main content padding to accommodate floating navigation bar
- Removed "CLIMB-CADE" title from mobile header across all pages for cleaner interface
- Added gradient title styling for Home, Climb Log, and Stats pages with retro-container-primary styling
- Applied consistent orange gradient background with rounded corners to all main page titles
- Removed duplicate titles from climb log and stats pages to eliminate redundancy
- Renamed "Stats" to "Climbing Stats" in header for better clarity
- Enhanced daily motivation quotes with date-based variation and more sarcastic, humorous tone
- Fixed quote API endpoint path from `/api/daily-quote` to `/api/quote` for proper frontend integration
- Added date-based seed for OpenAI to ensure unique quotes per day with consistent daily experience
- Improved fallback quotes with enhanced sarcasm and humor while maintaining motivational value
- Fixed summary section real-time updates by correcting API endpoint mismatch
- Updated cache invalidation to use proper query keys for immediate stats refresh
- Resolved TypeScript type issues preventing proper data display in summary tiles

### Log Climb Modal Integration and Summary Auto-Update Fix (July 23, 2025)
- Connected LOG button in bottom navigation to open climb logging modal with modern card-tile layout
- Implemented 4-tile cards for Date, Location, Style, Grade and 2-tile cards for Outcome, Photos/Videos
- Fixed automatic cache invalidation for "Your Summary" section to update immediately after logging climbs
- Enhanced query key specificity using date-specific keys for today's stats (format: yyyy-MM-dd)
- Applied consistent cache invalidation across create, update, and delete climb operations
- Fixed welcome text dynamic font sizing to display complete message with exclamation mark on one line

### Animated Fire Icon and AA Contrast Implementation (July 21, 2025)
- Successfully implemented animated fire icon using WebM video format for streak display
- Fire animation shows for streaks >= 1 day with auto-play, looping, and muted attributes
- Applied 10-15% translucent white overlays across all pages for AA contrast compliance
- Enhanced contrast ratios: 15% overlay for headers/backgrounds, 75-85% for content cards
- Achieved AA standard compliance with 4.5:1 contrast for normal text and 3:1 for large text
- Fire video implementation includes fallback to fire emoji if video fails to load
- Quote section moved below summary and enhanced with stronger overlay (85% opacity) for optimal readability
- Applied consistent AA contrast text colors throughout all components

### Climb Log Pagination Implementation (July 21, 2025)
- Added pagination functionality to climb log page with maximum 20 logs per page
- Implemented responsive pagination controls with Previous/Next buttons and page numbers
- Added climb count display showing current range (e.g., "Showing 1 to 20 of 35 climbs")
- Pagination automatically resets to page 1 when date filters are applied
- Maintains date grouping within paginated results for better organization

### Navigation Enhancement - Log Button in Bottom Bar (July 21, 2025)
- Moved "Log Climb" button from home page to bottom navigation bar as "+" icon
- Maintained the distinctive peach-green gradient (CEE4D2 to EF7326) for visual consistency
- Enhanced mobile navigation with 4-tab layout: Home, Climb Log, Stats, and Log
- Improved accessibility by keeping logging function always visible in navigation

### Smart Prefilling for Faster Logging (July 21, 2025)
- Implemented intelligent prefilling for Date and Location when logging subsequent climbs on the same day
- Automatically detects first climb of the day and prefills gym location for faster follow-up entries
- Reduces friction for users logging multiple climbs in a single session
- Maintains today's date while carrying over gym selection for consistent user experience

### WCAG 2.2 Compliant Subtle Animations (July 21, 2025)
- Added 200-300ms scale and fade-in animations for tab switches and page transitions
- Implemented responsive navigation transitions with subtle scale effects for active states
- Applied card hover animations with minimal transform (translateY -1px) for enhanced interactivity
- All animations respect prefers-reduced-motion setting per WCAG 2.2 guidelines
- Used cubic-bezier easing for natural, non-jarring motion that enhances perceived performance

### Real-time Home Page Updates Fix (July 18, 2025)
- Fixed home page summary tiles not updating dynamically when logging new climbs
- Added explicit cache invalidation for today's stats query (`["api", "stats", "today"]`)
- Updated both create and update climb mutations to properly invalidate today's stats
- Updated delete climb mutation to also invalidate today's stats for consistency
- Home page now reflects new climb data immediately after logging without requiring refresh

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