# Implementation Plan

Build vertically, not by finishing every backend module before touching the frontend.

## Phase 0 — repository and foundations

Set up:
- monorepo or clearly separated `web` and `server`
- TypeScript
- linting
- formatting
- environment management
- MongoDB connection
- Railway-compatible startup scripts
- basic CI checks if available

Suggested layout:

```text
student-management-system/
  apps/
    web/
    server/
  packages/
    shared/
```

A simpler two-directory structure is also acceptable.

## Phase 1 — authentication and users

Implement:
- login
- token refresh
- logout
- current-user endpoint
- password hashing
- admin-created accounts
- role middleware

Prove that:
- student cannot reach teacher/admin routes
- teacher cannot reach admin routes
- student cannot access another student's data

## Phase 2 — academic structure

Implement:
- Course
- Semester
- Class
- Student membership
- Subject
- Subject offering
- Teacher assignment

Build admin CRUD and assignment flows.

## Phase 3 — timetable

Implement:
- TimetableEntry
- grid editor API
- conflict validation
- student timetable API
- teacher timetable API
- admin timetable editor

Create class sessions from the timetable as needed.

## Phase 4 — attendance

Implement:
- ClassSession
- AttendanceRecord
- teacher daily class list
- attendance marking UI/API
- bulk present action
- student attendance summary/history
- CSV export

## Phase 5 — marks / CE

Implement:
- Assessment
- AssessmentMark
- grade-entry grid
- draft/publish/lock lifecycle
- student marks view
- notifications on publish

## Phase 6 — events

Implement one event model for:
- assignments
- exams
- quizzes
- announcements

Create teacher authoring and student views.

## Phase 7 — notifications

Implement:
- in-app notification collection
- unread counts
- notification center
- mark read/read-all
- event-driven creation for published changes

Add browser push after the in-app model is stable.

## Phase 8 — audit and administration hardening

Implement:
- audit log
- historical membership handling
- soft deactivation
- archive behavior
- admin correction workflows

## Phase 9 — QA and polish

Test at least:
- permissions
- cross-class data leakage
- attendance edits
- mark publishing/locking
- timetable conflicts
- class changes
- notification fan-out
- pagination
- mobile responsiveness

## Definition of done for v1

A fresh admin can:
1. Create a course.
2. Create a semester.
3. Create a class.
4. Create students and teachers.
5. Assign students to the class.
6. Create subjects.
7. Assign teachers.
8. Build a timetable.

A teacher can:
1. Log in.
2. See today's timetable.
3. Mark attendance.
4. Create an assignment/exam.
5. Enter marks.
6. Publish marks.

A student can:
1. Log in.
2. See today's timetable.
3. See attendance.
4. See published marks.
5. See upcoming work/exams.
6. Receive notifications.
