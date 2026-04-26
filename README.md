# 🧠 Haven
### Your daily mental health companion for Indian college students

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/Google-Gemini%202.0-blue)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

> **GDG Solution Challenge 2026** — Open Innovation Track | SDG 3: Good Health & Well-Being

---

## The Problem

India is facing a silent mental health crisis among college students — and the numbers are alarming.

- **69.9%** of Indian college students experience moderate to high anxiety *(Cherian et al., 2025 — 1,628 students, 8 cities)*
- **59.9%** experience depression *(same study)*
- **33.6%** report moderate to severe depressive symptoms *(Cherian et al., 2025 — 8,542 students, 9 states)*
- **18.8%** have considered suicide at some point *(same study)*
- **35 students die by suicide every single day** in India — over 13,000 in 2022 alone
- **83–84.5%** treatment gap — most students who need help never receive it
- **Less than 10%** of Indian youth access mental health services *(UNICEF, 2021)*
- Only **0.75 psychiatrists per lakh population** — far below WHO's recommended 3 per lakh

The barriers are real: stigma, cost, logistics, and a simple lack of awareness. Most students don't know they're struggling until they're in crisis. By then, it's often too late.

**Haven bridges this gap** — not by replacing professional care, but by helping students understand their own mental health patterns before they reach crisis point.

---

## The Solution

Haven is an AI-powered student mental health screening and stress management Progressive Web App (PWA). It does three things:

**1. Screen** — Detect early warning signs through daily AI-powered journal analysis and formal PHQ-9/GAD-7 clinical screening tools.

**2. Track** — Show students their own mood, stress, and wellbeing trends over time so they can notice patterns they'd otherwise miss.

**3. Support** — Provide evidence-based coping exercises (breathing, CBT reframing, grounding, mindfulness) and connect students to professional resources when needed.

---

## UN SDG Alignment

**SDG 3: Good Health and Well-Being**
- Target 3.4: Promote mental health and well-being
- Target 3.8: Achieve universal health coverage including access to quality mental health services

Haven directly addresses the 84.5% treatment gap by making mental health awareness accessible, private, and free — on any device, from any location.

---

## Features

### 🏠 Daily Check-In
Students log their day through a structured but conversational interface — mood emoji, wellbeing score (1-10), sleep hours, energy level, and a free-text journal. Simple enough to complete in under 2 minutes.

### 🤖 AI Wellbeing Analysis
Powered by Google Gemini 2.0. When a student taps "Analyse My Wellbeing", Gemini reads the journal entry and returns:
- Entry-by-entry categorization (stress signal / positive coping / neutral)
- Mental state summary (primary mood, energy, stress level)
- Soft PHQ-9 and GAD-7 signal estimates extracted from natural language
- A warm, empathetic wellbeing insight
- Automatic crisis flag if self-harm signals are detected

### 📋 Formal Screening (PHQ-9 & GAD-7)
Clinically validated depression and anxiety screening questionnaires — the same tools used by mental health professionals worldwide. One question per screen with smooth transitions. Scores are stored over time so students can track their progress. Results include severity levels, interpretation, and resource recommendations.

### 🫁 Coping Toolkit
Four evidence-based stress management exercises:
- **Box Breathing** — 4-4-4-4 pattern with animated circle (used by Navy SEALs and first responders)
- **CBT Thought Reframe** — 5-step guided cognitive restructuring with AI-suggested reframes
- **5-4-3-2-1 Grounding** — Sensory awareness exercise to interrupt panic and anxiety
- **Mindfulness Timer** — Guided meditation with SVG progress ring and rotating prompts

Each exercise includes a research-backed "About" section and links to tutorial videos.

### 📊 Wellbeing Dashboard
Visual trends over time: mood timeline, wellbeing score trend, PHQ-9/GAD-7 score history with severity zone shading, sleep-mood correlations, and AI-generated weekly wellbeing reports.

### 🆘 Crisis System
When the AI detects self-harm signals or formal screening scores cross clinical thresholds, a non-dismissible crisis modal surfaces immediately with direct tap-to-call links to Tele-MANAS (14416), iCall, and Vandrevala Foundation.

### 📍 Resource Finder
Nearby mental health professionals via Google Maps Places API (geolocation-based), national helplines, and online therapy platforms (Wysa, YourDOST, Amaha).

### 📅 History
Calendar view of all past check-ins with mood emoji overlays and day-detail slide-in panel.

---

## Google Technologies Used

| Product | How it's used |
|---------|--------------|
| **Gemini 2.0 Flash** | Journal analysis, PHQ-9/GAD-7 signal extraction, weekly wellbeing reports, CBT reframe suggestions |
| **Google Maps Places API** | Nearby mental health professional finder on the Resources page |
| **Google Cloud** | Supabase runs on GCP (ap-south-1 region); serverless API routes via Vercel |
| **Google OAuth** | Sign in with Google — one-tap authentication |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| State | Zustand |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Auth | Supabase Auth + Google OAuth |
| AI | Google Gemini 2.0 Flash |
| Maps | Google Maps Places API |
| PWA | next-pwa |
| Hosting | Vercel |

---

## Architecture

```
Student (PWA — mobile or desktop)
│
├── Daily Check-In (/today)
│   ├── Mood emoji + wellbeing slider + sleep + energy
│   ├── Free-text journal
│   └── "Analyse My Wellbeing" → /api/parse-entry
│                                      │
│                              Local Parser (regex)
│                                      │
│                              Gemini 2.0 Flash
│                              ┌───────────────────┐
│                              │ Entry categorization│
│                              │ Mental state        │
│                              │ PHQ-9 signals       │
│                              │ GAD-7 signals       │
│                              │ Wellbeing insight   │
│                              │ flagged: boolean    │
│                              └───────────────────┘
│                                      │
│                              Supabase (PostgreSQL)
│                              ├── daily_logs
│                              ├── mental_states (+ phq9/gad7)
│                              ├── parsed_entries
│                              └── user_summaries
│
├── Screening (/screening)
│   ├── PHQ-9 (9 questions) → scoring → severity
│   ├── GAD-7 (7 questions) → scoring → severity
│   └── Saves to: screening_results
│
├── Coping Toolkit (/coping)
│   ├── Box Breathing (/coping/breathing)
│   ├── CBT Reframe (/coping/reframe) → /api/coping/reframe → Gemini
│   ├── 5-4-3-2-1 Grounding (/coping/grounding)
│   └── Mindfulness Timer (/coping/mindfulness)
│   Saves to: coping_sessions
│
├── Wellbeing Dashboard (/insights)
│   ├── AI wellbeing score (latest phq9/gad7 estimates)
│   ├── Mood timeline + wellbeing trend (Recharts)
│   ├── Screening score history chart
│   ├── Sleep/energy/coping correlations
│   └── Weekly report → /api/weekly-insights → Gemini
│
├── Resources (/resources)
│   ├── National helplines (Tele-MANAS, iCall, Vandrevala)
│   ├── Online platforms (Wysa, YourDOST, Amaha)
│   └── Nearby counselors → /api/maps-proxy → Google Maps Places API
│
└── Crisis Modal (global — app/layout.tsx)
    Triggers on: flagged journal analysis OR high screening scores
    Shows: helplines with tap-to-call, resource finder link
    Non-dismissible except via explicit button
```

---

## Database Schema

```sql
profiles          — user profile, timezone, current_log_date
daily_logs        — raw text, rating, mood emoji, sleep hours, energy level
parsed_entries    — AI-categorized journal lines (category, sentiment, tags)
mental_states     — mood/energy/stress + phq9_signals + gad7_signals + flagged
screening_results — formal PHQ-9/GAD-7 scores, severity, flagged
coping_sessions   — exercise type, completed, duration, notes
weekly_insights   — Gemini-generated weekly wellbeing reports
user_summaries    — rolled-up stats used as AI context
```

All tables have Row Level Security — users can only access their own data.

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- Supabase account (free tier)
- Google AI Studio API key (free)
- Google Cloud account with Places API enabled (free tier)

### 1. Clone the repository

```bash
git clone https://github.com/JashFijiwala/stride.git
cd stride
git checkout mindlens
npm install
```

### 2. Set up Supabase

- Create a new project at [supabase.com](https://supabase.com)
- Go to SQL Editor and run `migration-1.sql` then `migration-2.sql` (in project root)
- Enable Google OAuth in Authentication → Providers

### 3. Configure environment variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_MAPS_API_KEY=your_maps_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel

```bash
vercel --prod
```

Add all environment variables in Vercel dashboard → Settings → Environment Variables.

---

## Team

| Name | Role |
|------|------|
| Jash Fijiwala | Lead Developer — Full-stack, AI integration, Supabase |
| [Member 2] | UI/UX — Design, animations, mobile responsiveness |
| [Member 3] | Research & Testing — User feedback, clinical validation |
| [Member 4] | Presentation — Demo video, project deck, pitch |

---

## Disclaimer

Haven is a mental health screening and wellbeing tracking tool. It is **not** a diagnostic tool, not a therapeutic service, and not a replacement for professional mental health care. The PHQ-9 and GAD-7 are validated screening instruments used for awareness purposes only. If you are in crisis, please contact Tele-MANAS at **14416** (free, 24/7) or emergency services at **112**.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

*Built for the GDG Solution Challenge 2026 | Open Innovation Track | SDG 3*
