# What they Got? - MNSU Dining Reviews

## Overview

"What they Got?" is a mobile-first, minimalistic web application designed for college students at Minnesota State University, Mankato (MNSU) to discover, rate, and review dining center food. The app provides a social feed for students to check daily menus, share reviews with photos, and get real opinions about campus dining options before visiting the dining center.

The application scrapes menu data from the official Sodexo dining services website and allows students to contribute reviews, ratings, and photos in a social media-style interface inspired by Instagram's visual-first approach combined with Yelp's review functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, built using Vite for fast development and optimized builds
- **UI Library**: Shadcn/ui components built on top of Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with custom dark theme configuration and consistent spacing system
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Mobile-First Design**: Responsive design optimized for mobile devices with PWA capabilities in mind

### Backend Architecture
- **Server Framework**: Express.js with TypeScript for RESTful API endpoints
- **Database ORM**: Drizzle ORM for type-safe database operations and migrations
- **Session Management**: PostgreSQL session store using connect-pg-simple
- **File Structure**: Modular architecture with separate route handlers, storage abstraction layer, and web scraping service

### Data Storage Solutions
- **Database**: PostgreSQL with Neon serverless configuration
- **Schema Design**: 
  - Menu items table for scraped dining data
  - Reviews table with ratings, text, photos, and emoji reactions
  - Reports table for flagging incorrect menu information
  - Scrape runs table for tracking automated data updates
- **Type Safety**: Zod schemas for runtime validation and TypeScript type generation

### Authentication and Authorization
- **Device-Based Identification**: Simple device fingerprinting using browser headers and IP for basic spam prevention
- **No User Accounts**: Anonymous posting system with rate limiting per device
- **Content Moderation**: Flag-based system for inappropriate reviews and photos

### External Service Integrations
- **Menu Data Source**: Sodexo MyWay dining services API for MNSU location
- **Web Scraping**: Automated daily scraping of breakfast, lunch, and dinner menus
- **Image Assets**: Local asset management for meal period hero images
- **Font Integration**: Google Fonts (Inter) for consistent typography

### Design System
- **Theme**: Dark-first design with mint green accent color (#6EE7B7)
- **Component Library**: Custom component system built on Radix UI with consistent spacing and interaction patterns
- **Typography**: Inter font family with defined weight and size scales
- **Layout**: Mobile-optimized card-based interface with bottom navigation and sticky headers

The application follows a clean separation of concerns with shared schema definitions, centralized API client configuration, and modular component architecture that supports both development efficiency and production scalability.