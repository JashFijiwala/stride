# Haven — PPT Reference Document
## GDG Solution Challenge 2026 | Open Innovation | SDG 3

> Use this document slide by slide to build your deck.
> Recommended tool: Canva or Google Slides.
> Total slides: 10 | Pitch time: 3 minutes

---

## SLIDE 1 — Title Slide

**Headline:** Haven 🧠
**Subline:** AI-powered mental health screening for Indian college students
**Bottom:** GDG Solution Challenge 2026 · Open Innovation · SDG 3: Good Health & Well-Being
**Visual idea:** Dark background, soft indigo glow, the Haven logo/name centered. Clean and minimal.

---

## SLIDE 2 — The Problem (Make them feel it)

**Headline:** 7 in 10 Indian college students are struggling. Almost none get help.

**Stats to show (big numbers, one at a time):**
- 🔴 **69.9%** have moderate to high anxiety
- 🔴 **59.9%** experience depression
- 🔴 **35 students die by suicide every day** in India
- 🔴 **84.5% treatment gap** — most never receive help
- 🔴 Only **0.75 psychiatrists per lakh population** (WHO recommends 3)
- 🔴 **Less than 10%** of youth ever access mental health services

**Source line (small, bottom):** Cherian et al. 2025 | National Mental Health Survey India | UNICEF 2021

**What to say:**
"India has 43 million college students. Nearly 70% are living with clinically significant anxiety or depression. Most don't know it. And even those who do — there's nobody to turn to. The infrastructure simply doesn't exist."

---

## SLIDE 3 — Why Existing Solutions Don't Work

**Headline:** The current options fail students

**Three problems (3 columns or 3 boxes):**

❌ **Psychiatrists are inaccessible**
Long waitlists, high cost, stigma. 0.75 per lakh population. Most colleges have no counselor at all.

❌ **Generic apps aren't built for India**
Apps like Calm and Headspace are western, English-only, subscription-based, and focused on wellness — not early screening.

❌ **Students don't know they need help**
Without any screening, students normalize their distress. By the time they seek help, it's often crisis-level.

**What to say:**
"The Supreme Court of India mandated mental health infrastructure for all educational institutions in July 2025. As of today, compliance is patchy. Students can't wait for institutions to catch up."

---

## SLIDE 4 — Introducing Haven

**Headline:** Haven — Screen. Track. Support.

**One line:** A free, private, AI-powered mental health companion built specifically for Indian college students.

**Three pillars (icons + 2 lines each):**

🔍 **Screen**
Detects early mental health signals through daily journaling + formal PHQ-9/GAD-7 screening tools — the same instruments used by clinicians worldwide.

📊 **Track**
Visualizes mood, stress, sleep, and wellbeing trends over time. Students see their own patterns before they become problems.

🫁 **Support**
Evidence-based coping exercises + immediate connection to real help (helplines, nearby counselors) when scores cross clinical thresholds.

**Visual idea:** Three-column layout with icons, clean dark card design.

---

## SLIDE 5 — How It Works (Demo Slide)

**Headline:** One daily check-in. Powerful insights.

**Show a flow (left to right with arrows or numbered steps):**

1. **Check-in** (30 seconds)
   Mood emoji + wellbeing score + sleep + energy + journal

2. **AI Analysis** (Gemini 2.0 Flash)
   Categorizes entries as stress signals / positive coping
   Extracts PHQ-9 & GAD-7 signals from natural language
   Returns empathetic wellbeing insight

3. **Formal Screening** (optional, 3 minutes)
   PHQ-9 (depression) + GAD-7 (anxiety)
   Clinically validated, one question per screen

4. **Coping Exercises** (2-10 minutes)
   Box breathing, CBT reframing, grounding, mindfulness

5. **Get Help** (if needed)
   Crisis modal + tap-to-call helplines + nearby counselors via Google Maps

**Visual idea:** App screenshots in phone mockups across the flow. Or a simple numbered flow diagram.

---

## SLIDE 6 — The Technology (Google Tech Depth)

**Headline:** Built with Google AI at its core

**Google technologies (highlight these prominently — judges score this):**

🔵 **Gemini 2.0 Flash**
- Daily journal analysis — categorizes each sentence as stress signal, positive coping, or neutral
- Extracts soft PHQ-9 & GAD-7 signal estimates from natural language (9 depression domains + 7 anxiety domains)
- Generates personalized weekly wellbeing reports
- Powers AI-suggested CBT thought reframes

🟢 **Google Maps Places API**
- Finds nearby psychiatrists and counselors using browser geolocation
- Shows ratings, hours, directions — real, actionable help

🔴 **Google OAuth**
- One-tap sign in with Google — zero friction for students

🟡 **Google Cloud (via Supabase on GCP)**
- Serverless API routes, ap-south-1 region for low latency in India

**Full stack:** Next.js · TypeScript · Tailwind CSS · Supabase · Recharts · Framer Motion · PWA

---

## SLIDE 7 — Clinical Foundation

**Headline:** Grounded in validated clinical science

**Left column — PHQ-9:**
Patient Health Questionnaire-9
→ Gold standard depression screening tool
→ Used by clinicians worldwide since 2001
→ Free, validated, 9 questions, 3 minutes
→ Scores map to: Minimal / Mild / Moderate / Moderately Severe / Severe

**Right column — GAD-7:**
Generalized Anxiety Disorder Scale-7
→ Standard anxiety screening instrument
→ Validated across diverse populations including India
→ 7 questions, 2 minutes
→ Same severity categories

**Bottom note:**
"Haven uses these instruments for SCREENING, not diagnosis. All results are accompanied by disclaimers and professional referrals where appropriate. The AI extracts SOFT SIGNALS from journal text as a supplementary layer — never as a replacement for formal assessment."

**What to say:**
"We didn't invent the science. We made it accessible. PHQ-9 and GAD-7 are the same tools that psychiatrists use. We put them in a student's pocket, for free."

---

## SLIDE 8 — Impact & User Testing

**Headline:** Real students. Real results.

**This slide needs your actual user testing data — fill in after testing with classmates.**

Template (fill in with real numbers):
- Tested with **[X] students** from **[your college name]**
- **[X]%** said they had never taken a mental health screening before
- **[X]%** found the daily check-in easy to complete in under 2 minutes
- **[X]%** said the wellbeing insight felt accurate and empathetic
- **[X] students** used at least one coping exercise after their analysis
- User feedback: *"[paste a real quote from a tester]"*

**If you have before/after mood scores from testing:**
Show a simple chart — avg mood score day 1 vs day 7.

**What to say:**
"We didn't build this in a vacuum. We tested with real students at our college. Here's what they told us."

---

## SLIDE 9 — Roadmap & Scale

**Headline:** Where Haven goes next

**Short-term (next 3 months):**
- Multilingual support — Hindi, Gujarati, Tamil (Google Translate API)
- College counselor dashboard — anonymized aggregate trends for institutions
- WhatsApp integration for daily check-in reminders

**Medium-term (6-12 months):**
- Partner with 10 GDG on Campus chapters to onboard students at scale
- Anonymous peer support circles (moderated, safe)
- Integration with Tele-MANAS API for direct helpline connection

**Scale potential:**
- India has **43 million college students**
- Target: 1% adoption = **430,000 students** with access to mental health screening
- Zero marginal cost per user — AI inference + Supabase free tier scales to thousands

**Visual idea:** A simple timeline or three-phase roadmap graphic.

---

## SLIDE 10 — Close

**Headline:** "35 students die every day. Haven exists so they get help before that point."

**Three lines:**
- Free. Private. Built for India.
- Available now at: [your Vercel URL]
- Open source: github.com/JashFijiwala/stride (mindlens branch)

**Crisis resources (show at bottom — judges will notice this):**
Tele-MANAS: 14416 · iCall: 9152987821 · Emergency: 112

**Team names**

**What to say:**
"Mental health is not a luxury. It's a prerequisite for learning. Haven gives every Indian college student — regardless of where they are or how much they earn — a way to understand themselves, get support, and find help. Thank you."

---

## Design Tips for the Deck

**Color palette:**
- Background: #0A0A0F (near black)
- Card: #13131A
- Accent primary: #818CF8 (indigo)
- Accent secondary: #A78BFA (purple)
- Green: #4ADE80
- Red: #F87171
- Text: White / #94A3B8 (muted)

**Fonts:**
- Headings: Inter Bold or Poppins SemiBold
- Body: Inter Regular

**Slide design rules:**
- Max 3 points per slide
- Every stat as a BIG number, not buried in text
- Use phone mockups (from Figma or Canva) for app screenshots
- Dark background throughout — matches the app's dark theme

**Demo video tips (if recording separately):**
- Start with the problem stat (big number on screen)
- Show: check-in → analyse → see stress signals → tap "Take a breather" → breathing exercise
- End with: crisis modal triggering + helpline numbers showing
- Voiceover only — no face cam needed
- Max 2 minutes. Keep it tight.

---

## Key Messages to Hammer Home

1. **The problem is undeniable** — peer-reviewed 2025 data, not speculation
2. **We're not replacing therapists** — we're bridging the awareness gap
3. **Clinical tools, not pseudoscience** — PHQ-9 and GAD-7 are what psychiatrists use
4. **Google AI is the engine** — Gemini isn't decorative, it's doing the heavy lifting
5. **India-specific** — multilingual (planned), India helplines, Indian college context
6. **Scalable** — PWA, serverless, zero infra cost to add users
7. **Ethical** — crisis detection, non-dismissible alerts, clear disclaimers throughout
