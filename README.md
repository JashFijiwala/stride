# 🧘 Haven
### Your safe space to breathe — AI-powered mental health companion for Indian college students

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/Google-Gemini%202.5%20Flash-blue)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

> **GDG Solution Challenge 2026** — Open Innovation Track | SDG 3: Good Health & Well-Being

---

## The Problem

India is facing a silent mental health crisis among college students:

- **69.9%** of Indian college students experience moderate to high anxiety
- **59.9%** experience depression *(Cherian et al., 2025 — 1,628 students, 8 cities)*
- **33.6%** report moderate to severe depressive symptoms *(8,542 students, 9 states)*
- **35 students die by suicide every single day** in India
- **84.5% treatment gap** — most who need help never receive it
- Only **0.75 psychiatrists per lakh population** (WHO recommends 3)
- **Less than 10%** of Indian youth access mental health services *(UNICEF, 2021)*

Most students don't know they're struggling until they're in crisis. Haven bridges this gap — not by replacing professional care, but by helping students understand their own mental health patterns before they reach crisis point.

---

## The Solution

Haven is an AI-powered student mental health screening and stress management Progressive Web App (PWA):

**Screen** — Detect early warning signs through daily AI-powered journal analysis and formal PHQ-9/GAD-7 clinical screening tools.

**Track** — Show students their own mood, stress, and wellbeing trends over time.

**Support** — Evidence-based coping exercises + immediate connection to real help when needed.

---

## UN SDG Alignment

**SDG 3: Good Health and Well-Being**
- Target 3.4: Promote mental health and well-being
- Target 3.8: Universal access to quality mental health services

---

## Features

### 🏠 Daily Check-In
Mood emoji, wellbeing score (1-10), sleep hours, energy level, and free-text journal. Under 2 minutes. Smart time-based greetings ("Working late, Jash? 💻", "Happy Sunday ☀️").

### 🤖 AI Wellbeing Analysis — Gemini 2.5 Flash
- Entry-by-entry categorization: stress signal / positive coping / neutral
- Mental state extraction: primary mood, energy level, stress level
- Soft PHQ-9 (9 domains) and GAD-7 (7 domains) signal estimates from natural language
- Empathetic wellbeing insight
- Auto crisis flag on self-harm signals

**Multilingual:** Handles English, Hindi (Devanagari), Hinglish, and Roman Hindi. "Aaj bahut stressed tha, neend nahi aayi" — Haven understands it correctly and analyzes it accurately.

### 📋 Formal Screening — PHQ-9 & GAD-7
Clinically validated instruments used by psychiatrists worldwide. One question per screen with Framer Motion transitions. Severity scoring, score history over time, and resource recommendations. Crisis modal triggered on PHQ-9 Q9 (self-harm) score > 0.

### 🫁 Coping Toolkit
Four evidence-based exercises with research-backed about sections and tutorial video links:
- **Box Breathing** — 4-4-4-4 Framer Motion animated circle
- **CBT Thought Reframe** — 5-step guided form + AI reframe suggestion via Gemini
- **5-4-3-2-1 Grounding** — Sensory awareness to interrupt panic
- **Mindfulness Timer** — SVG progress ring + rotating mindfulness prompts

### 📊 Wellbeing Dashboard
Mood timeline, wellbeing score trend, PHQ-9/GAD-7 history chart with severity zone shading, sleep-mood correlations, energy-mood correlations, coping exercise impact tracking, AI weekly wellbeing reports.

### 🆘 Crisis System
Non-dismissible global modal triggers when:
- AI detects self-harm signals in any language (English, Hindi, Hinglish)
- PHQ-9 formal score ≥ 20 or GAD-7 ≥ 15
- PHQ-9 Question 9 score > 0

Shows tap-to-call: Tele-MANAS (14416), iCall (9152987821), Vandrevala Foundation (1860-2662-345), Emergency (112).

### 📍 Resource Finder
Nearby mental health professionals via Google Maps Places API. National helplines. Online platforms: Wysa, YourDOST, Amaha.

### 📅 History
Calendar view with mood emoji overlays and day-detail slide-in panel.

---

## Google Technologies Used

| Product | Integration |
|---------|-------------|
| **Gemini 2.5 Flash** | Journal analysis, PHQ-9/GAD-7 signal extraction, multilingual understanding (Hindi/Hinglish/English), weekly reports, CBT reframe suggestions |
| **Google Maps Places API** | Nearby mental health professional finder (geolocation-based) |
| **Google Cloud** | Supabase on GCP ap-south-1; serverless API routes |
| **Google OAuth** | One-tap sign in with Google |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Charts | Recharts |
| State | Zustand |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth + Google OAuth |
| AI | Google Gemini 2.5 Flash |
| Maps | Google Maps Places API |
| PWA | next-pwa |
| Hosting | Vercel |

---

## Architecture

```
Student (PWA — mobile or desktop)
│
├── Daily Check-In (/today)
│   ├── Mood + slider + sleep + energy + journal
│   │   (English / Hindi / Hinglish supported)
│   └── "Analyse My Wellbeing" → /api/parse-entry
│              │
│         Local Parser (stress keywords, coping signals,
│         isolation signals — regex layer, no API cost)
│              │
│         Gemini 2.5 Flash
│         ┌──────────────────────────────┐
│         │ Multilingual journal analysis│
│         │ Entry categorization         │
│         │ Mental state object          │
│         │ PHQ-9 signals (9 domains)    │
│         │ GAD-7 signals (7 domains)    │
│         │ Wellbeing insight (empathetic│
│         │ flagged: boolean             │
│         └──────────────────────────────┘
│              │
│         Supabase PostgreSQL (RLS)
│         daily_logs / mental_states /
│         parsed_entries / user_summaries
│
├── Screening (/screening)
│   ├── PHQ-9 — 9 questions (exact clinical wording)
│   ├── GAD-7 — 7 questions (exact clinical wording)
│   ├── Q9 crisis modal (non-dismissible)
│   └── → screening_results table
│
├── Coping Toolkit (/coping)
│   ├── /coping/breathing — Framer Motion circle
│   ├── /coping/reframe — 5 steps + Gemini suggestion
│   ├── /coping/grounding — sensory inputs
│   └── /coping/mindfulness — SVG ring timer
│   → coping_sessions table
│
├── Wellbeing Dashboard (/insights)
│   ├── Wellbeing score card (latest phq9/gad7 estimates)
│   ├── Mood timeline + wellbeing trend (Recharts)
│   ├── Screening score history (severity zones)
│   ├── Correlations: sleep/energy/coping vs mood
│   └── Weekly report → /api/weekly-insights → Gemini
│
├── Resources (/resources)
│   ├── National helplines (tap-to-call)
│   ├── Online platforms
│   └── /api/maps-proxy → Google Maps Places API
│
└── Crisis Modal (global, app/layout.tsx)
    Triggers on flagged journal OR high screening scores
    Detects signals in English + Hindi + Hinglish
    Non-dismissible — only "I understand" button closes it
```

---

## Database Schema

```sql
profiles          — user profile, timezone, current_log_date
daily_logs        — raw text, rating, mood emoji, sleep_hours, energy_level
parsed_entries    — AI-categorized lines (category, sentiment, tags)
mental_states     — mood/energy/stress + phq9_signals + gad7_signals + flagged
screening_results — PHQ-9/GAD-7 scores, severity, flagged
coping_sessions   — exercise type, completed, duration, notes
weekly_insights   — Gemini weekly wellbeing reports
user_summaries    — rolled-up stats used as AI context
```

All tables have Row Level Security — users only access their own data.

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- Supabase account (free tier)
- Gemini API key — [aistudio.google.com](https://aistudio.google.com) (free)
- Google Cloud with Places API enabled (free tier)

### 1. Clone & install

```bash
git clone https://github.com/JashFijiwala/stride.git
cd stride
npm install
```

### 2. Supabase setup

- Create project at [supabase.com](https://supabase.com)
- Run `migration-1.sql` then `migration-2.sql` in SQL Editor
- Enable Google OAuth in Authentication → Providers

### 3. Environment variables

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

### 5. Deploy

```bash
vercel --prod
```

---

## Team

| Name | Role |
|------|------|
| Jash Fijiwala | Lead Developer & Pitch — Full-stack development, AI integration, Supabase, deployment, pitch delivery |
| Fenil Shilodre | Presentation — Project deck, demo video, visual design |
| Jatin Bendale | Research & Documentation — Clinical research, user testing, README |
| Sarthak Yerpude | QA & Testing — Feature testing, bug reporting, user feedback collection |

---

## Disclaimer

Haven is a screening and wellbeing tracking tool — not a diagnostic service and not a replacement for professional mental health care. The PHQ-9 and GAD-7 are validated screening instruments used for awareness only. If you are in crisis: **Tele-MANAS 14416** (free, 24/7) or **Emergency 112**.

## AI Disclosure

AI tools (Google Gemini 2.5 Flash, Claude) were used to assist in code generation, prompt engineering, and development of this project.

## License

MIT — see [LICENSE](LICENSE) for details.

---

*Built for the GDG Solution Challenge 2026 | Open Innovation Track | SDG 3*