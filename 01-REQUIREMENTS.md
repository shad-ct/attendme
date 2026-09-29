# Functional Requirements

## 1. Academic structure

Admin can create and manage:
- Courses/programs, e.g. FYIMP, MSc
- Semesters, e.g. Sem 5, Sem 3
- Classes within a semester
- Subjects
- Teacher assignments
- Student membership in classes

Recommended relationship:

```text
Course 1 ── * Semester
Semester 1 ── * Class
Class * ── * Student
Class 1 ── * SubjectOffering
Subject 1 ── * SubjectOffering
SubjectOffering * ── * Teacher
```

A `SubjectOffering` represents a subject being taught to a specific class in a specific academic context. This avoids ambiguity when the same subject exists in multiple classes.

## 2. Accounts

### Admin
Admin-created only.

### Teacher
Admin creates the account and assigns classes/subjects.

### Student
Admin creates the account and assigns the student to a class.

No public registration endpoint should exist.

## 3. Permissions

### Admin
Full CRUD and administrative control over all academic records.

Can:
- Create/edit/deactivate users
- Create/edit/archive courses, semesters and classes
- Assign students to classes
- Create subjects
- Assign subjects to classes
- Assign teachers to subject offerings
- Create/edit timetable
- View and correct attendance
- View/edit marks where policy permits
- Create/edit/publish events
- Create announcements
- Manage notifications
- Inspect audit logs

### Teacher
Can access only records connected to classes and subject offerings assigned to that teacher.

Can:
- View assigned classes
- View own timetable
- View assigned subject offerings
- Mark attendance
- Edit attendance within configured rules
- Enter marks / CE for assigned subject offerings
- Create assignments, exams and other events for assigned subject offerings
- Publish announcements for allowed classes/subjects
- Export permitted attendance/marks data

Cannot:
- Create student accounts
- Create teacher accounts
- Assign themselves subjects
- Access unrelated classes
- Change global academic structure

### Student
Can access only their own academic context.

Can:
- View profile
- View class timetable
- View attendance
- View marks / CE
- View assignments/events
- View exams
- View announcements
- View notifications

Cannot:
- Change attendance
- Change marks
- Change timetable
- Create academic events
- View another student's private academic data

## 4. Attendance

Attendance is recorded per individual class/period.

A concrete attendance record should represent:
- Class
- Subject offering
- Timetable slot / class session
- Date
- Student
- Status
- Recorded by
- Created/updated timestamps

Recommended statuses:
- PRESENT
- ABSENT
- LATE
- EXCUSED

The exact institution policy can later decide whether all statuses count toward the attendance denominator.

Teacher workflow:
1. Open today's classes.
2. Select a session.
3. See the enrolled student list.
4. Mark present/absent quickly, preferably with a bulk `Mark all present` action.
5. Correct individual students if necessary.
6. Save/publish attendance.

Student views:
- Overall attendance percentage
- Per-subject attendance percentage
- Session/history list

Attendance percentage:

```text
attendance % = qualifying present sessions / qualifying conducted sessions × 100
```

Do not hard-code an attendance warning threshold until the institution provides the rule. Keep the threshold configurable.

## 5. Marks / CE

Teachers can create and manage assessment components for assigned subjects.

Example:
- CE 1 — 15 marks
- Assignment 1 — 10 marks
- Internal Exam — 30 marks

Each assessment should support:
- Title
- Type
- Subject offering
- Date
- Maximum marks
- Optional weightage
- Description
- Draft/published state

Marks belong to a student + assessment.

Students see marks only after the teacher/admin publishes them.

Recommended lifecycle:

```text
DRAFT → PUBLISHED → LOCKED
```

Locking should prevent ordinary edits while allowing a controlled admin correction workflow.

## 6. Events

Use one common event model instead of separate unrelated systems.

Event types:
- ASSIGNMENT
- EXAM
- QUIZ
- ANNOUNCEMENT
- OTHER

An event may include:
- Title
- Type
- Class
- Subject offering (optional for general announcements)
- Description
- Event date
- Due date (for assignments)
- Expected/max marks (optional)
- Publish state
- Created by

Example:

```text
DBMS Internal Exam
Date: 2026-10-15
Expected marks: 30
Description: Modules 1–4
```

No file attachments.

## 7. Exams

An exam event should support:
- Subject
- Class
- Date
- Start time
- End time or duration
- Description/instructions
- Maximum/expected marks if applicable

Room is intentionally omitted from v1.

Students receive an upcoming-exam view.

## 8. Timetable

There should be one authoritative timetable dataset.

Admin maintains it.

The timetable feeds:
- Class timetable
- Student timetable
- Teacher timetable
- Attendance session context

Each timetable entry should support:
- Class
- Subject offering
- Teacher
- Day of week
- Start time
- End time
- Optional label such as BREAK if the product later needs it
- Active/inactive state

The admin timetable editor must be table/grid based and editable.

Example:

| Time | Monday | Tuesday | Wednesday | Thursday | Friday |
|---|---|---|---|---|---|
| 09:00–09:50 | DBMS | OS | Physics | DBMS | DSA |
| 10:00–10:50 | OS | DSA | DBMS | Maths | Physics |

Avoid storing independent copies of the same timetable for students and teachers. Generate their views from the same source records.

## 9. Notifications

At minimum support in-app notifications for:
- New assignment
- New exam
- Timetable change
- Marks published
- Announcement
- Important attendance warning

Browser push can be layered on top of the same notification/event model.

Notifications should have:
- Recipient
- Type
- Title
- Message
- Related entity reference
- Read/unread state
- Created time

## 10. Export

Teachers must be able to export permitted data, especially:
- Attendance
- Marks
- Student lists

Export is data output only; no uploaded file storage is required.

CSV is an appropriate first export format.

## 11. Search/filtering

Admin needs global search and filters across:
- Students
- Teachers
- Courses
- Semesters
- Classes
- Subjects
- Events

Teacher needs focused search within their permitted students/classes.

## 12. Audit logging

Audit logs should cover important mutations such as:
- Attendance changes
- Mark changes
- Account role changes
- Student-class assignment changes
- Teacher-subject assignment changes
- Timetable changes
- Event publication/editing

An audit record should capture actor, action, entity, timestamp, and enough before/after information to explain the change.
