# Curiosity Archive

A structured, privacy-first curiosity and learning archive built with Next.js. It acts as a digital "thinking laboratory" inspired by the notebooks of scientists like Darwin and Feynman, allowing you to log atomic insights and watch them organically form a massive interconnected graph of your evolving knowledge.

## 🌟 Philosophy

Most productivity apps collapse under their own ambition because they try to be everything. **Curiosity Archive** is a personal instrument. It enforces a strict, minimal UI scope with three core views, keeping input completely frictionless.

Persist only the truth (your raw insights and goals). Compute everything else (metrics, graphs, clusters).

## ✨ Core Features

### 1. This Week (The Active Canvas)
- **Frictionless Entry**: Add goals instantly by hitting `Enter`. Log your insights in the "Archived Insights" stream and auto-save securely with `Cmd/Ctrl + Enter`.
- **Inline Categorization**: Just type `#tags` naturally within your goals and insights (e.g., "Studying backpropagation #ml-skills"). The system extracts and highlights them automatically.
- **Weekly Reflection**: A dedicated space to synthesize your biggest realization of the week, which becomes that week's "chapter title".

### 2. Timeline (The Archive)
- A chronological, infinite-scrolling feed of your past weeks.
- Prominently displays your Weekly Reflection sentences as narrative anchors.
- Computes metrics (like 3/5 goals completed) safely at runtime.

### 3. Insights Map (The Brain)
- **Terrain Graph**: Built with `react-flow`. It plots your weeks visually and draws intelligent edges between them if they share at least 2 meaningful topics, turning your archive into a thinking graph.
- **Project Anchors**: Define long-term projects (e.g., "MediKarya"). Any week containing project-related tags is automatically pulled into the physical orbit of that project's node.
- **Dashboards**: View your "Dominant Topics" and "Curiosity Volume Over Time" via automatically generated charts.

### 4. Year in Curiosity (Evolution)
- A massive, automated summary page generating the narrative of your intellectual year.
- Calculates your total insights, top focus areas, peak activity months, and largest learning spikes.

### 5. Local & Private
- **Zero Database Setting**: Uses Zustand + LocalStorage. Your data never leaves your browser, ensuring absolute privacy and lightning-fast speed.
- **Data Portability**: Built-in JSON export and import capabilities so you can safely back up your archive to your hard drive at any time.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Custom Skeuomorphic Light Theme)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (with `persist` middleware)
- **Graph Visualization**: [React Flow](https://reactflow.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Date Utilities**: [date-fns](https://date-fns.org/)

## 🚀 Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 🎨 Theme

The application features a custom **Skeuomorphic Light Theme**. It abandons the standard flat, dark-mode look for a warm beige palette (`#fbf9f6`), subtle paper noise textures, and tactile, embossed UI containers with rich purple accents.
