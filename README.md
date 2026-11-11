# Classroom Suite

A set of classroom tools that share one set of classes, tables, and rosters: a dashboard with the bell schedule, a Today screen that runs class from the projector, a weekly planner, table points, seating charts, and tools for picking students, grouping, timing, and record-keeping.

Everything runs in the browser from these files. There is no server, no account, and no cost.

## Pages

```
index.html        Dashboard: clock, bell schedule, period countdown, what's coming up
today.html        Today: class boards, lesson slides, tools, and the bell countdown on the projector
                  (its styles and code are the files in today/, listed below)
planner.html      Planner: weekly plans, units, events and days off, printable week
tracker.html      Table points: points, captains, weekly prizes, projector view
seating.html      Seating charts and room setup; print one class or all
settings.html     Settings: classes, schedule, Today screen, sub plans, look, backup
sub.html          Printable substitute packet (opens from the Planner and the Dashboard)
boards.html       Boards: every custom board, where it's used, rename and edit words (opens from Today)
help.html         Help, Getting started, and the menu tour

Tools menu
spinner.html      Name spinner
topics.html       Topic picker
activities.html   Review game, station rotations, tally, partners and groups
noise.html        Noise meter
hallpass.html     Student log: hall pass and behavior notes (beta)
grader.html       Easy grader
rosters.html      Attendance sheets (weekly attendance and points)

shared/version.js The build's version, written in this one place
shared/core.js    Shared data, schedule, timer, menus, the class picker, projector view, and other helpers
shared/guide.js   First-visit setup guide and tour
shared/style.css  Shared look
shared/favicon.svg  Tab icon (favicon-32.png is the fallback)

today/today.css   Styles for the Today page
today/boards.js   The boards: saved data, which class and day are showing, drawing, lesson deck, control rail
today/drawer.js   The Day settings panel
today/editor.js   Edit on screen, and the one-board editor opened from the Boards page
today/tools.js    Bell reminder, and tools opened on top of a board
today/effects.js  Seasonal looks and falling effects
today/widgets.js  Widgets pinned on top of the lesson slides
today/main.js     Buttons and keys, then the first draw (loads last)
```

## Where the data lives

Student names, points, plans, and notes are stored only in the browser that's being used (on that computer or Chromebook account), never in these files and never sent anywhere. Each person who opens the site has their own separate copy.

- **Back up regularly:** gear menu → Settings → Backup → Download backup. Keep the file somewhere safe, like your school Google Drive. Clearing browser data would otherwise erase everything.
- **Restore** from a backup on the same or a different computer.
- **Share a setup with a colleague:** Download my setup saves the schedule, settings, and boards with no student information; the colleague loads it with Use a shared setup.

## Publishing on GitHub Pages

In the repository, go to Settings → Pages, choose "Deploy from a branch," pick `main` and `/ (root)`, and save. The site appears at `https://<your-username>.github.io/<repo-name>/`.

To update: upload the whole folder (replacing the old files). The next time the site is opened it notices the new build: it refreshes itself once, or shows an **Update now** button that brings every page up to date together. It can take up to ten minutes after an upload for GitHub to start serving the new files; Ctrl+Shift+R still forces the page you're on to reload right away.

Each build has a version, written only in `shared/version.js`. Change it with every build, and add any new file to the `FILES` list near the top of `shared/core.js` so updates fetch it too.
