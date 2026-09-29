# Domain Model and MongoDB Design

This document defines the recommended domain entities. Implement references explicitly; avoid embedding large, frequently-changing academic collections inside unrelated documents.

## Core entities

### User
Common account record.

Fields:
- `_id`
- `role`: ADMIN | TEACHER | STUDENT
- `name`
- `email` or institution username
- `passwordHash`
- `isActive`
- `createdAt`
- `updatedAt`

Role-specific information should be stored in a predictable way. A simple v1 can keep all role profiles in `User` with optional fields, or use `TeacherProfile` / `StudentProfile` if the data grows.

### StudentProfile
- `userId`
- `studentId` / register number
- `currentClassId`
- optional phone/contact fields
- status

### TeacherProfile
- `userId`
- employee/staff identifier if available
- optional contact fields
- status

### Course
Examples: `FYIMP`, `MSc`.

Fields:
- `name`
- `code` optional
- `description` optional
- `isActive`

### Semester
- `courseId`
- `name` or number
- `academicYear`
- `sequence`
- `isActive`

Example: `FYIMP / Sem 5 / 2026-27`.

### Class
Represents a concrete student group inside a semester.

Fields:
- `semesterId`
- `name` e.g. `A`
- `label` optional e.g. `FYIMP S5 A`
- `isActive`

### StudentClassMembership
Use a separate membership collection if historical class changes are important.

Fields:
- `studentId`
- `classId`
- `startDate`
- `endDate` optional
- `isCurrent`

This preserves historical movement without destroying old academic records.

### Subject
Master subject definition.

Fields:
- `code`
- `name`
- `credits` optional
- `type` optional
- `isActive`

### SubjectOffering
A subject taught to a particular class.

Fields:
- `subjectId`
- `classId`
- `academicYear` / inherited context
- `semesterId`
- `isActive`

### SubjectTeacherAssignment
Links teacher(s) to a subject offering.

Fields:
- `subjectOfferingId`
- `teacherId`
- `startDate`
- `endDate` optional
- `isPrimary` optional

This supports the same subject being taught by different teachers in different classes.

### TimetableEntry
Authoritative timetable record.

Fields:
- `classId`
- `subjectOfferingId`
- `teacherId`
- `dayOfWeek`
- `startTime`
- `endTime`
- `isActive`

Index heavily by class/day and teacher/day.

### ClassSession
A concrete scheduled occurrence used for attendance.

Fields:
- `timetableEntryId`
- `classId`
- `subjectOfferingId`
- `teacherId`
- `date`
- `startTime`
- `endTime`
- `status`: SCHEDULED | COMPLETED | CANCELLED

Creating explicit session records is useful because timetable changes should not rewrite historical attendance.

### AttendanceRecord
Fields:
- `classSessionId`
- `studentId`
- `status`
- `markedBy`
- `markedAt`
- `updatedAt`

Unique index:
`classSessionId + studentId`

### Assessment
Represents CE, assignment marks, internal exam marks, etc.

Fields:
- `subjectOfferingId`
- `classId`
- `title`
- `type`
- `date`
- `maxMarks`
- `weightage` optional
- `description` optional
- `status`: DRAFT | PUBLISHED | LOCKED
- `createdBy`
- timestamps

### AssessmentMark
Fields:
- `assessmentId`
- `studentId`
- `marks`
- `enteredBy`
- timestamps

Unique index:
`assessmentId + studentId`

### Event
General academic event.

Fields:
- `type`
- `title`
- `classId`
- `subjectOfferingId` optional
- `description`
- `eventDate`
- `dueDate` optional
- `expectedMarks` optional
- `publishAt` optional
- `status`: DRAFT | PUBLISHED | ARCHIVED
- `createdBy`
- timestamps

### Announcement
Can either be a specialized collection or represented as `Event(type=ANNOUNCEMENT)`. Prefer the common Event model unless requirements force richer announcement-specific behavior.

### Notification
Fields:
- `recipientUserId`
- `type`
- `title`
- `message`
- `entityType` optional
- `entityId` optional
- `readAt` optional
- `createdAt`

### AuditLog
Fields:
- `actorUserId`
- `action`
- `entityType`
- `entityId`
- `before` optional
- `after` optional
- `metadata` optional
- `createdAt`

## Relationship summary

```text
User
 ├── StudentProfile ── StudentClassMembership ── Class
 └── TeacherProfile ── SubjectTeacherAssignment ── SubjectOffering

Course ──< Semester ──< Class
Subject ──< SubjectOffering >── Class
SubjectOffering ──< SubjectTeacherAssignment >── Teacher
SubjectOffering ──< TimetableEntry >── Class
TimetableEntry ──< ClassSession
ClassSession ──< AttendanceRecord >── Student
SubjectOffering ──< Assessment ──< AssessmentMark >── Student
Class ──< Event
SubjectOffering ──< Event (optional)
User ──< Notification
User ──< AuditLog
```

## Important historical-data rule
Do not derive historical attendance from the current timetable alone. Once an attendance session occurs, preserve that session and its subject/teacher/class references.

Likewise, semester/class membership changes must not silently move old academic records to a new class context.
