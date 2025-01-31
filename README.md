# Notes - Offline-First PWA Note Taking App

<img src="/notes/public/assets/note-maskable.png" alt="Notes" width="200" height="200">

Creating my own note taking pwa because apple notes has been a struggle

## Offline-First Todo & Notes PWA

A minimalist, offline-first todo and note-taking app designed to replace Apple Notes with enhanced productivity features, PWA capabilities, and AI integrations.

---

## Prerequisites

- Node.js 20+
- npm/yarn
- .NET 9.0+
- Firebase account

### Environment Setup

Create a `.env` file in the `/notes` directory:

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

### Installation & Running

#### Development with Vite Only

```bash
cd notes
npm install
npm run dev
```

#### Development with .NET Aspire

```bash
# Run the Aspire host project
cd NotesAspire/NotesAspire.Host
dotnet run

# to turn on Watch (Currently hot reload is not configured to watch changes in the react project)
dotnet watch 
```

This will:

- Start the Aspire dashboard
- Build and run the React app
- Start the API server
- Enable real-time updates for React changes

Visit:

- Dashboard: <https://localhost:15039>
- Web App: <https://localhost:3001>
- API: <https://localhost:7041>

---

### Linting

```bash
cd notes
npm run lint
```

---

### Commit Linting

```bash
cd notes
npm run commit-lint
```

### Release

```bash
cd notes
npm run release

# or
git tag vX.X.X && git push origin vX.X.X
```

---

### Build for production

```bash
npm run build
```

---

## Features

### Current Features

- 📱 PWA with offline support
- 🔄 Real-time sync with Firebase
- 🎨 Dark/light mode
- ⌨️ Rich text editor
- 📅 Calendar integration
- 🔍 Full-text search
- 👥 Note sharing
- 📱 Responsive mobile design

### Planned Features

#### UI/UX Improvements

- [X] Custom fonts
- [ ] Color themes
- [ ] Desktop toolbar enhancement
- [ ] Mobile toolbar positioning fix
- [ ] Preview images for notes
- [ ] Infinite color palette
- [ ] Default text size adjustment
- [ ] Fix scrolling issues
- [ ] Fix reload behavior
- [ ] Improve Ctrl + A and other shortcuts

#### Core Features

- [X] Command palette with note search
- [ ] Enhanced calendar integration
  - [ ] Note-calendar event linking
  - [ ] In-note deadline commands (e.g., `$calendar 12/9/2025 1330`)
  - [ ] Automatic calendar sync
- [ ] Real-time collaboration
- [ ] Scheduling templates
- [ ] Theme customization system

#### Infrastructure

- [ ] .NET Aspire integration
- [ ] Docker containerization
- [ ] CI/CD Improvements
  - [ ] Lint workflows
  - [ ] PR workflows
  - [ ] Automated testing

## Tech Stack

- **Frontend**: Vite + React + TypeScript
- **Backend**:
  - .NET 9.0
  - .NET Aspire
- **State/DB**:
  - Local: Dexie.js (IndexedDB)
  - Cloud: Firebase Firestore
- **Auth**: Firebase Authentication
- **Styling**: Tailwind CSS + shadcn/ui
- **PWA**: `vite-plugin-pwa`
- **Deployment**: Vercel

---

## Contributing

### Commit Convention

This project follows the Conventional Commits specification. Commit messages should be structured as follows:

```sh
# This follows the Conventional Commits specification
feat: add new feature
fix: fix bug
docs: update documentation
style: format code
refactor: refactor code
perf: improve performance
test: add tests
build: build changes
ci: continuous integration
chore: other changes
revert: revert previous commit
```
