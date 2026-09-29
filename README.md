# AttendMe

A modern, comprehensive Student Management System designed with an Apple-inspired aesthetic — quiet, obvious, fast, and dense with information.

## Overview

AttendMe serves three primary roles within an educational institution:
1. **Admins**: Manage users (teachers, students), course structures (courses, semesters, classes), subject offerings, and the master timetable.
2. **Teachers**: View their assigned classes, timetable, manage assessments, publish marks, post events (assignments, exams), and most importantly, mark daily attendance.
3. **Students**: View their personal timetable, track their attendance across subjects (with "can miss X more" tracking), view published marks, and stay on top of upcoming events.

## Tech Stack

This project is a modern, full-stack monorepo built using `pnpm`:

### Backend (`apps/server`)
- **Node.js + Express** (TypeScript)
- **MongoDB** with Mongoose
- **Zod** for schema validation
- **JWT** (access and refresh tokens) for authentication
- Module-based architecture grouping related logic (auth, users, courses, attendance, etc.)

### Frontend (`apps/web`)
- **React 18** (Vite + TypeScript)
- **Tailwind CSS** (utilizing a custom CSS-variable driven design system)
- **TanStack Query (React Query v5)** for API data fetching and caching
- **React Router** for role-based navigation
- **React Hook Form** + Zod for client-side forms
- **Lucide React** for beautiful, consistent iconography

### Shared (`packages/shared`)
- TypeScript types and Enums shared between frontend and backend.

## Key Features

- **Robust Data Consistency**: Timetables are dynamic, but attendance records use daily generated snapshots (`ClassSession`). Modifying the timetable does not alter historical attendance records.
- **Apple-Inspired UI**: No gradients, no glass-morphism. Clean lines, large legible typography, tabular numbers, subtle micro-animations, and high information density.
- **Role-Based Access Control**: Secure routes on the backend. Frontend handles role-based routing (Admin, Teacher, Student dashboards).
- **Responsive Design**: Mobile-first consideration (especially the Teacher take-attendance screen which is optimized for one-handed bulk entry).

## Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- `pnpm` (`npm install -g pnpm`)
- MongoDB (local or Atlas)

### Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Environment Variables**:
   Create an `.env` file in `apps/server/`:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/attendme
   JWT_SECRET=your_super_secret_key_here
   JWT_EXPIRES_IN=1h
   JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
   JWT_REFRESH_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:5173
   ```

3. **Seed the Database**:
   The seed script populates the database with realistic sample data, including an admin, teachers, students, a course structure, subject offerings, and a fully populated timetable.
   ```bash
   cd apps/server
   pnpm seed
   ```

4. **Start the Development Servers**:
   Run the dev script from the root to start both backend and frontend concurrently:
   ```bash
   pnpm dev
   ```

   - **Web App**: `http://localhost:5173`
   - **API Server**: `http://localhost:5000`

### Test Accounts (from seed data)

- **Admin**: `admin@attendme.edu` / `admin123`
- **Teacher**: `suresh@attendme.edu` / `teacher123`
- **Student**: `ananya@student.attendme.edu` / `student123`
