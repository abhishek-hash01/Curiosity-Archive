<div align="center">
  
# 📜 Curiosity Archive
**A weekly thinking archive for builders, researchers, and curious minds.**

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?logo=next.js&logoColor=white)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript&logoColor=white)](#)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-Skeuomorphic-38B2AC?logo=tailwind-css&logoColor=white)](#)
[![Zustand](https://img.shields.io/badge/State-Zustand-orange)](#)
[![React Flow](https://img.shields.io/badge/Graph-React%20Flow-FF4154)](#)

*A structured, privacy-first curiosity and learning archive inspired by the notebooks of Charles Darwin and Richard Feynman.*

</div>

---

## 🌟 Philosophy

Most productivity apps collapse under their own ambition because they try to be everything. **Curiosity Archive** is a personal instrument.

It enforces a strict, minimal scope with three core views and frictionless input so that thinking remains the center of the experience.

> **Persist only the truth** (your raw insights and goals).  
> **Compute everything else** (metrics, graphs, clusters).

The goal is not task management.  
The goal is **tracking how your thinking evolves over time.**

---

## 🧭 Who This Is For

Curiosity Archive is designed for people who care about documenting the evolution of their ideas.

It works best if you are:

• a founder building something long-term  
• a student learning complex ideas  
• an engineer exploring systems  
• a researcher documenting discoveries  
• someone who likes keeping intellectual notebooks

If you only want a task manager, this tool will feel unnecessary.

If you want a structured archive of what you attempted, discovered, and learned each week, it might become invaluable.

---

## ✨ Core Features

### 📅 This Week (The Active Canvas)

- **Frictionless Entry**  
  Add goals instantly by hitting `Enter`. Log insights in the stream and save with `Cmd/Ctrl + Enter`.

- **Calendaric Goals**  
  Queue tasks for specific days of the week (`M T W T F S S`). Goals automatically group themselves chronologically, keeping unscheduled tasks in an `Anytime` bucket.

- **Inline Categorization**  
  Simply type `#tags` inside goals or insights (e.g., *"Studying backpropagation #ml-skills"*).  
  The system extracts, highlights, and normalizes them automatically.

- **Weekly Reflection**  
  A dedicated space to write your biggest realization of the week.  
  This becomes that week's **chapter title** in the archive.

---

### 🕰️ Timeline (The Archive)

- Infinite chronological feed of past weeks
- Weekly reflections displayed as narrative anchors
- Runtime-computed metrics (e.g. *3/5 goals completed*)

This becomes your **personal intellectual history**.

---

### 🧠 Insights Map (The Brain)

- **Terrain Graph** powered by `react-flow`
- Weeks connect if they share at least **two meaningful topics**
- **Project Anchors** allow long-term ideas (e.g. `#MediKarya`) to act as gravity hubs
- Dashboards visualize:
  - Dominant topics
  - Curiosity activity over time

Over time, the map becomes a **visual representation of your thinking patterns.**

---

### 🌌 Year in Curiosity (Evolution)

An automatically generated annual summary answering:

- How many insights did you record?
- Which ideas dominated your year?
- When did curiosity spike?

It transforms your weekly entries into a **narrative of intellectual growth**.

---

## 🔐 Local & Private

Curiosity Archive follows a **local-first philosophy**.

- **Zero database setup** — uses Zustand + LocalStorage
- Your data never leaves your browser
- Instant performance with zero latency

### Archival Robustness

- Tags are aggressively normalized (punctuation stripped)
- Completion timestamps logged for future behavior analytics

### Data Portability

Export or import your entire archive as JSON at any time.

Your thoughts always belong to you.

---

## 🎨 Aesthetic

The interface uses a custom **Skeuomorphic Light Theme**.

Instead of flat dark UI, the design uses:

- warm beige palette (`#fbf9f6`)
- subtle paper textures
- tactile embossed containers
- deep purple accents (`#6b4c9a`)

The goal is to make the interface feel closer to a **physical notebook** than a productivity dashboard.

---

## 🚀 Getting Started

Install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application. It is completely ready for your thoughts. 
