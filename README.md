# Deeper Attendance

Build an attendance tracking app for Deeper Life Bible Church, Pontypridd, using Supabase for authentication and database.



Branding

This app is for Deeper Life Bible Church, Pontypridd — include the church name on the login screen and header. Give it a fully custom, next-generation brand identity rather than a generic admin template — modern, warm, and premium, reflecting the “Deeper Life” name (a sense of depth, roots, going below the surface). Choose a distinctive color palette and typography that fit this identity, avoid generic stock church imagery (stained glass, doves, crosses as icons), and design the UI to feel fresh and intentional rather than like a default dashboard.



User roles



	•	Admin: full access — manages members, creates and manages Attendance-taker accounts (sets username/password for them), takes attendance, views all reports and analysis.

	•	Attendance-taker: can take attendance and view reports, but cannot manage members or create other users.



Members



	•	Fields: name, contact info, category (Adult / Young Adult / Youth / Child), optional guardian link.

	•	Any member can be a standalone Adult. Young Adult, Youth, and Child can optionally be linked to a guardian (an Adult member), forming a family unit.

	•	Members list displayed grouped by household — each Adult shown as a card with dependents nested/collapsible underneath — rather than one flat list. Include a search bar to find any member quickly, and an “Add Member” flow with an optional searchable “link to guardian” field for dependents.



Services



	•	Two types: Recurring (e.g. a weekly recruitment service, repeats on a schedule) and One-off (single event, specific date).

	•	Admin or Attendance-taker can create a new service instance (pick type, date, name).



Taking attendance



	•	Checklist of members for the selected service, grouped by family for easy scanning.

	•	One tap to mark a whole family Present/Absent at once, or expand the family to mark individuals separately.

	•	Simple Present/Absent toggle per person, with a clear “Submit Attendance” action.

	•	Prioritize speed and minimal taps — this happens in real time during a live service, mobile-friendly, big touch targets, no unnecessary confirmation dialogs.



Service overview (shown right after submitting)



	•	Total present, total absent, attendance percentage.

	•	List of absentees (and which families they belong to).



Monthly analysis dashboard



	•	Attendance trend over the selected month, viewable by: individual member, family/household, and service type (recurring vs one-off).

	•	Simple charts (bar or line) showing trend over time and comparison across service types.

	•	Highlight members/families with notably low attendance or absentee streaks.



Database structure (Supabase)



	•	users: id, username, password (hashed via Supabase auth), role (admin/attendance_taker), name

	•	members: id, name, contact, category, guardian_id (nullable, self-referencing FK to members)

	•	services: id, name, type (recurring/one_off), date

	•	attendance_records: id, service_id, member_id, status (present/absent), timestamp



Priorities



	•	Built to scale later (more roles, categories, or reporting) without needing a redesign now.

	•	Clean, uncluttered UI throughout — every screen should feel effortless to use during a live, busy service.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cd964fca-b806-486c-ad67-7456164e3ba4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
