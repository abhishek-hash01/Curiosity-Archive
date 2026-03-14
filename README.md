<div align="center">
  
# 📜 Curiosity Archive
**A structured, privacy-first curiosity and learning archive built with Next.js.**

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?logo=next.js&logoColor=white)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript&logoColor=white)](#)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-Skeuomorphic-38B2AC?logo=tailwind-css&logoColor=white)](#)
[![Zustand](https://img.shields.io/badge/State-Zustand-orange)](#)
[![React Flow](https://img.shields.io/badge/Graph-React%20Flow-FF4154)](#)

*Your personal thinking laboratory, inspired by the notebooks of Charles Darwin and Richard Feynman.*

</div>

---

## 🌟 Philosophy

Most productivity apps collapse under their own ambition because they try to be everything. **Curiosity Archive** is a personal instrument. It enforces a strict, minimal UI scope with three core views, keeping input completely frictionless.

> **Persist only the truth** (your raw insights and goals). **Compute everything else** (metrics, graphs, clusters).

## ✨ Core Features

### 📅 This Week (The Active Canvas)
- **Frictionless Entry**: Add goals instantly by hitting `Enter`. Log your insights in the "Archived Insights" stream and auto-save securely with `Cmd/Ctrl + Enter`.
- **Calendaric Goals**: Queue your tasks for specific days of the week (`M T W T F S S`). Your goals list automatically groups itself into chronological days, keeping unscheduled tasks in an `Anytime` bucket.
- **Inline Categorization**: Just type `#tags` naturally within your goals and insights (e.g., *"Studying backpropagation #ml-skills"*). The system extracts, highlights, and normalizes them automatically.
- **Weekly Reflection**: A dedicated space to synthesize your biggest realization of the week, which becomes that week's "chapter title".

### 🕰️ Timeline (The Archive)
- A chronological, infinite-scrolling feed of your past weeks.
- Prominently displays your Weekly Reflection sentences as narrative anchors.
- Computes metrics (e.g., *3/5 goals completed*) safely at runtime.

### 🧠 Insights Map (The Brain)
- **Terrain Graph**: Built with `react-flow`. It plots your weeks visually and draws intelligent edges between them if they share at least 2 meaningful topics, turning your archive into a thinking graph.
- **Project Anchors**: Define long-term projects (e.g., `#MediKarya`). Any week containing project-related tags is automatically pulled into the physical orbit of that project's node.
- **Dashboards**: View your "Dominant Topics" and "Curiosity Volume Over Time" via automatically generated charts.

### 🌌 Year in Curiosity (Evolution)
- A massive, automated summary page generating the narrative of your intellectual year.
- Calculates your total insights, top focus areas, peak activity months, and largest learning spikes.

### 🔐 Local & Private
- **Zero Database Setting**: Uses Zustand + LocalStorage. Your data never leaves your browser, ensuring absolute privacy and lightning-fast speed.
- **Archival Robustness**: All tags are aggressively normalized (stripping punctuation and whitespace), and completion timestamps are logged for future behavioral analytics.
- **Data Portability**: Built-in JSON export and import capabilities so you can safely back up your archive to your hard drive at any time.

## 🎨 Aesthetic

The application features a custom **Skeuomorphic Light Theme**. It abandons the standard flat, dark-mode look for a warm beige palette (`#fbf9f6`), subtle paper noise textures, and tactile, embossed UI containers with rich purple accents (`#6b4c9a`).

---

## 🚀 Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application. It is completely ready for your thoughts. 
