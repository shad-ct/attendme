# UI/UX Handoff — Product Constraints

This is NOT the visual design specification. Visual UI/UX will be designed separately in Claude using `CLAUDE-UI-UX-PROMPT.md`.

The implementation agent should treat these as functional constraints that the final UI must satisfy.

## Student UI constraints

Mobile-first.

The student should be able to answer these questions immediately:
- What classes do I have today?
- What is my next class?
- What is my attendance?
- What work/exams are coming up?
- What changed recently?

Avoid large admin-style tables on mobile unless a list absolutely requires tabular representation.

Suggested primary navigation:
- Home
- Timetable
- Academics
- Notifications
- Profile

## Teacher UI constraints

Mobile-first and speed-oriented.

The teacher should be able to:
- See today's classes immediately.
- Open attendance for a scheduled session quickly.
- Mark a class in a small number of interactions.
- Enter/publish marks without navigating through unnecessary setup screens.
- Create assignments/exams from the subject context.

Suggested primary navigation:
- Home
- Classes
- Timetable
- Events
- Profile

## Admin UI constraints

Laptop/desktop-first.

Optimize for:
- Information density
- Search
- Filters
- Bulk actions
- Inline editing
- Multi-column tables
- Side panels/modals
- Timetable grid editing
- Fast navigation across large academic datasets

Admin does not need to be optimized primarily for small screens. A reasonable responsive fallback is still required.

## Timetable UI constraints

The timetable must be editable as a table/grid.

Admin should not need to create every cell through a multi-page wizard.

Preferred interactions:
- Click cell
- Edit assignment
- Save cell or save batch
- Bulk changes
- Duplicate/copy rows or days if useful

Student and teacher timetable views should be generated from the same authoritative data.

## Accessibility

Keyboard navigation should work on desktop admin tables.

Buttons need clear labels.

Do not encode critical meaning by color alone.

Tables and forms should remain usable at common laptop resolutions.

## Empty/loading/error states

Every major screen needs explicit states for:
- Loading
- Empty
- Error
- No permission
- No upcoming items

Do not leave blank white screens.

## Performance

Avoid fetching the whole institution dataset for a single dashboard.

Use pagination for large admin lists.

Use server-side filtering/search for large datasets.

Use optimistic UI only where it does not create academic-data inconsistency.
