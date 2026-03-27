"use client"

import { useState, useEffect } from "react"
import { Search, Filter, X } from "lucide-react"

export default function AvailablePets() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedPet, setSelectedPet] = useState(null)
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [authRequired, setAuthRequired] = useState(false)
  const [adoptionFeedback, setAdoptionFeedback] = useState(null)
  const [adoptionLoadingId, setAdoptionLoadingId] = useState(null)

  const API_BASE = import.meta.env.VITE_API_URL ?? ""

  // -------------------------------------------------------
  // IMAGE MAPPING SYSTEM
  // -------------------------------------------------------
  const petImages = {
    dog: [
      "/beagle-dog.jpg",
      "/german-shepherd.jpg",
      "/golden-retriever.jpg",
      "/labrador-dog.jpg"
    ],
    cat: [
      "/black-cat.jpg",
      "/calico-cat.png",
      "/calico-cat.jpg",
      "/cat1.jpg"
    ]
  }

  const getPetImage = (pet) => {
    const species = String(pet.Species || pet.species || "").toLowerCase()

    if (species === "dog") {
      const imgs = petImages.dog
      return imgs[pet.id % imgs.length]
    }

    if (species === "cat") {
      const imgs = petImages.cat
      return imgs[pet.id % imgs.length]
    }

    return "/placeholder.svg"
  }

  // -------------------------------------------------------
  // API URL BUILDER
  // -------------------------------------------------------
  const buildApiUrl = (path) => {
    const trimmedBase = API_BASE.replace(/\/+$/, "")
    const normalizedPath = path.startsWith("/") ? path : `/${path}`
    return trimmedBase ? `${trimmedBase}${normalizedPath}` : normalizedPath
  }

  // -------------------------------------------------------
  // CREDENTIAL DETECTION
  // -------------------------------------------------------
  const shouldUseCredentials = (() => {
    try {
      const envFlag = String(import.meta.env?.VITE_USE_CREDENTIALS || "").toLowerCase() === "true"
      if (envFlag) return true
      if (typeof window !== "undefined") {
        const apiOrigin = new URL(API_BASE).origin
        return apiOrigin === window.location.origin
      }
    } catch (_) {}
    return false
  })()

  // -------------------------------------------------------
  // SPECIES / BREED NORMALIZER
  // -------------------------------------------------------
  const normalizeSpeciesBreed = (pet) => {
    const rawBreed = String(pet.Breed ?? "").trim()
    const rawSpecies = String(pet.Species ?? "").trim()

    const a = rawBreed.toLowerCase()
    const b = rawSpecies.toLowerCase()

    const knownSpecies = new Set([
      "dog", "cat", "bird", "rabbit", "hamster",
      "guinea pig", "guineapig", "reptile", "fish",
      "rodent", "ferret", "other", "unknown"
    ])

    if (knownSpecies.has(a)) {
      return { species: rawBreed || rawSpecies, breed: rawSpecies || rawBreed }
    }

    if (knownSpecies.has(b)) {
      return { species: rawSpecies || rawBreed, breed: rawBreed || rawSpecies }
    }

    return { species: rawSpecies || rawBreed, breed: rawBreed || rawSpecies }
  }

  // -------------------------------------------------------
  // LOAD PETS
  // -------------------------------------------------------
  const loadPets = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem("access")
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const fetchOpts = { headers }
      if (shouldUseCredentials) fetchOpts.credentials = "include"

      const res = await fetch(buildApiUrl("/api/pets/"), fetchOpts)

      if (res.status === 401) {
        setAuthRequired(true)
        setError("Authentication required")
        setLoading(false)
        return
      }

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Error ${res.status}: ${text || res.statusText}`)
      }

      const data = await res.json()
      setPets(Array.isArray(data) ? data : data.results || [])
    } catch (err) {
      setError(err.message || "Failed to load pets")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPets()
  }, [])

  // -------------------------------------------------------
  // AUTH TOKEN WATCHER
  // -------------------------------------------------------
  useEffect(() => {
    const checkAuthAndReload = () => {
      const token = localStorage.getItem("access")
      if (token && authRequired) {
        setAuthRequired(false)
        loadPets()
      }
    }

    const onStorage = (e) => {
      if (e.key === "access" && e.newValue) checkAuthAndReload()
    }

    window.addEventListener("focus", checkAuthAndReload)
    window.addEventListener("storage", onStorage)

    return () => {
      window.removeEventListener("focus", checkAuthAndReload)
      window.removeEventListener("storage", onStorage)
    }
  }, [authRequired])

  const isAdopted = (pet) => String(pet.Status || pet.status || "").toLowerCase() === "adopted"

  const availablePets = pets.filter((pet) => !isAdopted(pet))

  // -------------------------------------------------------
  // FILTERING
  // -------------------------------------------------------
  const filteredPets = availablePets.filter((pet) => {
    const name = (pet.Name || "").toLowerCase()
    const { species: displaySpeciesRaw, breed: displayBreedRaw } = normalizeSpeciesBreed(pet)

    const displaySpecies = String(displaySpeciesRaw).toLowerCase()
    const displayBreed = String(displayBreedRaw).toLowerCase()

    const term = searchTerm.toLowerCase()
    const matchesSearch = name.includes(term) || displayBreed.includes(term)
    const matchesType = selectedType === "all" || displaySpecies === selectedType.toLowerCase()

    return matchesSearch && matchesType
  })

  // -------------------------------------------------------
  // ADOPTION REQUEST
  // -------------------------------------------------------
  const submitAdoptionRequest = async (pet) => {
    if (!pet?.id) return

    const token = localStorage.getItem("access")
    if (!token) {
      setAdoptionFeedback({ type: "error", message: "Please log in to send an adoption request." })
      setAuthRequired(true)
      return
    }

    setAdoptionLoadingId(pet.id)
    setAdoptionFeedback(null)

    try {
      const res = await fetch(buildApiUrl("/api/adoptions/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ Pet: pet.id }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Failed to submit adoption request.")
      }

      setAdoptionFeedback({
        type: "success",
        message: data?.message || `Adoption request for ${pet.Name} submitted successfully.`,
      })
      setSelectedPet(null)
    } catch (err) {
      setAdoptionFeedback({ type: "error", message: err?.message || "Could not submit adoption request." })
    } finally {
      setAdoptionLoadingId(null)
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) setSelectedPet(null)
  }

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------
  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className={selectedPet ? "blur-sm" : ""}>
        
        {/* Header */}
        <section className="bg-amber-600 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-2">Available Pets</h1>
            <p className="text-lg opacity-90">Browse our collection of wonderful pets waiting for their forever homes</p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* FILTERS */}
            <div className="bg-white rounded-lg shadow p-6 h-fit sticky top-20 lg:col-span-1">
              <h3 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-6"><Filter size={20} /> Filters</h3>

              <div className="mb-6">
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or breed..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Pet Type</label>
                <div className="flex flex-col gap-2">
                  {[['all','All Pets'],['dog','Dogs'],['cat','Cats']].map(([type,label]) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`py-2 px-4 rounded-lg transition font-medium ${selectedType === type ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* PET LIST */}
            <div className="lg:col-span-3">
              {adoptionFeedback && (
                <div className={`mb-6 rounded-lg px-4 py-3 text-sm font-medium ${
                  adoptionFeedback.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {adoptionFeedback.message}
                </div>
              )}

              <p className="text-gray-700 font-semibold mb-6">
                {loading ? "Loading pets..." : `${filteredPets.length} pet(s) found`}
              </p>

              {error ? (
                <div className="col-span-full bg-white rounded-lg p-6 text-center">
                  <p className="text-red-600 font-semibold mb-4">Error loading pets: {error}</p>
                  <button
                    onClick={() => loadPets()}
                    className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition font-semibold"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loading ? (
                    <div className="col-span-full bg-white rounded-lg p-12 text-center">Loading pets…</div>
                  ) : filteredPets.length > 0 ? (
                    filteredPets.map((pet) => {
                      const { species: displaySpeciesRaw, breed: displayBreedRaw } = normalizeSpeciesBreed(pet)
                      const ageDisplay = typeof pet.Age === "number" ? `${pet.Age} year${pet.Age === 1 ? "" : "s"}` : pet.Age || "Unknown"

                      return (
                        <div
                          key={pet.id}
                          onClick={() => setSelectedPet(pet)}
                          className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden cursor-pointer"
                        >
                          <div className="relative h-48 overflow-hidden bg-gray-200">
                            <img src={getPetImage(pet)} alt={pet.Name} className="w-full h-full object-cover" />
                            <span className="absolute top-3 right-3 bg-amber-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                              {displaySpeciesRaw}
                            </span>
                          </div>

                          <div className="p-4">
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">{pet.Name}</h2>
                            <p className="text-amber-600 font-semibold mb-1">{displayBreedRaw}</p>
                            <p className="text-gray-600 mb-4">🎂 Age: {ageDisplay}</p>

                            <button
                              onClick={(event) => {
                                event.stopPropagation()
                                submitAdoptionRequest(pet)
                              }}
                              className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                              disabled={adoptionLoadingId === pet.id}
                            >
                              {adoptionLoadingId === pet.id ? "Sending Request..." : "Adopt Now"}
                            </button>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="col-span-full bg-white rounded-lg p-12 text-center">
                      <p className="text-gray-600 text-lg mb-4">No pets found matching your criteria</p>
                      <button
                        onClick={() => {
                          setSearchTerm("")
                          setSelectedType("all")
                        }}
                        className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition font-semibold"
                      >
                        Reset Filters
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {selectedPet && (
        <div onClick={handleBackdropClick} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
            <div className="relative h-64 overflow-hidden bg-gray-200">
              <img src={getPetImage(selectedPet)} alt={selectedPet.Name} className="w-full h-full object-cover" />
              <span className="absolute top-3 right-3 bg-amber-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {normalizeSpeciesBreed(selectedPet).species}
              </span>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{selectedPet.Name}</h2>
                  <p className="text-amber-600 font-semibold text-lg">
                    {normalizeSpeciesBreed(selectedPet).breed}
                  </p>
                </div>
                <button onClick={() => setSelectedPet(null)} className="text-gray-500 hover:text-gray-700 transition">
                  <X size={24} />
                </button>
              </div>

              <p className="text-gray-700 mb-4 text-lg font-medium">🎂 Age: 
                <span className="font-semibold">
                  {typeof selectedPet.Age === "number"
                    ? `${selectedPet.Age} year${selectedPet.Age === 1 ? "" : "s"}`
                    : selectedPet.Age || "Unknown"}
                </span>
              </p>

              <p className="text-gray-600 mb-6 leading-relaxed">No description available.</p>

              <button
                onClick={() => submitAdoptionRequest(selectedPet)}
                className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition font-semibold text-lg disabled:cursor-not-allowed disabled:opacity-70"
                disabled={adoptionLoadingId === selectedPet.id}
              >
                {adoptionLoadingId === selectedPet.id ? "Sending Request..." : `Adopt ${selectedPet.Name}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
