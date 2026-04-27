import { Link } from 'react-router-dom'
import { ArrowRight, Heart, Users, Award } from 'lucide-react'
import { useEffect, useState } from 'react'

// Load a small sample of available pets from backend `/api/pets/` (user view)
// Shows first 4 pets on the Home page.

export default function Home() {
  // Load shelters from backend user endpoint `/api/shelters/` and display them on Home
  const [shelters, setShelters] = useState([])
  const [loadingShelters, setLoadingShelters] = useState(false)
  const [sheltersError, setSheltersError] = useState(null)

  // Prefer explicit VITE_API_URL when set; otherwise use relative paths so dev proxy can forward requests
  const API_BASE = import.meta.env.VITE_API_URL ?? ''
  const shouldUseCredentials = (() => {
    try {
      const envFlag = String(import.meta.env?.VITE_USE_CREDENTIALS || '').toLowerCase() === 'true'
      if (envFlag) return true
      if (typeof window !== 'undefined') {
        const apiOrigin = new URL(API_BASE).origin
        return apiOrigin === window.location.origin
      }
    } catch (_) {}
    return false
  })()

  useEffect(() => {
    let mounted = true
    const loadShelters = async () => {
      setLoadingShelters(true)
      setSheltersError(null)
      try {
        const token = localStorage.getItem('access')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const opts = { headers }
        if (shouldUseCredentials) opts.credentials = 'include'
        const res = await fetch(`${API_BASE}/api/shelters/`, opts)
        if (!res.ok) {
          const text = await res.text().catch(() => '')
          throw new Error(`Error ${res.status}: ${text || res.statusText}`)
        }
        const data = await res.json()
        const items = Array.isArray(data) ? data : data.results || []
        if (mounted) setShelters(items.slice(0, 4))
      } catch (err) {
        if (mounted) setSheltersError(err.message || 'Failed to load shelters')
      } finally {
        if (mounted) setLoadingShelters(false)
      }
    }
    loadShelters()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [selectedShelter, setSelectedShelter] = useState(null)
  const handleShelterBackdrop = (e) => {
    if (e.target === e.currentTarget) setSelectedShelter(null)
  }

  const benefits = [
    {
      icon: <Heart size={32} className="text-amber-600" />,
      title: 'Save a Life',
      description: 'Give a loving home to a pet in need and make a difference',
    },
    {
      icon: <Users size={32} className="text-amber-600" />,
      title: 'Family Joy',
      description: 'Bring happiness and companionship to your home',
    },
    {
      icon: <Award size={32} className="text-amber-600" />,
      title: 'Full Support',
      description: 'We provide guidance and support throughout the adoption process',
    },
  ]

  return (
    <div className="w-full">
      <section className="bg-gradient-to-r from-amber-50 to-orange-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Find Your Perfect Pet
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Discover loving pets waiting for their forever homes. Start your journey with PawPal today!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/available-pets" className="bg-amber-600 text-white px-8 py-3 rounded-lg hover:bg-amber-700 transition flex items-center justify-center gap-2">
                Browse Pets <ArrowRight size={20} />
              </Link>
              <Link to="/how-to-adopt" className="bg-white text-amber-600 border-2 border-amber-600 px-8 py-3 rounded-lg hover:bg-amber-50 transition flex items-center justify-center">
                Learn More
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <img src="/happy-family-with-pets.jpg" alt="Happy family with pets" className="w-full rounded-lg shadow-lg" />
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Shelters</h2>
            <p className="text-xl text-gray-600">Browse shelters near you</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {loadingShelters ? (
              <div className="col-span-full text-center p-12 bg-white rounded-lg">Loading shelters…</div>
            ) : sheltersError ? (
              <div className="col-span-full text-center p-8 bg-white rounded-lg">
                <p className="text-red-600 font-semibold mb-2">Could not load shelters: {sheltersError}</p>
                <Link to="/available-pets" className="text-amber-600 underline">View all pets</Link>
              </div>
            ) : (
              shelters.map((s) => (
                <div key={s.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden cursor-pointer" onClick={() => setSelectedShelter(s)}>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{s.Name || s.name || `Shelter ${s.id}`}</h3>
                    <p className="text-amber-600 font-semibold mb-1">{s.Location || s.location || 'Unknown location'}</p>
                    <p className="text-gray-600 mb-4">Contact: {s.Contact || s.contact || '-'}</p>
                    <div className="w-full text-left">
                      <span className="inline-block bg-amber-100 text-amber-800 px-3 py-1 rounded text-sm">View details</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="text-center">
            {/* Shelters are listed inline on the Home page — no separate list page */}
          </div>
        </div>
      </section>

      {selectedShelter && (
        <div onClick={handleShelterBackdrop} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedShelter.Name || selectedShelter.name || `Shelter ${selectedShelter.id}`}</h2>
                  <p className="text-amber-600 font-semibold">{selectedShelter.Location || selectedShelter.location || 'Unknown location'}</p>
                </div>
                <button onClick={() => setSelectedShelter(null)} className="text-gray-500 hover:text-gray-700">Close</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-700 mb-4"><strong>Contact:</strong> {selectedShelter.Contact || selectedShelter.contact || '-'}</p>
                  {selectedShelter.Description && <p className="text-gray-600 mb-4">{selectedShelter.Description}</p>}
                </div>
                <div>
                  {/* Placeholder for image or map if available */}
                  <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">No image</div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button onClick={() => setSelectedShelter(null)} className="px-4 py-2 bg-amber-600 text-white rounded">Close</button>
                <Link to="/available-pets" className="px-4 py-2 border border-amber-600 text-amber-600 rounded">View Pets</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Why Adopt?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-8 text-center hover:shadow-lg transition">
                <div className="flex justify-center mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-amber-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Find Your Companion?</h2>
          <p className="text-xl mb-8 opacity-90">
            Our adoption process is simple and supportive. We're here to help every step of the way.
          </p>
          <Link to="/available-pets" className="inline-flex items-center gap-2 bg-white text-amber-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition font-semibold">
            Start Browsing <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  )
}
