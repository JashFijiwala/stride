'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Phone, MapPin, Star, ExternalLink, Loader2 } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Place {
  name: string
  address: string
  rating: number | null
  user_ratings_total: number | null
  formatted_phone_number: string | null
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const HELPLINES = [
  {
    name: 'Tele-MANAS',
    number: '14416',
    href: 'tel:14416',
    color: '#3B82F6',
    description:
      "India's national mental health helpline, run by the Ministry of Health. Free, 24/7, available in multiple languages including Hindi. Call or WhatsApp.",
  },
  {
    name: 'iCall',
    number: '9152987821',
    href: 'tel:9152987821',
    color: '#A78BFA',
    description:
      'Run by TISS (Tata Institute of Social Sciences). Trained counselors available Monday–Saturday, 8am–10pm. Also offers email and chat support.',
  },
  {
    name: 'Vandrevala Foundation',
    number: '1860-2662-345',
    href: 'tel:18602662345',
    color: '#818CF8',
    description: '24/7 mental health helpline. Free and confidential. Speaks to you in your language.',
  },
  {
    name: 'Emergency',
    number: '112',
    href: 'tel:112',
    color: '#F87171',
    description: 'For immediate danger to yourself or others.',
  },
]

const PLATFORMS = [
  {
    name: 'Wysa',
    description:
      'AI-powered mental health app with CBT tools, mood tracking, and access to real therapists',
    href: 'https://www.wysa.com',
    label: 'Visit Wysa →',
    color: '#3B82F6',
  },
  {
    name: 'YourDOST',
    description:
      'Online counseling platform with Indian therapists. Offers text, audio, and video sessions.',
    href: 'https://yourdost.com',
    label: 'Visit YourDOST →',
    color: '#818CF8',
  },
  {
    name: 'Amaha',
    description:
      'Structured mental health programs designed by clinical experts for anxiety, stress, and depression.',
    href: 'https://www.amahahealth.com',
    label: 'Visit Amaha →',
    color: '#A78BFA',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

type GeoStatus = 'idle' | 'loading' | 'results' | 'denied' | 'fallback'

export default function ResourcesPage() {
  const router = useRouter()
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle')
  const [places, setPlaces] = useState<Place[]>([])

  async function findNearby() {
    setGeoStatus('loading')

    if (!navigator.geolocation) {
      setGeoStatus('fallback')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        try {
          const res = await fetch(
            `/api/maps-proxy?q=${encodeURIComponent('psychiatrist mental health counselor')}&lat=${lat}&lng=${lng}`
          )
          const data: { places?: Place[]; error?: string } = await res.json()
          if (data.error) {
            setGeoStatus('fallback')
            return
          }
          setPlaces(data.places ?? [])
          setGeoStatus('results')
        } catch {
          setGeoStatus('fallback')
        }
      },
      () => {
        setGeoStatus('denied')
      }
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          aria-label="Go back"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Get Support</h1>
          <p className="text-sm text-[var(--text-muted)]">
            You don&apos;t have to face this alone. These resources are free and confidential.
          </p>
        </div>
      </div>

      {/* ── Section A: National Helplines ─────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="mb-1 text-base font-semibold text-[var(--text-primary)]">
          National Helplines
        </h2>
        <p className="mb-4 text-sm text-[var(--text-muted)]">
          Free, confidential, available in India
        </p>
        <div className="space-y-3">
          {HELPLINES.map((h) => (
            <div
              key={h.name}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
            >
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{h.name}</p>
                  <a
                    href={h.href}
                    className="mt-0.5 block text-2xl font-bold transition-opacity hover:opacity-80"
                    style={{ color: h.color }}
                  >
                    {h.number}
                  </a>
                </div>
                <a
                  href={h.href}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: h.color }}
                >
                  <Phone size={13} />
                  Call now
                </a>
              </div>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                {h.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section B: Online Platforms ───────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="mb-1 text-base font-semibold text-[var(--text-primary)]">
          Online Support Platforms
        </h2>
        <p className="mb-4 text-sm text-[var(--text-muted)]">
          Accessible therapy and self-help from your phone
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PLATFORMS.map((p) => (
            <div
              key={p.name}
              className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
            >
              <p className="font-semibold text-[var(--text-primary)]">{p.name}</p>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                {p.description}
              </p>
              <a
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-80"
                style={{ color: p.color }}
              >
                <ExternalLink size={13} />
                {p.label}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section C: Find Nearby Counselors ─────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="mb-1 text-base font-semibold text-[var(--text-primary)]">
          Find Help Near You
        </h2>
        <p className="mb-4 text-sm text-[var(--text-muted)]">
          Mental health professionals in your area
        </p>

        {/* Initial state */}
        {geoStatus === 'idle' && (
          <motion.button
            onClick={findNearby}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <MapPin size={15} />
            Find counselors near me
          </motion.button>
        )}

        {/* Loading */}
        {geoStatus === 'loading' && (
          <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
            <Loader2 size={16} className="animate-spin" />
            Finding nearby counselors…
          </div>
        )}

        {/* Results */}
        {geoStatus === 'results' && (
          <div className="space-y-3">
            {places.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                No results found near you. Try searching on Google Maps:
              </p>
            ) : (
              places.map((place, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[var(--text-primary)]">{place.name}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">{place.address}</p>
                      {place.rating && (
                        <div className="mt-1 flex items-center gap-1">
                          <Star size={11} className="fill-amber-400 text-amber-400" />
                          <span className="text-xs text-[var(--text-muted)]">
                            {place.rating.toFixed(1)}
                            {place.user_ratings_total
                              ? ` (${place.user_ratings_total})`
                              : ''}
                          </span>
                        </div>
                      )}
                      {place.formatted_phone_number && (
                        <a
                          href={`tel:${place.formatted_phone_number.replace(/\D/g, '')}`}
                          className="mt-1 block text-xs font-medium text-[var(--accent)] hover:underline"
                        >
                          {place.formatted_phone_number}
                        </a>
                      )}
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${place.name} ${place.address}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--card-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                    >
                      Get directions
                    </a>
                  </div>
                </div>
              ))
            )}
            <a
              href="https://www.google.com/maps/search/mental+health+counselor+near+me"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm font-medium text-[var(--accent)] hover:underline"
            >
              Search on Google Maps →
            </a>
          </div>
        )}

        {/* Denied or fallback */}
        {(geoStatus === 'denied' || geoStatus === 'fallback') && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-sm text-[var(--text-secondary)]">
              {geoStatus === 'denied'
                ? 'Enable location access to find nearby counselors, or search on Google Maps:'
                : 'Enable location access to find nearby counselors, or search on Google Maps:'}
            </p>
            <a
              href="https://www.google.com/maps/search/mental+health+counselor+near+me"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block text-sm font-medium text-[var(--accent)] hover:underline"
            >
              Search on Google Maps →
            </a>
          </div>
        )}
      </section>

      {/* Disclaimer */}
      <p className="pb-4 text-center text-xs leading-relaxed text-[var(--text-muted)]">
        If you are in immediate danger, call <a href="tel:112" className="font-semibold underline">112</a> now.
      </p>
    </div>
  )
}
