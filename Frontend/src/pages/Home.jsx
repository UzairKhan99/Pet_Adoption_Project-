import { Link } from 'react-router-dom'
import { ArrowRight, Award, Heart, HeartHandshake, MapPin, PawPrint, Sparkles, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

const fallbackShelters = [
  { id: 'demo-1', Name: 'Safe Paws Shelter', Location: 'Lahore', Contact: '+92 300 1234567' },
  { id: 'demo-2', Name: 'Happy Tails Rescue', Location: 'Islamabad', Contact: '+92 301 5556677' },
  { id: 'demo-3', Name: 'Second Chance Home', Location: 'Karachi', Contact: '+92 321 7788990' },
  { id: 'demo-4', Name: 'Kind Hearts Animal Care', Location: 'Rawalpindi', Contact: '+92 333 1122334' },
]

const featuredPets = [
  { name: 'Buddy', type: 'Golden Retriever', image: '/golden-retriever.jpg' },
  { name: 'Luna', type: 'Calico Cat', image: '/calico-cat.jpg' },
  { name: 'Max', type: 'Beagle', image: '/beagle-dog.jpg' },
]

const benefits = [
  {
    icon: Heart,
    title: 'Save a Life',
    description: 'Give a pet safety, comfort, and the kind of everyday love they have been waiting for.',
  },
  {
    icon: Users,
    title: 'Family Joy',
    description: 'Find companions matched for real homes, real routines, and real personalities.',
  },
  {
    icon: Award,
    title: 'Guided Support',
    description: 'Get clear adoption steps, shelter details, and support from first browse to welcome home.',
  },
]

export default function Home() {
  const [shelters, setShelters] = useState([])
  const [loadingShelters, setLoadingShelters] = useState(false)
  const [selectedShelter, setSelectedShelter] = useState(null)

  const API_BASE = import.meta.env.VITE_API_URL ?? ''
  const shouldUseCredentials = (() => {
    try {
      const envFlag = String(import.meta.env?.VITE_USE_CREDENTIALS || '').toLowerCase() === 'true'
      if (envFlag) return true
      if (typeof window !== 'undefined' && API_BASE) {
        const apiOrigin = new URL(API_BASE).origin
        return apiOrigin === window.location.origin
      }
    } catch {
      return false
    }
    return false
  })()

  useEffect(() => {
    let mounted = true

    const loadShelters = async () => {
      setLoadingShelters(true)
      try {
        const token = localStorage.getItem('access')
        const opts = { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        if (shouldUseCredentials) opts.credentials = 'include'

        const res = await fetch(`${API_BASE}/api/shelters/`, opts)
        const contentType = res.headers.get('content-type') || ''
        if (!res.ok || !contentType.includes('application/json')) {
          throw new Error('Shelters unavailable')
        }

        const data = await res.json()
        const items = Array.isArray(data) ? data : data.results || []
        if (mounted) setShelters(items.slice(0, 4))
      } catch {
        if (mounted) setShelters(fallbackShelters)
      } finally {
        if (mounted) setLoadingShelters(false)
      }
    }

    loadShelters()
    return () => {
      mounted = false
    }
  }, [])

  const handleShelterBackdrop = (e) => {
    if (e.target === e.currentTarget) setSelectedShelter(null)
  }

  return (
    <main className="w-full overflow-hidden bg-background">
      <section className="relative min-h-[calc(100vh-4rem)] bg-stone-950 text-white">
        <img
          src="/happy-family-with-pets.jpg"
          alt="Happy family with adopted pets"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/70 to-stone-950/10" />
        <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
              <Sparkles size={16} className="text-amber-300" />
              Adoption made warmer, clearer, and faster
            </div>
            <h1 className="mb-6 text-5xl font-black leading-[0.95] md:text-7xl">
              Find the pet that feels like home.
            </h1>
            <p className="mb-8 max-w-xl text-lg leading-8 text-stone-100 md:text-xl">
              Browse loving pets, discover nearby shelters, and start an adoption journey that feels simple from the first click.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/available-pets"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-7 py-4 font-bold text-stone-950 shadow-xl shadow-amber-500/20 transition hover:bg-amber-400"
              >
                Browse Pets <ArrowRight size={20} />
              </Link>
              <Link
                to="/how-to-adopt"
                className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-7 py-4 font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                How Adoption Works
              </Link>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="ml-auto max-w-md rounded-[2rem] border border-white/20 bg-white/15 p-4 shadow-2xl backdrop-blur-md">
              <div className="grid gap-4">
                {featuredPets.map((pet) => (
                  <Link
                    to="/available-pets"
                    key={pet.name}
                    className="group grid grid-cols-[6rem_1fr_auto] items-center gap-4 rounded-3xl bg-white p-3 text-stone-900 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <img src={pet.image} alt={pet.name} className="h-24 w-24 rounded-2xl object-cover" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Featured</p>
                      <h3 className="text-2xl font-black">{pet.name}</h3>
                      <p className="text-sm text-stone-500">{pet.type}</p>
                    </div>
                    <ArrowRight className="text-amber-600 transition group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="-mt-10 relative z-10 px-4">
        <div className="mx-auto grid max-w-6xl gap-4 rounded-3xl bg-white p-5 shadow-soft md:grid-cols-3">
          {[
            ['5,000+', 'pets helped'],
            ['50+', 'partner shelters'],
            ['24/7', 'adoption tracking'],
          ].map(([number, label]) => (
            <div key={label} className="rounded-2xl bg-amber-50 px-6 py-5 text-center">
              <p className="text-3xl font-black text-primary">{number}</p>
              <p className="font-semibold text-stone-600">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-sm font-bold text-teal-700">
                <MapPin size={16} /> Nearby partners
              </p>
              <h2 className="text-4xl font-black text-stone-950 md:text-5xl">Shelters with open hearts</h2>
            </div>
            <Link to="/available-pets" className="inline-flex items-center gap-2 font-bold text-primary hover:text-amber-700">
              View pets <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {loadingShelters ? (
              <div className="col-span-full rounded-3xl bg-stone-50 p-12 text-center font-semibold text-stone-500">Loading shelters...</div>
            ) : (
              shelters.map((s, index) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedShelter(s)}
                  className="group overflow-hidden rounded-3xl bg-white text-left shadow-md ring-1 ring-stone-200 transition hover:-translate-y-1 hover:shadow-2xl"
                >
                  <img
                    src={index % 2 === 0 ? '/happy-family-with-dogs.jpg' : '/family-with-adopted-pets.jpg'}
                    alt=""
                    className="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="p-5">
                    <h3 className="mb-2 text-xl font-black text-stone-950">{s.Name || s.name || `Shelter ${s.id}`}</h3>
                    <p className="mb-3 flex items-center gap-2 text-sm font-bold text-primary">
                      <MapPin size={16} /> {s.Location || s.location || 'Unknown location'}
                    </p>
                    <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">
                      View details
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </section>

      {selectedShelter && (
        <div onClick={handleShelterBackdrop} className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-sm">
          <div className="grid w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-[0.95fr_1.05fr]">
            <img src="/happy-family-with-dogs.jpg" alt="" className="h-full min-h-72 w-full object-cover" />
            <div className="p-7">
              <p className="mb-2 text-sm font-bold uppercase tracking-widest text-primary">Shelter partner</p>
              <h2 className="mb-2 text-3xl font-black text-stone-950">
                {selectedShelter.Name || selectedShelter.name || `Shelter ${selectedShelter.id}`}
              </h2>
              <p className="mb-5 font-semibold text-stone-600">{selectedShelter.Location || selectedShelter.location || 'Unknown location'}</p>
              <div className="space-y-3 rounded-2xl bg-stone-50 p-4 text-stone-700">
                <p><strong>Contact:</strong> {selectedShelter.Contact || selectedShelter.contact || '-'}</p>
                <p>{selectedShelter.Description || 'This shelter is ready to help you find a companion who matches your home and routine.'}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/available-pets" className="rounded-full bg-primary px-5 py-3 font-bold text-white hover:bg-amber-700">View Pets</Link>
                <button onClick={() => setSelectedShelter(null)} className="rounded-full border border-stone-300 px-5 py-3 font-bold text-stone-700 hover:bg-stone-50">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="bg-stone-50 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <p className="mb-2 font-bold uppercase tracking-widest text-primary">Why PawPal</p>
            <h2 className="text-4xl font-black text-stone-950 md:text-5xl">A better adoption experience</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon
              return (
                <article key={benefit.title} className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-stone-200 transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-primary">
                    <Icon size={28} />
                  </div>
                  <h3 className="mb-3 text-2xl font-black text-stone-950">{benefit.title}</h3>
                  <p className="leading-7 text-stone-600">{benefit.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-primary py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 font-bold text-amber-100">
              <HeartHandshake size={20} /> Ready when you are
            </p>
            <h2 className="text-4xl font-black md:text-5xl">Meet your next best friend.</h2>
          </div>
          <Link to="/available-pets" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 font-black text-primary shadow-xl hover:bg-amber-50">
            Start Browsing <PawPrint size={20} />
          </Link>
        </div>
      </section>
    </main>
  )
}
