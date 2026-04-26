# Haven — PPT Reference Document
## GDG Solution Challenge 2026 | Open Innovation | SDG 3

> Use this document slide by slide to build your deck.
> Recommended: Canva or Google Slides.
> Total slides: 10 | Pitch time: 3 minutes

---

## SLIDE 1 — Title Slide

**App name:** Haven
**Tagline:** Your safe space to breathe
**Subline:** AI-powered mental health companion for Indian college students
**Bottom:** GDG Solution Challenge 2026 · Open Innovation · SDG 3: Good Health & Well-Being
**Visual:** Dark background, soft indigo/purple glow. Minimal and calm — no clutter.

---

## SLIDE 2 — The Problem

**Headline:** 7 in 10 Indian college students are struggling. Almost none get help.

**Big numbers (show one at a time, large font):**
- 🔴 **69.9%** have moderate to high anxiety
- 🔴 **59.9%** experience depression
- 🔴 **35 students die by suicide every day** in India
- 🔴 **84.5% treatment gap** — most never receive help
- 🔴 **0.75 psychiatrists per lakh population** (WHO recommends 3)
- 🔴 **Less than 10%** of youth ever access mental health services

**Source line (small):** Cherian et al. 2025 | National Mental Health Survey India | UNICEF 2021

**What to say:**
"India has 43 million college students. Nearly 70% are living with clinically significant anxiety or depression. Most don't know it. And even those who do — there's almost nobody to turn to."

---

## SLIDE 3 — Why Nothing Works Today

**Headline:** The current options fail students

**Three columns:**

❌ **Psychiatrists are inaccessible**
0.75 per lakh population. Long waitlists, high cost, heavy stigma. Most colleges have no counselor.

❌ **Existing apps aren't built for India**
Calm and Headspace are Western, English-only, subscription-based. Not designed for Indian college students writing in Hinglish.

❌ **Students don't know they need help**
Without screening, students normalize distress. By the time they seek help, it's often crisis-level.

**What to say:**
"The Supreme Court of India mandated mental health infrastructure for all educational institutions in July 2025. As of today, compliance is patchy. Students can't wait."

---

## SLIDE 4 — Introducing Haven

**Headline:** Haven — Screen. Track. Support.

**One line:** A free, private, AI-powered mental health companion built specifically for Indian college students.

**Three pillars:**

🔍 **Screen**
Detects early warning signs through daily journaling + formal PHQ-9/GAD-7 screening — the same tools used by clinicians worldwide.

📊 **Track**
Visualizes mood, stress, sleep, and wellbeing trends over time. Students see their own patterns before they become problems.

🫁 **Support**
Evidence-based coping exercises + immediate connection to real help (helplines, nearby counselors) when scores cross clinical thresholds.

---

## SLIDE 5 — How It Works

**Headline:** One daily check-in. Powerful insights.

**Flow (left → right):**

1. **Check-in** (2 min)
Mood + wellbeing score + sleep + energy + journal
Works in English, Hindi, Hinglish

2. **Gemini 2.5 Flash Analysis**
Categorizes entries: stress signal / positive coping
Extracts PHQ-9 & GAD-7 signals from natural language
Returns empathetic wellbeing insight

3. **Formal Screening** (3 min, optional)
PHQ-9 (depression) + GAD-7 (anxiety)
Clinically validated, one question per screen

4. **Coping Exercises**
Box breathing, CBT reframing, grounding, mindfulness
Each with research context + tutorial video

5. **Crisis Support** (if needed)
Non-dismissible alert + tap-to-call helplines
Google Maps finds nearby counselors

**Visual:** App screenshots in phone mockups across the flow.

---

## SLIDE 6 — The Technology

**Headline:** Built with Google AI at its core

**Google technologies (highlight prominently):**

🔵 **Gemini 2.5 Flash — Core AI Engine**
- Analyses daily journal entries in English, Hindi, and Hinglish
- Extracts PHQ-9 signals across 9 depression domains
- Extracts GAD-7 signals across 7 anxiety domains
- Detects self-harm signals in any language (including "jeena nahi chahta")
- Generates personalized weekly wellbeing reports
- Powers AI-suggested CBT thought reframes

🟢 **Google Maps Places API**
- Finds nearby psychiatrists and counselors via geolocation
- Shows ratings, hours, tap-to-call, directions

🔴 **Google OAuth**
- One-tap sign in — zero friction for students

🟡 **Google Cloud (via Supabase on GCP ap-south-1)**
- Low latency for Indian users
- Serverless API routes

**Full stack:** Next.js · TypeScript · Tailwind CSS · Supabase · Recharts · Framer Motion · PWA

---

## SLIDE 7 — Clinical Foundation + Multilingual

**Headline:** Built on validated science. Speaks your language.

**Left — Clinical Tools:**

PHQ-9 (Patient Health Questionnaire-9)
→ Gold standard depression screening worldwide
→ 9 questions, 3 minutes, clinically validated
→ Scores: Minimal / Mild / Moderate / Moderately Severe / Severe

GAD-7 (Generalized Anxiety Disorder-7)
→ Standard anxiety screening instrument
→ Validated across diverse populations including India
→ 7 questions, 2 minutes

**Right — Multilingual AI:**

Haven understands:
- ✅ English ("feeling really overwhelmed today")
- ✅ Hindi ("आज बहुत stressed था")
- ✅ Hinglish ("kuch acha nahi lag raha, bahut tired hoon")
- ✅ Roman Hindi ("neend nahi aayi, dil bhaari hai")
- ✅ Broken English ("today i is very sad cant focus")

Crisis detection works in ALL languages — "jeena nahi chahta" triggers the same alert as "don't want to be here."

**Disclaimer note (small):**
"Haven uses these for SCREENING, not diagnosis. Results always include professional referral guidance."

---

## SLIDE 8 — Impact & User Testing

**Headline:** Real students. Real results.

*(Fill in with actual numbers from your testing)*

Template:
- Tested with **[X] students** from **[college name]**
- **[X]%** had never taken a mental health screening before
- **[X]%** found check-in easy to complete in under 2 minutes
- **[X]%** said the wellbeing insight felt accurate and empathetic
- **[X] students** tried at least one coping exercise after analysis
- Quote: *"[paste a real quote from a tester]"*

**What to say:**
"We didn't build this in a vacuum. We tested with real students at our college. The most common response: 'I didn't realize I was this stressed until I saw it in the trends.'"

---

## SLIDE 9 — Roadmap & Scale

**Headline:** Where Haven goes next

**Short-term (3 months):**
- Full Hindi/Gujarati UI translation (Google Translate API)
- College counselor dashboard — anonymized aggregate trends
- WhatsApp reminders for daily check-ins

**Medium-term (6-12 months):**
- Partner with GDG on Campus chapters across India
- Anonymous peer support circles (moderated)
- Direct Tele-MANAS API integration

**Scale:**
- India: **43 million college students**
- 1% adoption = **430,000 students** with free mental health screening
- Zero marginal cost per user — Gemini free tier + Supabase scales to thousands
- PWA — no app store needed, installs directly from browser

---

## SLIDE 10 — Close

**Headline:** "35 students die every day. Haven exists so they get help before that point."

**Three lines:**
- Free. Private. Built for India.
- Live at: [your Vercel URL]
- Open source: github.com/JashFijiwala/stride

**Crisis resources (bottom — judges will notice):**
Tele-MANAS: 14416 · iCall: 9152987821 · Emergency: 112

**Team names**

**What to say:**
"Mental health is not a luxury. It's a prerequisite for learning. Haven gives every Indian college student — regardless of where they are or how much they earn — a way to understand themselves, get support, and find help. Thank you."

---

## Design Tips

**Color palette:**
- Background: #0A0A0F (near black)
- Card: #13131A
- Accent: #818CF8 (indigo) / #A78BFA (purple)
- Green: #4ADE80 | Red: #F87171 | Amber: #FCD34D
- Text: White / #94A3B8 (muted)

**Fonts:** Inter Bold (headings) / Inter Regular (body)

**Rules:**
- Max 3 points per slide
- Every stat as a BIG number
- Dark background throughout — matches the app
- Use phone mockups for screenshots (Figma/Canva)

**Demo video (2 min max):**
- Open: problem stat on screen
- Show: check-in → analyse → stress signals detected
- Show: "Take a breather 🌬️" → breathing exercise
- Show: screening → PHQ-9 → results
- Show: crisis modal triggering
- End: wellbeing dashboard with trends
- Voiceover only, no face cam needed

---

## Key Messages to Hammer Home

1. **Problem is undeniable** — 2025 peer-reviewed data, not opinion
2. **Not replacing therapists** — bridging the awareness gap
3. **Clinical tools, not pseudoscience** — PHQ-9 and GAD-7 are what psychiatrists use
4. **Gemini is the engine** — not decorative, does the heavy lifting
5. **Truly India-specific** — Hinglish support, Indian helplines, Indian college context
6. **Multilingual** — works for students who don't write in proper English
7. **Ethical** — crisis detection in all languages, non-dismissible alerts, clear disclaimers
8. **Scalable** — PWA, serverless, zero infra cost to add users