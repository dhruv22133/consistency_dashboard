# Consistency Dashboard 🎯

A minimal, elegant, monochromatic task management & consistency dashboard built with **Next.js 14**, **React 18**, **TypeScript**, and **Tailwind CSS**.

---

## ✨ Features & Highlights

- **Monochrome Dark Theme Aesthetic**: Pure black (`#050505`), slate greys, glowing pure white accents, and crimson red highlighting for zero-completion/missed days.
- **Multi-Scope Task Command Center**:
  - **Daily Tasks**: Track daily habits and objectives. Automated notifications trigger **every 5 hours** detailing remaining daily tasks.
  - **Monthly Goals**: Set 30-day targets. Automatic progress check-in notifications trigger **every 10 days**.
  - **Yearly Objectives**: Define long-term milestones. Automatic quarterly review notifications trigger **every 3 months**.
- **GitHub-Style Contribution Dot Grid Matrix**:
  - 365-day contribution heatmap matrix.
  - Dot brightness scales directly with completion intensity.
  - Interactive hover tooltips showing date, completed count, completion rate percentage, and status.
- **Interactive Monthly Calendar View**:
  - Full calendar layout displaying dot indicators on each day cell.
  - Days with 0 completed tasks (missed days) are automatically marked with **glowing red dots**.
  - Clicking any date cell opens a detailed **Day Breakdown Log Modal** showing completed & pending tasks for that day.
- **Notification Engine & Tester**:
  - In-app Notification Center drawer log.
  - Built-in notification test trigger buttons for instant 5-hour daily, 10-day monthly, and 3-month yearly simulation checks.
  - Optional Web Notifications API integration for desktop browser push alerts.
- **Persistence & Mock Data**:
  - Uses LocalStorage for full persistence.
  - Comes pre-populated with rich 365-day historical activity logs out-of-the-box.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **UI & Logic**: React 18, TypeScript 5
- **Styling**: Tailwind CSS v3 (Custom monochrome palette & glow utilities)
- **Icons**: Lucide React
- **Animations**: Framer Motion

---

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```
