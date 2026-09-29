# Antigravity Implementation Instructions

## Mission
Build the Student Management System described by the Markdown specifications in this folder.

Read all specification files before implementing anything.

Do not invent a different product. When a detail is intentionally left open, choose the simplest implementation consistent with the specifications and document the decision.

## Priority order

1. Correct permissions and data isolation
2. Correct academic relationships
3. Reliable attendance/marks history
4. Clean API contracts and validation
5. Responsive implementation
6. Performance
7. Visual polish

Visual direction is delegated to Claude. Preserve the functional UI constraints in `05-UI-HANDOFF.md`, but do not spend excessive effort inventing a visual language if a Claude-produced design specification is available.

## Engineering rules

- Use TypeScript.
- Keep frontend and backend responsibilities clear.
- Enforce authorization on the backend.
- Validate all external input.
- Avoid duplicated sources of truth.
- Do not store files or binary attachments.
- Prefer reusable services/components over copy-paste.
- Keep academic history immutable where practical.
- Do not rewrite historical attendance because of timetable changes.
- Use indexes for frequent queries.
- Add pagination to potentially large admin lists.
- Never fetch all users just to filter them on the client.

## Important permission rule

A teacher must only access a class through an actual teacher-to-subject-offering assignment.

A student must only access data belonging to their permitted class/academic membership.

Every controller/service that exposes academic data must apply those scopes.

## Important timetable rule

There must be one authoritative timetable dataset.

Do not create a separate manually maintained timetable collection for students and another for teachers.

## Important attendance rule

Attendance must reference a concrete class session so historical records do not change merely because today's timetable is edited.

## Important account rule

There is no public registration flow. Only an authorized admin can create student and teacher accounts.

## Delivery style

Implement incrementally.

At the end of each meaningful phase:
- run tests/type checks
- verify authorization
- summarize changed files
- document any assumptions

Do not silently change the data model because a frontend screen is inconvenient. Fix the domain/API design instead.

## First implementation task

Before large-scale coding:
1. Read all `.md` specification files.
2. Produce a short implementation checklist.
3. Set up the repository.
4. Implement authentication + roles + admin-created accounts first.
5. Add seed data for one realistic course, semester, class, subjects, teachers, and students.
6. Demonstrate that permission boundaries work.

Then continue through the implementation phases.
