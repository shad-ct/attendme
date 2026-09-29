# Student Management System — Project Overview

## Product
A web-based student management system for an educational institution.

The system centralizes:
- Academic structure
- Student and teacher accounts
- Class and subject assignments
- Attendance
- Marks / CE
- Assignments and other academic events
- Exams
- Announcements
- Timetables
- In-app and browser notifications

The application is **text/data-first**. There are no uploaded files, document attachments, images, PDFs, videos, or file-submission workflows in the academic data model.

Normal web UI elements such as tables, cards, dialogs, calendars, icons, charts, and responsive layouts are allowed.

## Core roles
1. Admin
2. Teacher
3. Student

There is no public registration. **Admin creates every student and teacher account.**

## Main design principle
The academic class is the central unit of organization.

A simplified hierarchy is:

```text
Course
  └── Semester
       └── Class
            ├── Students
            ├── Subjects
            │    └── Teacher assignments
            ├── Timetable
            ├── Attendance
            ├── Marks / CE
            ├── Events
            └── Announcements
```

Example:

```text
FYIMP
└── Semester 5
    └── Class A
        ├── Students
        ├── DBMS → Teacher A
        ├── OS → Teacher B
        ├── DSA → Teacher C
        └── Timetable
```

## UI strategy
- Student: mobile-first.
- Teacher: mobile-first, optimized for fast actions such as attendance.
- Admin: laptop/desktop-first, feature-rich, dense and efficient.
- UI/UX visual design is intentionally delegated to a separate Claude prompt in `CLAUDE-UI-UX-PROMPT.md`.

## Proposed stack
Frontend:
- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query

Backend:
- Node.js
- Express
- TypeScript
- Mongoose
- Zod for input validation

Database:
- MongoDB

Deployment:
- Railway

Authentication:
- JWT access tokens + refresh tokens
- Role-based authorization

Notifications:
- In-app notification records
- Web Push / browser notifications as a second layer

## Non-goals for v1
- File uploads
- Student self-registration
- Teacher self-registration
- Assignment file submission
- Complex LMS features
- Built-in video calls
- Chat/messaging system
- Hostel/library/fee management unless added later

## MVP order
1. Authentication and role authorization
2. Admin academic structure management
3. Student and teacher account management
4. Subjects and teacher assignments
5. Timetable management
6. Teacher attendance
7. Student attendance views
8. Marks / CE
9. Events: assignments, exams, announcements
10. Notifications
11. Audit logging and hardening
12. Responsive polish and performance tuning
