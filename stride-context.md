# Stride — Master Context Document
Last Updated: April 2026

═══════════════════════════════════════════════════
SECTION 1: WHAT IS STRIDE
═══════════════════════════════════════════════════

Stride is a daily journaling PWA (Progressive Web App) 
that helps users improve their routines gradually.

CORE PHILOSOPHY:
"However bad your routine is, it can be improved — 
but not suddenly. Day by day, bit by bit. 
Stride by stride."

THE IDEA:
→ Users write a free-form journal entry about their day
→ In their own natural language, like texting themselves
→ No rigid forms, no dropdowns, no structure required
→ AI silently reads the entry and categorizes everything
→ Tracks habits automatically over time
→ Finds correlations between habits and how they rate days
→ Delivers insights through pre-generated insight cards
→ Suggests ONE small improvement per week
→ Also tracks mental state and mood over time

TARGET USERS:
→ People who want to improve their daily routine
→ People who journal but want more value from it
→ Anyone who wants to understand their own patterns
→ People stressed about productivity and lifestyle

THE THEORY:
→ Bad habits can't be eliminated overnight
→ Good habits compound over time
→ Small daily improvements lead to massive change
→ The app never judges or pressures the user
→ Missing a day is okay, data not failure

REAL EXAMPLE ENTRY A USER WOULD WRITE:
"""
Wednesday 010426
Weight at start - 83.3kg
Woke at 815AM
Had good sleep 
Read a book for 45mins
Made my bed
Had a bath 
Avoided screen for like 90mins after waking up
Had good breakfast and some snacks
Had carbs heavy lunch
Watched shutter island 
Slept for 2 hours, cuz having a headache
Solved a DSA problem
Had decent dinner
Watched lsg vs dc
Played poker
Sleep at 130 Am
Rating - 5/10
"""

═══════════════════════════════════════════════════
SECTION 2: TECH STACK
═══════════════════════════════════════════════════

FRONTEND:
→ Next.js 14 (App Router) with TypeScript
→ Tailwind CSS
→ Framer Motion (animations)
→ Recharts (charts and visualizations)
→ Lucide React (icons)
→ next-themes (dark/light mode)
→ zustand (client state management)
→ date-fns (date utilities)
→ jspdf + jspdf-autotable (PDF export)

BACKEND:
→ Next.js API Routes (serverless)
→ Supabase (PostgreSQL database + Auth)
→ Row Level Security on all tables

AI:
→ Google Gemini 2.5 Flash Lite
→ Called ONCE per entry when user clicks "Analyse My Day"
→ Called ONCE per week for weekly insights
→ NOT a chatbot — only generates insight cards
→ 3 layer architecture:
   Layer 1: Local regex parser (free, no API)
   Layer 2: Gemini for categorization and mood (paid)
   Layer 3: Weekly batch insights (paid, once/week)

HOSTING:
→ Vercel (free tier)
→ Live URL: https://stride-taupe.vercel.app

DATABASE:
→ Supabase
→ Project: stride
→ Region: ap-south-1 (Mumbai)

═══════════════════════════════════════════════════
SECTION 3: LIVE CREDENTIALS AND URLS
═══════════════════════════════════════════════════

NOTE: Never share these publicly or commit to GitHub.
Store in .env.local only.

Live App URL: https://stride-taupe.vercel.app
Supabase Dashboard: https://supabase.com/dashboard
Vercel Dashboard: https://vercel.com/dashboard
Google Cloud Console: https://console.cloud.google.com
Gemini API: https://aistudio.google.com/apikey
GitHub Repo: https://github.com/JashFijiwala/stride

Environment Variables needed in .env.local and Vercel:
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
NEXT_PUBLIC_APP_URL=https://stride-taupe.vercel.app

═══════════════════════════════════════════════════
SECTION 4: DATABASE SCHEMA
═══════════════════════════════════════════════════

All tables have Row Level Security enabled.
Users can only access their own data.

TABLE: profiles
→ id (UUID, PK, references auth.users)
→ name (TEXT)
→ email (TEXT)
→ timezone (TEXT, default 'Asia/Kolkata')
→ current_log_date (DATE) ← user controls this manually
→ created_at, updated_at (TIMESTAMPTZ)

TABLE: daily_logs
→ id (UUID, PK)
→ user_id (UUID, FK → profiles)
→ log_date (DATE, unique per user)
→ raw_text (TEXT, exactly what user typed)
→ self_rating (INTEGER, 1-10)
→ weight_kg (DECIMAL)
→ mood_emoji (TEXT)
→ ai_parsed (BOOLEAN) ← false until user clicks Analyse
→ created_at, updated_at

TABLE: parsed_entries
→ id, daily_log_id, user_id
→ original_text (single line from raw entry)
→ category (sleep/nutrition/exercise/personal-growth/
            work/entertainment/digital-wellness/
            discipline/health/social/other)
→ sentiment (positive/negative/neutral)
→ duration_mins (INTEGER, nullable)
→ tags (TEXT array)

TABLE: mental_states
→ id, daily_log_id, user_id
→ primary_mood (TEXT)
→ energy_level (very_low/low/moderate/high/very_high)
→ stress_level (very_low/low/moderate/high/very_high)
→ mood_score (INTEGER, 1-10)
→ emotional_tags (TEXT array)
→ summary (TEXT)

TABLE: habits
→ id, user_id
→ habit_name (TEXT)
→ habit_type (positive/negative/neutral)
→ category (TEXT)
→ total_occurrences, current_streak, longest_streak
→ last_logged (DATE)
→ avg_rating_with (avg rating on days habit appears)
→ avg_rating_without (avg rating on days without)

TABLE: weekly_insights
→ id, user_id
→ week_start, week_end (DATE)
→ avg_rating, avg_mood_score
→ positive_count, negative_count, neutral_count
→ top_wins (TEXT array)
→ areas_to_watch (TEXT array)
→ correlations (TEXT array)
→ suggestion (TEXT, one actionable weekly suggestion)
→ summary (TEXT)

TABLE: monthly_insights
→ id, user_id
→ month_year (TEXT, e.g. "2026-04")
→ avg_rating, avg_mood_score, total_entries
→ best_day, worst_day (DATE)
→ habits_formed, habits_declining (TEXT arrays)
→ weight_trend, sleep_trend, mood_trend (TEXT)
→ summary (TEXT)

TABLE: user_summaries
→ user_id (PK)
→ avg_wake_time, avg_sleep_time
→ avg_rating, avg_mood_score
→ rating_trend, mood_trend (improving/declining/stable)
→ top_positive_habits, top_negative_habits (TEXT arrays)
→ consistency_score (0-100)
→ total_days_logged
→ summary_text (pre-written context for AI)

═══════════════════════════════════════════════════
SECTION 5: FOLDER STRUCTURE
═══════════════════════════════════════════════════

src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx (redirects to /today or /auth)
│   ├── auth/
│   │   ├── page.tsx (Google + email login)
│   │   └── callback/route.ts
│   ├── today/
│   │   ├── page.tsx (server component)
│   │   └── TodayClient.tsx (client component)
│   ├── history/
│   │   ├── page.tsx
│   │   └── HistoryClient.tsx
│   ├── insights/
│   │   ├── page.tsx
│   │   └── InsightsClient.tsx
│   ├── settings/
│   │   └── page.tsx
│   └── api/
│       ├── parse-entry/route.ts
│       └── weekly-insights/route.ts
├── components/
│   ├── journal/
│   │   ├── JournalInput.tsx
│   │   ├── RatingSlider.tsx
│   │   ├── MoodSelector.tsx
│   │   ├── WeightInput.tsx
│   │   ├── ParsedEntryView.tsx
│   │   └── DailyMicroInsight.tsx
│   ├── insights/
│   │   ├── StreakCard.tsx
│   │   ├── StreakSection.tsx
│   │   ├── MoodTimeline.tsx
│   │   ├── RatingTrend.tsx
│   │   ├── WeeklySummaryCard.tsx
│   │   ├── CorrelationCard.tsx
│   │   └── SuggestionCard.tsx
│   ├── history/
│   │   ├── CalendarView.tsx
│   │   ├── DayDetail.tsx
│   │   └── MonthNavigator.tsx
│   ├── layout/
│   │   ├── BottomNav.tsx
│   │   ├── TopNav.tsx
│   │   └── PageWrapper.tsx
│   ├── onboarding/
│   │   └── OnboardingFlow.tsx
│   └── ui/
│       ├── Card.tsx
│       ├── Button.tsx
│       ├── Skeleton.tsx
│       ├── EmptyState.tsx
│       └── InstallPrompt.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── ai/
│   │   ├── gemini.ts
│   │   ├── local-parser.ts
│   │   ├── prompts.ts
│   │   └── parse-entry.ts
│   ├── store/
│   │   └── useStore.ts
│   ├── utils/
│   │   ├── dates.ts
│   │   ├── streaks.ts
│   │   └── correlations.ts
│   └── types/
│       └── index.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useJournal.ts
│   ├── useInsights.ts
│   └── useHabits.ts
└── public/
    ├── manifest.json
    ├── sw.js
    └── icons/

═══════════════════════════════════════════════════
SECTION 6: KEY FEATURES BUILT
═══════════════════════════════════════════════════

✅ AUTHENTICATION
→ Google OAuth (working on live URL)
→ Email and password signup/login
→ Auto-create profile on signup via DB trigger
→ Protected routes, redirect to /auth if not logged in

✅ NAME SETUP SCREEN
→ Appears once after first login
→ "What should we call you?" prompt
→ Saves name to profiles table
→ Uses localStorage 'stride_name_set' flag

✅ ONBOARDING
→ 3 screen flow shown once to new users
→ localStorage 'stride_onboarding_complete' flag
→ Skippable

✅ TODAY PAGE (Main Screen)
→ Dynamic greeting based on time of day:
   5AM-12PM  → Good Morning
   12PM-5PM  → Good Afternoon
   5PM-9PM   → Good Evening
   9PM-5AM   → Good Night
→ Shows current_log_date (not system date)
→ Large free-form text area
→ 1-10 rating slider (color coded red/amber/green)
→ 7 mood emoji selector with spring animation
→ Optional weight input
→ THREE STATES:
   State 1: No entry → show input form
   State 2: Entry saved, not analysed → show raw text
            + "Analyse My Day" button
   State 3: Entry analysed → show color coded view
            + mental state card + micro insight

✅ SAVE ENTRY (INSTANT, NO AI)
→ Saves raw_text, rating, mood, weight immediately
→ Under 1 second
→ NO Gemini call on save
→ User can edit and re-save as many times as needed

✅ ANALYSE MY DAY (SEPARATE, ON DEMAND)
→ User clicks when ready (end of day or whenever)
→ Triggers Gemini API call
→ Shows loading state during analysis
→ Color codes each line:
   Green  ✅ = positive
   Red    ❌ = negative  
   Gray   😐 = neutral
→ Shows mental state card
→ Shows AI micro insight (1-2 sentences)
→ Button disappears after analysis complete
→ If entry edited after analysis → button reappears

✅ MANUAL DAY CONTROL
→ User controls when new day starts
→ current_log_date stored in profiles table
→ "Start New Day →" button on today page
→ Confirmation modal before starting new day
→ Increments current_log_date by 1 day
→ Does NOT use system clock to change date
→ Reason: users may journal at 1AM-2AM and still
  consider it the same day

✅ HISTORY PAGE
→ Monthly calendar grid
→ Mood emoji on days with entries (no colored dots)
→ Tap day → DayDetail slides in
→ Shows color coded parsed entries for that day
→ Month navigation with arrows
→ Cannot navigate past current month
→ Streak count shown

✅ INSIGHTS PAGE (PROGRESSIVE UNLOCKING)
→ 0 days: empty state
→ 1-2 days: streaks visible
→ 3+ days: weekly report button unlocks
→ 7+ days: suggestion card
→ 14+ days: full correlations section
→ Sections:
   - Bit by Bit suggestion card (top)
   - Streaks section (active + declining bad habits)
   - Mood timeline (Recharts AreaChart, 30 days)
   - Rating trend (Recharts LineChart)
   - Weekly summary card
   - Correlation cards (only if diff > 1.0, 5+ samples)

✅ WEEKLY INSIGHTS (ON DEMAND)
→ "Generate Weekly Report" button on insights page
→ Calls /api/weekly-insights
→ Sends 7 days of structured data to Gemini
→ Returns: summary, top wins, areas to watch,
  correlations, one suggestion
→ Saves to weekly_insights table

✅ SETTINGS PAGE
→ Profile: name and email
→ Dark/Light mode toggle
→ Export data in 4 formats:
   📄 JSON  (raw data)
   📊 CSV   (spreadsheet)
   📑 PDF   (readable report via jspdf)
   📋 TXT   (plain text)
→ Stats: member since, days logged, current streak
→ About Stride section
→ Privacy section
→ Delete account (with confirmation)
→ Logout button

✅ PWA
→ manifest.json configured
→ Service worker for offline caching
→ Installable on iOS (Safari → Share → Add to Home)
→ Installable on Android (Chrome → Add to Home Screen)
→ Works as standalone app (no browser bar)

✅ DESIGN SYSTEM
Dark mode default:
→ Background: #0A0A0A
→ Cards: #141414
→ Positive: #4ADE80
→ Negative: #F87171
→ Neutral: #94A3B8
→ Accent: #818CF8
→ Text: #F1F5F9

═══════════════════════════════════════════════════
SECTION 7: AI ARCHITECTURE
═══════════════════════════════════════════════════

MODEL: gemini-2.5-flash-lite
WHY: Free tier available, good quality, low cost

LAYER 1 — LOCAL PARSER (lib/ai/local-parser.ts):
→ Runs before any API call
→ Regex extracts: wake time, sleep time, weight,
  rating, durations, basic keyword categories
→ Cost: $0 forever

LAYER 2 — GEMINI PARSE (lib/ai/gemini.ts):
→ Called when user clicks "Analyse My Day"
→ Receives raw text + local parser results
→ Returns structured JSON:
  - entries array (each line categorized)
  - mental_state object
  - micro_insight string
  - corrections to local parser
→ generationConfig: maxOutputTokens 8192, temp 0.1
→ Returns only valid JSON, no markdown

LAYER 3 — WEEKLY BATCH (api/weekly-insights):
→ Called when user clicks "Generate Weekly Report"
→ Sends 7 days of already-structured data (not raw)
→ Returns: summary, wins, areas, correlations,
  suggestion, encouragement

COST ESTIMATE:
→ 0-500 users: ~$0/month (free tier)
→ 500-2000 users: ~$10-25/month
→ 2000-10000 users: ~$50-150/month

═══════════════════════════════════════════════════
SECTION 8: KNOWN ISSUES AND FIXES APPLIED
═══════════════════════════════════════════════════

FIXED: Gemini model "gemini-2.0-flash" deprecated
→ Changed to "gemini-2.5-flash-lite"

FIXED: JSON truncation from Gemini
→ Added maxOutputTokens: 8192
→ Added robust JSON extraction with cleanup

FIXED: Timezone bug (UTC vs IST)
→ Using client-side date with toLocaleDateString('en-CA')
→ Not using toISOString() which gives UTC

FIXED: Google OAuth redirecting to localhost
→ redirectTo uses window.location.origin dynamically
→ Added https://stride-taupe.vercel.app/auth/callback
  to both Google Cloud Console and Supabase

FIXED: Slow navigation on mobile
→ Added loading.tsx skeleton files for each page
→ Added prefetch={true} to BottomNav Link components
→ Added suppressHydrationWarning to html tag

FIXED: Calendar colored dots looking weird with emoji
→ Removed colored dots from calendar
→ Only mood emoji shown on logged days

FIXED: Greeting always showing "Good Morning"
→ Using client-side new Date().getHours()
→ Not server-side time

═══════════════════════════════════════════════════
SECTION 9: DEPLOYMENT
═══════════════════════════════════════════════════

HOSTING: Vercel (free tier)
LIVE URL: https://stride-taupe.vercel.app

TO DEPLOY UPDATES:
git add .
git commit -m "description of changes"
git push
vercel --prod

ENVIRONMENT VARIABLES (set in Vercel dashboard):
→ Production + Preview environments
→ NEXT_PUBLIC_SUPABASE_URL
→ NEXT_PUBLIC_SUPABASE_ANON_KEY
→ SUPABASE_SERVICE_ROLE_KEY
→ GEMINI_API_KEY
→ NEXT_PUBLIC_APP_URL

SUPABASE CONFIG:
→ Site URL: https://stride-taupe.vercel.app
→ Redirect URLs: 
   http://localhost:3000/auth/callback
   https://stride-taupe.vercel.app/auth/callback

GOOGLE CLOUD CONSOLE:
→ Authorized JavaScript origins:
   https://stride-taupe.vercel.app
→ Authorized redirect URIs:
   https://pdswmfvazznaaxlmrxlh.supabase.co/auth/v1/callback
   https://stride-taupe.vercel.app/auth/callback

═══════════════════════════════════════════════════
SECTION 10: PENDING AND FUTURE FEATURES
═══════════════════════════════════════════════════

IMMEDIATE TODO:
→ Fix name setup screen (jashfiji14 issue)
→ Fix greeting time bug
→ Multiple export formats (CSV, PDF, TXT, JSON)
→ Better app icon (currently placeholder)

SHORT TERM (after testing with friends/family):
→ Daily reminder notifications
→ Custom domain (getStride.app or similar)
→ Connect GitHub to Vercel for auto-deploy
→ Proper app icons designed
→ Social sharing for streaks

LONG TERM (if traction):
→ Premium tier ($2.99/month):
   - AI chatbot (conversational)
   - Advanced analytics
   - Unlimited weekly reports
   - Custom categories
→ Native app via Capacitor wrapper
→ Watch app widget
→ Accountability partner feature
→ Monthly PDF email report

MONETIZATION PLAN:
→ Free forever for core features
→ Premium for power features
→ At 10K users: even 5% conversion at $2.99
  = $1,495/month which covers all costs

═══════════════════════════════════════════════════
SECTION 11: HOW TO USE THIS DOCUMENT
═══════════════════════════════════════════════════

FOR A NEW CLAUDE CHAT:
Paste this entire document and say:
"This is my Stride app context document. 
 I want to continue working on this project.
 [describe what you need help with]"

FOR A NEW CLAUDE CODE SESSION:
Paste this document and say:
"I am continuing to build the Stride app.
 Here is the complete context of what has been built.
 The codebase is at ~/Desktop/stride.
 I need help with: [describe the task]"

FOR DEBUGGING:
Include this document + the specific error message
+ the file where the error occurs.

UPDATE THIS DOCUMENT:
Every time a major feature is added or changed,
update the relevant section so it stays accurate.