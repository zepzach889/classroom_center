# Classroom Suite

A set of classroom tools that share one set of classes, tables, and rosters: a dashboard with the bell schedule, a Today screen that runs class from the projector, a weekly planner, table points, seating charts, and tools for picking students, grouping, timing, and record-keeping.

Everything runs in the browser from these files. There is no server, no account, and no cost.

## Pages

```
index.html        Dashboard: clock, bell schedule, period countdown, what's coming up
today.html        Today: class boards, lesson slides, tools, and the bell countdown on the projector
planner.html      Planner: weekly plans, units, events and days off, printable week
tracker.html      Table points: points, captains, weekly prizes, projector view
seating.html      Seating charts and room setup; print one class or all
settings.html     Settings: classes and rosters, schedule, Today screen, sub plans, look, backup
sub.html          Printable substitute packet
help.html         Help, Getting started, and the menu tour

Tools menu
spinner.html      Name spinner
topics.html       Topic picker
activities.html   Review game, station rotations, tally, partners and groups
noise.html        Noise meter
hallpass.html     Student log: hall pass and behavior notes (beta)
grader.html       Easy grader
rosters.html      Weekly roster sheets (attendance and points)

shared/core.js    Shared data, schedule, timer, menus, and helpers
shared/guide.js   First-visit setup guide and tour
shared/style.css  Shared look
```

## Where the data lives

Student names, points, plans, and notes are stored only in the browser that's being used (on that computer or Chromebook account), never in these files and never sent anywhere. Each person who opens the site has their own separate copy.

- **Back up regularly:** gear menu → Settings → Backup → Download backup. Keep the file somewhere safe, like your school Google Drive. Clearing browser data would otherwise erase everything.
- **Restore** from a backup on the same or a different computer.
- **Share a setup with a colleague:** Download my setup saves the schedule, settings, and boards with no student information; the colleague loads it with Use a shared setup.

## Publishing on GitHub Pages

In the repository, go to Settings → Pages, choose "Deploy from a branch," pick `main` and `/ (root)`, and save. The site appears at `https://<your-username>.github.io/<repo-name>/`.

To update: upload the whole folder (replacing the old files), then press Ctrl+Shift+R in the browser. Everyone using the link gets the update right away, so it's worth trying an update yourself before sharing it widely. A page that's out of date shows a banner asking for Ctrl+Shift+R.
