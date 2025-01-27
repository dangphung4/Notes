# Notes
Creating my own note taking pwa because apple notes has been a struggle

#  - Offline-First Todo & Notes PWA

A minimalist, offline-first todo and note-taking app designed to replace Apple Notes with enhanced productivity features, PWA capabilities, and AI integrations.

---

## **Project Overview**
### Core Objectives
- 🛠️ **Build a personal daily driver** that *you* love using
- 📴 **Offline-first functionality** (works on planes, spotty connections)
- ⚡ **Blazing-fast performance** with keyboard shortcuts
- 🌐 **Cross-device sync** (mobile, desktop, web)
- 🚀 **MVP in 1-2 days**, then iterative improvements

---

## **MVP Requirements**
### Core Features
1. **Offline-First Architecture**
   - IndexedDB (Dexie.js) for local storage
   - Service workers (Workbox) for asset caching
   - Basic conflict resolution for sync

2. **Todo/Note Management**
   - Nested todos with collapsible subtasks
   - Markdown support for notes (headers, lists, bold/italic)
   - Voice-to-text input (Web Speech API)

3. **PWA Essentials**
   - Installable to home screen
   - Custom splash screen/manifest
   - Lighthouse PWA score >90

4. **Auth & Sync**
   - Google SSO (Firebase Auth)
   - Cloud sync to Firestore (when online)

5. **Basic UI**
   - Dark/light mode toggle
   - Drag-and-drop reordering
   - Fuzzy search (Fuse.js)

---

## **Tech Stack**
- **Frontend**: Vite + React + TypeScript
- **State/DB**: 
  - Local: Dexie.js (IndexedDB)
  - Cloud: Firebase Firestore
- **Auth**: Firebase Authentication
- **Styling**: Tailwind CSS + shadcn/ui
- **PWA**: `vite-plugin-pwa`
- **Deployment**: Vercel

---

## **Post-MVP Roadmap**
### Phase 1: Sync & Productivity
- 🔄 **Advanced sync logic** (bi-directional, manual conflict resolution)
- ⌨️ **Keyboard shortcuts** (e.g., `Ctrl+K` command palette)
- 📅 **Calendar integration** (Google Calendar deadlines → todos)
- 📤 **Import/export** (Apple Notes CSV, Todoist JSON)

### Phase 2: AI & Automation
- 🤖 **AI categorization** (OpenAI API tags todos as "work"/"personal")
- 📝 **Note summarization** (TL;DR generation for long entries)
- 🔮 **Smart suggestions** ("You usually gym at 6PM – schedule today?")

### Phase 3: Platform Expansion
- 📱 **iOS/Android app** via Capacitor.js
- 🖥️ **Desktop widgets** (Tauri/Electron)
- 🧩 **Browser extension** ("Save to FocusFlow" button)

### Phase 4: Collaboration
- 👥 **Shared projects** with granular permissions
- 💬 **Comments** on todos/notes
- 🗳️ **Task delegation** ("@friend please review")

---

## **Stretch Goals**
- 🔒 **End-to-end encryption** (WebCrypto API)
- 🎙️ **Siri/Shortcuts integration** ("Hey Siri, add milk to groceries")
- 📊 **Analytics dashboard** (time spent per project/category)
- 🎨 **Custom themes** (user-defined CSS variables)

---

## **Development Milestones**
1. **Day 1**: 
   - Vite PWA setup + IndexedDB integration
   - Basic todo CRUD with offline support

2. **Day 2**: 
   - Firebase auth + Firestore sync
   - Dark mode + voice input

3. **Week 1**: 
   - AI categorization
   - Chrome extension MVP

4. **Month 1**: 
   - iOS/Android app wrapper
   - Desktop widgets

---

## **Inspiration**
- 🐻 **Bear Notes**: Clean markdown-first design
- 🚀 **Todoist**: Natural language input
- 📚 **Notion**: Nested database flexibility
