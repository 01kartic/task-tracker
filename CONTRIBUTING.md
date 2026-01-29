# Contributing

Thanks for your interest in contributing to Task Tracker. We're happy to have you here.

Please take a moment to review this document before submitting your first pull request. We also strongly recommend that you check for open issues and pull requests to see if someone else is working on something similar.

If you need any help, feel free to reach out to [@01_kartic](https://x.com/01_kartic).

## Structure

This repository is structured as follows :

```
app
components
└── ui
lib
├── db.ts
└── notifications.ts
main.js
preload.js
```

| Path                   | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `app/page.tsx`         | Main application page (primary UI logic)         |
| `components/`          | React components                                 |
| `components/ui/`       | Reusable UI components                          |
| `lib/db.ts`            | IndexedDB database operations (data layer)       |
| `lib/notifications.ts` | Desktop notification handling                    |
| `main.js`              | Electron main process                            |
| `preload.js`           | Electron preload script                          |

## Development

### Fork this repo

You can fork this repo by clicking the fork button in the top right corner of this page.

### Clone on your local machine

```bash
git clone https://github.com/01kartic/task-tracker.git
```

### Navigate to project directory

```bash
cd task-tracker
```

### Create a new Branch

```bash
git checkout -b my-new-branch
```

### Install dependencies

```bash
npm install
```

### Run the app

To run the app in development mode :

```bash
npm run electron:dev
```

This will start the Next.js dev server and launch the Electron app.

## Commit Guidelines

When creating commits, please follow these simple rules :

- **Write a clear title** - Use a concise, descriptive title that summarizes the change
- **Describe changes in detail** - In the commit description, explain what you changed and why
- **Reference issues** - If applicable, reference related issues using `#issue-number`

**Example:**

```markdown
Add export functionality to analytics

- Added CSV export button to analytics toolbar
- Users can now download their task completion data
- Includes date, task name, and completion status

This feature was requested to allow users to backup
their data and analyze it in external tools.

Fixes #42
```

## Requests for New Features

If you have a request for a new feature, please open an issue on GitHub. We'll be happy to discuss it with you.