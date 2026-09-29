# Core User Workflows

## Admin: create an academic class

1. Admin opens Courses.
2. Creates or selects a Course.
3. Creates/selects a Semester.
4. Creates a Class.
5. Adds students in bulk or individually.
6. Creates/selects subjects.
7. Creates subject offerings for this class.
8. Assigns teachers to each subject offering.
9. Opens Timetable.
10. Fills timetable grid.
11. Saves changes.
12. System validates obvious conflicts.
13. System publishes relevant timetable changes.

## Admin: create student account

1. Admin opens Students.
2. Clicks Create Student.
3. Enters required identity/account fields.
4. System creates the account.
5. Admin assigns the student to a class.
6. Student can now authenticate and see their academic context.

## Admin: create teacher account

1. Admin opens Teachers.
2. Clicks Create Teacher.
3. Enters required account fields.
4. System creates the account.
5. Admin assigns teacher to subject offerings.
6. Teacher can now access those subjects/classes.

## Admin: edit timetable

1. Select Course/Semester/Class.
2. Open timetable grid.
3. Click a cell.
4. Select subject/teacher/time.
5. Save.
6. Backend validates conflicts.
7. Changes become the authoritative timetable.
8. Affected students/teachers receive notifications when appropriate.

## Teacher: take attendance

1. Teacher opens dashboard.
2. Sees today's scheduled classes.
3. Opens current session.
4. Student roster loads.
5. Use `Mark all present` when appropriate.
6. Adjust individual statuses.
7. Save.
8. Attendance becomes visible in student views according to policy.

The most common teacher action should require as few interactions as practical.

## Teacher: create assignment

1. Open subject.
2. Select Add Event.
3. Choose ASSIGNMENT.
4. Enter title.
5. Enter description.
6. Set due date.
7. Optionally enter expected/max marks.
8. Publish.
9. Students in the target class receive the event and notification.

## Teacher: create exam

Same event flow, type = EXAM.

Required:
- title
- subject
- class
- date
- time/duration

Optional:
- expected/max marks
- description

## Teacher: enter marks

1. Open subject.
2. Create/select assessment.
3. See class roster in a compact grade-entry table.
4. Enter marks.
5. Save draft.
6. Publish when ready.
7. Students are notified.

## Student: morning view

Student opens app and immediately sees:
- today's timetable
- next class
- attendance summary
- upcoming assignments/exams
- unread notifications

## Student: check attendance

Student opens Attendance.

Display:
- overall percentage
- subject percentages
- recent attendance history

Do not expose other students' data.

## Student: check academics

Student opens Academics.

Display:
- subject list
- assessments
- published marks
- event deadlines

## Notification workflow

Whenever a meaningful published change occurs:
1. Determine affected users.
2. Create in-app notifications.
3. Attempt browser push if enabled.
4. Avoid duplicate notifications for repeated reads or refreshes.
