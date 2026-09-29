# API and Backend Specification

## Backend principles

1. Authorization must be enforced on the server.
2. Never rely on frontend route hiding for security.
3. Teachers must be scoped to their actual assignments.
4. Students must be scoped to their current/permitted academic membership.
5. Admin has global access.
6. Validate request bodies and query parameters.
7. Return consistent error shapes.
8. Use service-layer rules instead of putting business logic directly in route handlers.
9. Keep audit logging for important mutations.
10. Keep API responses predictable for mobile and desktop clients.

## Suggested module structure

```text
server/
  src/
    config/
    middleware/
    modules/
      auth/
      users/
      courses/
      semesters/
      classes/
      subjects/
      assignments/
      timetable/
      attendance/
      assessments/
      events/
      notifications/
      audit/
    shared/
      errors/
      validation/
      permissions/
      utils/
    app.ts
    server.ts
```

## Authentication

Suggested endpoints:

```text
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me
```

No `/register` endpoint for public users.

Admin creates accounts through protected admin endpoints.

## Admin endpoints

### Users
```text
GET    /api/admin/users
POST   /api/admin/users
PATCH  /api/admin/users/:id
PATCH  /api/admin/users/:id/status
```

### Courses / semesters / classes
```text
GET    /api/admin/courses
POST   /api/admin/courses
PATCH  /api/admin/courses/:id

POST   /api/admin/semesters
PATCH  /api/admin/semesters/:id

POST   /api/admin/classes
PATCH  /api/admin/classes/:id
POST   /api/admin/classes/:id/students
DELETE /api/admin/classes/:id/students/:studentId
```

### Subjects
```text
GET    /api/admin/subjects
POST   /api/admin/subjects
PATCH  /api/admin/subjects/:id

POST   /api/admin/subject-offerings
PATCH  /api/admin/subject-offerings/:id
POST   /api/admin/subject-offerings/:id/teachers
DELETE /api/admin/subject-offerings/:id/teachers/:teacherId
```

### Timetable
```text
GET    /api/admin/timetable/classes/:classId
POST   /api/admin/timetable/entries
PATCH  /api/admin/timetable/entries/:id
DELETE /api/admin/timetable/entries/:id
POST   /api/admin/timetable/bulk-update
```

A bulk timetable endpoint is strongly recommended for grid-based editing.

### Audit
```text
GET /api/admin/audit-logs
```

## Teacher endpoints

```text
GET    /api/teacher/dashboard
GET    /api/teacher/timetable
GET    /api/teacher/classes
GET    /api/teacher/subjects

GET    /api/teacher/sessions/today
GET    /api/teacher/sessions/:sessionId/attendance
PUT    /api/teacher/sessions/:sessionId/attendance

GET    /api/teacher/assessments
POST   /api/teacher/assessments
PATCH  /api/teacher/assessments/:id
POST   /api/teacher/assessments/:id/publish
POST   /api/teacher/assessments/:id/lock
PUT    /api/teacher/assessments/:id/marks

GET    /api/teacher/events
POST   /api/teacher/events
PATCH  /api/teacher/events/:id
POST   /api/teacher/events/:id/publish

GET    /api/teacher/exports/attendance
GET    /api/teacher/exports/marks
```

All of these must enforce teacher ownership/assignment scope.

## Student endpoints

```text
GET /api/student/dashboard
GET /api/student/profile
GET /api/student/timetable
GET /api/student/attendance
GET /api/student/attendance/subjects/:subjectOfferingId
GET /api/student/assessments
GET /api/student/events
GET /api/student/notifications
PATCH /api/student/notifications/:id/read
POST /api/student/notifications/read-all
```

## Dashboard response strategy

Return aggregated dashboard data for the first screen to reduce mobile round trips.

Example:

```text
GET /api/student/dashboard
```

can include:
- today timetable
- attendance summary
- upcoming events
- unread notification count
- recently published marks

Do not make the mobile client issue 10 sequential requests for the home screen.

## Permission checks

Examples:

```text
ADMIN
  => any academic resource

TEACHER
  => subjectOffering.teacherAssignments contains currentUser
  => class is reachable through an assigned subject offering

STUDENT
  => studentProfile.currentClassId / membership grants access
```

For every protected query, apply scope conditions at database query level.

Bad:
1. Fetch every student.
2. Filter in JavaScript.

Good:
1. Derive allowed class/subject IDs.
2. Query MongoDB with those IDs.

## Error contract

Recommended format:

```json
{
  "error": {
    "code": "ATTENDANCE_SESSION_NOT_FOUND",
    "message": "Attendance session was not found or is not accessible."
  }
}
```

Use stable machine-readable codes.

## Data consistency

When a timetable entry changes:
- Future generated sessions may use the new schedule.
- Historical class sessions must remain unchanged.

When a student changes class:
- Current membership changes.
- Historical attendance and marks remain attached to the original academic context.

When an assessment is published:
- Create notifications for affected students.

When a timetable change affects students or teachers:
- Create notifications for affected users.
