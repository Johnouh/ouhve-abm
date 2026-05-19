# OUHVE ABM Gym Management System

## Overview
OUHVE ABM is a full-stack gym management system designed to streamline operations for gym owners and staff. It provides comprehensive features for managing members, staff, products, lockers, classes, and consultations. The system aims to be a robust, scalable, and user-friendly solution for modern gym facilities, enhancing efficiency and improving the overall member experience.

## User Preferences
Preferred communication style: Simple, everyday language.
Code documentation: Korean/English bilingual comments required for all pages.
UI replication requirement: Exact design implementation ("똑같이") - zero tolerance for design deviations.
Security priority: Complete data isolation between user accounts is critical.
Deployment preference: User requested comprehensive testing and analysis before deployment.
Popup design preference: All future popups should follow the custom design pattern with backdrop blur matching provided design image.
UI consistency requirement: List designs and text-based anchor tags should maintain consistent button-like styling across all components.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, Vite
- **UI/UX**: shadcn/ui components (Radix UI, "new-york" style), Tailwind CSS (custom gym-themed color palette #FF6B35), Lucide React icons, Inter font
- **State Management**: TanStack Query (server state), React hooks (local state)
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

### Backend
- **Runtime**: Node.js with TypeScript, Express.js
- **Authentication**: Passport.js (local strategy with scrypt hashing), Express sessions (PostgreSQL store)
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (configured for Neon serverless)
- **API**: RESTful design, centralized error handling, custom request logging, CORS enabled
- **Security**: Secure session management, CSRF/XSS protection, input validation, SQL injection prevention, role-based access control (admin, staff, member), franchise-based data isolation
- **Scalability**: PostgreSQL session store, database indexing, performance monitoring

### Key Features & Design Patterns
- **Authentication**: Local username/password, scrypt hashing, server-side sessions with PostgreSQL persistence, client-side route protection.
- **Data Isolation**: Franchise_id based data isolation across all critical tables (members, staff, products, lockers, group_lessons, attendance, personal_training, consultations) ensuring user-specific independent data spaces.
- **Database Schema**: Type-safe schema with Zod validation, Drizzle migrations for management.
- **Data Flow**: React Query for server state management and caching, custom API client, error boundaries, optimistic updates.
- **Modularity**: Separation of concerns between frontend and backend, clear component responsibilities.
- **Error Handling**: Global error handling, structured logging, user-friendly messages, retry mechanisms.
- **Optimization**: React Query caching, memoization, debounced search inputs, database indexing.

## External Dependencies

### Core Application
- `@neondatabase/serverless`: PostgreSQL connection for Neon
- `drizzle-orm`: Type-safe database operations
- `express`: Web application framework
- `passport`: Authentication middleware
- `react`: UI library
- `@tanstack/react-query`: Server state management

### UI/Component Libraries
- `@radix-ui/*`: Accessible UI primitives
- `tailwindcss`: Utility-first CSS framework
- `lucide-react`: Icon library
- `react-hook-form`: Form state management
- `zod`: Runtime type validation

### Development Tools
- `vite`: Build tool and dev server
- `typescript`: Type checking
- `drizzle-kit`: Database migration tool
- `tsx`: TypeScript execution for development