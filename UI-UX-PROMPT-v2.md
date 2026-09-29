# Design Brief: Student Management System

You're the lead product designer on this. I want you to design the whole interface, and I want it to feel like something Apple would ship for a college: quiet, obvious, fast. Nothing shows off. Every screen does one job and gets out of the way.

The backend and product spec already exist in the attached Markdown files. Treat them as fixed. Don't change the domain model, and don't add file uploads, messaging, LMS features, or new modules. Your job is the interface only. No backend code.

---

## 1. The feeling I'm after

Think of the Apple apps people actually enjoy using: Weather, Calendar, Notes, Wallet, Health, Settings. Now imagine a college system built with that discipline.

- **Calm.** Lots of whitespace. One thing per row of attention. No screen should feel busy.
- **Obvious.** A first-year student who has never seen the app should know what to tap without a tutorial.
- **Quick.** The common thing takes one or two taps. Never three.
- **Confident.** Big readable type, clear hierarchy, decisions already made for the user.
- **Honest.** Data is shown plainly. No decorative charts, no fake "insights", no gamification.

If a design choice exists only to look impressive, cut it.

## 2. It must not look AI-generated

This matters a lot. I've seen a hundred generated dashboards and they all look the same. Avoid every one of these tells:

- Purple-to-blue gradients, glowing blobs, mesh backgrounds
- Glassmorphism and frosted cards stacked on cards
- Emoji as icons or as decoration in headings
- Rounded cards inside rounded cards inside rounded cards
- Every card with a colored icon in a tinted circle
- Stats grids of four identical KPI tiles at the top of every page
- Generic hero copy like "Welcome back! Here's your overview 🚀"
- Placeholder names like "John Doe", "Lorem ipsum", "Acme"
- Shadows on everything
- Six accent colors fighting each other
- Illustrations of people holding giant phones

Instead:

- Use **real content**. Realistic Indian college data: names like Ananya Nair, Rahul Menon, Fathima Rasheed; subjects like DBMS, Operating Systems, Data Structures, Engineering Mathematics; teachers like Dr. Suresh Kumar; classes like "B.Tech CSE · Sem 4 · Div A"; times like 09:00–09:50. Write empty states and errors the way a thoughtful person would, in plain short sentences.
- Let **typography and spacing** do the work that borders, shadows and colored boxes usually do. Group with whitespace first, hairline dividers second, containers last.
- Prefer **lists and rows** over cards. Apple's Settings and Mail are lists. Use cards only when something is a self-contained object (the "next class" hero, for example).
- Write microcopy in a **human voice**: short, warm, never cute. "No classes today." not "You're all caught up! 🎉"

## 3. Visual language

Be specific here. Give me exact values, not adjectives.

**Typeface.** System UI stack, so it renders as SF Pro on Apple devices and stays native elsewhere:
`-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Segoe UI", system-ui, sans-serif`. Define a type scale (Large Title, Title, Headline, Body, Callout, Subhead, Footnote, Caption) with size, weight, line-height and letter-spacing for mobile and desktop. Body on mobile must never be below 16px. Use tabular numerals for anything numeric: attendance percentages, marks, times.

**Color.** A neutral system with **one** accent.
- Neutrals: define the light-mode and dark-mode grays (background, grouped background, elevated surface, separator, secondary text, tertiary text).
- One accent color for interactive elements. Pick it deliberately and justify it in one sentence. A calm blue in the spirit of iOS is fine; something more distinctive is fine too if it stays calm.
- Semantic colors only for state: green (present / good), red (absent / destructive / error), amber (warning / low attendance / late), and a neutral for "not marked". Each semantic color needs a text-safe variant that passes contrast.
- Never communicate state by color alone. Pair it with an icon, a label or a shape.
- Give hex values, and confirm contrast ratios for text on each surface.

**Shape and depth.**
- One corner-radius system (for example 8 / 12 / 20) applied consistently. Continuous, soft corners.
- Almost no shadow. Depth comes from surface color, blur only on the tab bar and sheets, and separators.
- Hairline dividers (0.5px on retina) inset from the left edge, like iOS lists.

**Icons.** One line-icon set with consistent stroke weight (SF Symbols style). Icons support labels, they don't replace them.

**Motion.** Quick and physical. 200–350ms, ease-out for entering, ease-in for leaving, gentle spring for sheets. Sheets rise from the bottom on mobile. Lists animate items in and out (a marked student doesn't teleport). Respect `prefers-reduced-motion`. Specify durations and easings as tokens.

**Feedback.** Every tap acknowledges itself: pressed state, subtle scale or highlight. Success is a quiet checkmark or a brief toast, not a confetti moment. Suggest where haptics would fire on mobile (attendance toggle, save success, destructive confirm).

**Dark mode.** Fully designed, not inverted. True elevated surfaces, dimmed accent, checked contrast.

## 4. Who uses this, and what each one is here to do

Three roles with three completely different jobs. **Do not give them the same dashboard.**

> Student = glance and understand.
> Teacher = act quickly.
> Admin = manage lots of structured data efficiently.

### Student (mobile-first)

Question the home screen answers: **"What do I need to know today?"**

Priority order on Home:
1. Next class, or today's classes if it's the morning (room, time, teacher, "in 25 min")
2. Attendance at a glance (one number, one status word, one small visual)
3. Upcoming assignments and exams (the next few, with due dates)
4. Latest marks or announcements
5. Notifications entry point

Students only ever see their own data.

Screens to design: Home, Timetable, Attendance, Academics/Marks, Upcoming, Notifications, Profile.

Attendance needs two layers: a glanceable summary up front (overall %, per-subject %, a clear "safe / borderline / low" state that isn't only color), and history one tap deeper (month calendar view and per-subject list). Include a plain-language line like "You can miss 3 more classes in DBMS and stay above 75%." only if it can be derived from data in the spec; otherwise leave it out and tell me.

### Teacher (mobile-first)

Home shows **today's classes**, and nothing competes with them. A class leads directly to:

`Class → Subject → Take Attendance`

Attendance is the single most important interaction in the whole product. It has to be doable one-handed, in under 30 seconds for a class of 60, standing in a corridor. Design for:
- Full roster, easy to scan
- "Mark all present" as the primary starting move, then flip the exceptions
- Large tap targets (minimum 44×44pt), and spacing that prevents accidental taps
- An obvious state for each student: present, absent, (late/on-duty only if the spec has them), and not yet marked
- Live count ("54 present · 6 absent") pinned where the thumb can see it
- Clear draft vs saved vs published state, and a single sticky primary action
- Safe undo. An accidental swipe or tap should be reversible without a dialog.
- Handling for a class that was already marked, and for edits after publishing (if the spec allows)

Also design: assigned classes/subjects, marks entry, creating assignments and exams from a subject, and announcements/events.

Marks entry is a **compact grid**, not a multi-step form. Think spreadsheet-fast: student rows, one score field, keyboard "next" moves down the list, inline validation against max marks, visible unsaved state, one save action.

### Admin (desktop-first)

A serious workspace with high information density and a clear hierarchy. Still calm. Think Finder, Numbers and Xcode's organizer more than a typical enterprise admin template.

Must include:
- Left sidebar navigation (collapsible), grouped sensibly
- Global search with command-palette behavior (⌘K / Ctrl+K)
- Breadcrumbs
- Dense but readable tables: sticky header, sortable columns, column visibility, filters, saved filter views, pagination, row selection, bulk actions
- Inline editing only where it's safe. Anything risky opens a side drawer.
- Side drawers for detail and edit, so the admin never loses their place in the table
- Strong confirmation for destructive actions (type-to-confirm for the truly dangerous ones, and say exactly what will be affected)
- Clear status chips
- Audit information: who changed what and when, readable

Admin manages: Courses, Semesters, Classes, Students, Teachers, Subjects, teacher assignments, student-class assignments, Timetables, Attendance, Marks, Events, Announcements, Notifications, and Audit log.

Admin degrades gracefully to tablet and phone: tables scroll horizontally with a sticky first column, drawers become full-screen sheets, and the sidebar becomes a menu.

## 5. The admin timetable

This is a real, editable grid. Not a list of forms.

| Time | Mon | Tue | Wed | Thu | Fri |
|---|---|---|---|---|---|
| 09:00–09:50 | DBMS | OS | Physics | DBMS | DSA |
| 10:00–10:50 | OS | DSA | DBMS | Maths | Physics |

Design in detail:
- A class/division selector at the top. Switching should feel instant.
- Cells show subject (bold), teacher (secondary), room (tertiary) in a compact, legible way
- Click a cell to edit in a small popover: searchable subject picker, teacher auto-filtered to those assigned to that subject, room
- Keyboard navigation between cells (arrows, Enter to edit, Esc to close, Delete to clear)
- Copy, paste and duplicate: a cell, a row, a whole day
- Drag to move or swap, with a clear drop indicator
- Live conflict detection: teacher double-booked, room clash, teacher not assigned to the subject. Show the conflict in the cell (icon + text, not just red) and explain it in a short sentence with a way to fix it.
- Explicit dirty state: changed cells marked, a "12 unsaved changes" bar, bulk Save and Discard, and a confirmation if leaving with unsaved edits
- Breaks and free periods
- A "view by teacher" and "view by room" mode, read-only if that's simpler

Students and teachers see the **same data** in simple read-only views built for phones: a day-at-a-time list with a week strip at the top. No grid on mobile.

## 6. Required states

For every meaningful screen, design all of these, not just the happy path:

- **Loading:** skeletons shaped like the real content. No spinners on full pages.
- **Empty:** one honest sentence, and the next action if the user can take one.
- **Error:** what happened, in plain words, and a retry.
- **Permission denied:** calm and specific about why, and where to go instead.
- **Success:** quiet confirmation.
- **Nothing upcoming:** a state that reads as good news, not as a broken screen.
- **Offline / slow connection** for teacher attendance, since classrooms have bad signal. Say what happens to unsaved data.

Write the actual copy for each.

## 7. Accessibility (non-negotiable)

- Semantic HTML: real buttons, real links, real tables, proper landmarks and heading order
- WCAG AA contrast minimum, AAA for body text where feasible
- Visible focus rings that are designed, not the browser default
- Full keyboard access on desktop, including the timetable grid and the command palette
- Labels on every input, no placeholder-only fields
- Touch targets at least 44×44pt
- Status never by color alone
- Support Dynamic Type / browser text scaling up to 200% without breaking layouts
- `prefers-reduced-motion` and `prefers-color-scheme` honored
- Screen reader behavior specified for attendance toggling ("Ananya Nair, present, button, 12 of 60") and for live counts

## 8. What to deliver

A complete UI/UX specification a frontend developer can build from without guessing. Organize it like this:

1. **Design principles** (short, opinionated, no more than eight)
2. **Information architecture** per role
3. **Navigation model** per role (bottom tab bar for student and teacher, sidebar for admin, with the exact tabs and why)
4. **Design tokens**: color, type, spacing (use a 4pt base), radius, elevation, motion, as a table and as ready-to-paste CSS custom properties, for light and dark
5. **Student screens**: layout, content, hierarchy, interactions, states
6. **Teacher screens**: same
7. **Admin screens**: same
8. **Timetable interaction design**
9. **Attendance interaction design** (teacher take-attendance flow and student view)
10. **Marks-entry interaction design**
11. **Event / assignment / exam creation flow**, started from within a subject
12. **Notification UX**: center, unread state, grouping, deep links, what deserves a push versus what stays in the list
13. **Responsive behavior**: breakpoints, what reflows, what collapses, what changes form
14. **Component inventory**: buttons, list rows, segmented controls, sheets, toasts, chips, tables, drawers, pickers, and so on, each with variants and states
15. **Form and table patterns**
16. **Empty / loading / error states** with actual copy
17. **Accessibility rules** (from section 7, made concrete)
18. **Example user journeys**, step by step, at least these:
    - A student checks what's next at 8:45 on a Monday
    - A teacher walks from the corridor into a classroom and takes attendance for 58 students, with two absent
    - A teacher enters internal marks for a whole class
    - An admin builds a new timetable for a semester and resolves two conflicts
    - An admin bulk-assigns 40 students to a class
    - An admin makes a mistake and recovers from it

For the main screens (student Home, teacher Home, Take Attendance, marks grid, admin table view, admin timetable), also give an **ASCII wireframe or a clear layout description** with measurements so the structure is unambiguous.

## 9. How to write the spec

- **Commit to decisions.** Don't give me "you could do A or B." Pick one, say why in a line, and move on. If something truly needs my input, list it at the end under "Open questions."
- **Be specific.** "16px, semibold, 24px line height" beats "medium-sized heading."
- **Explain the why briefly** wherever a choice isn't obvious, so the developer understands the intent and can make good calls in cases you didn't cover.
- **No filler.** No introductions about the importance of good design, no motivational paragraphs, no summary that repeats what I just read.
- **Plain language.** Write like a senior designer handing work to a developer they respect.
- Use tables where comparison helps and prose where reasoning helps. Don't turn everything into bullet fragments.
- If the attached spec is missing something you need (for example, whether late or on-duty attendance statuses exist, or whether marks can be edited after publishing), state your assumption clearly and flag it. Never invent features silently.

## 10. Final check before you answer

Go back through your own output and ask:

1. Could a first-time student use the home screen with zero explanation?
2. Could a teacher take attendance one-handed while walking into a room?
3. Would an admin feel fast in this, or slowed down by it?
4. Is there any decoration that isn't earning its place?
5. Does anything look like a generic AI dashboard? If yes, rework it.
6. Is any state communicated by color only?
7. Did I add anything the product spec doesn't call for?

Fix what fails, then deliver.
