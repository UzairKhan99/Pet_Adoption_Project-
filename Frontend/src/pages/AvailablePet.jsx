"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowRight, Filter, Heart, PawPrint, Search, Sparkles, X } from "lucide-react"

const fallbackPets = [
  { id: 1, Name: "Buddy", Species: "Dog", Breed: "Golden Retriever", Age: 3, Status: "available" },
  { id: 2, Name: "Luna", Species: "Cat", Breed: "Calico", Age: 2, Status: "available" },
  { id: 3, Name: "Max", Species: "Dog", Breed: "Beagle", Age: 4, Status: "available" },
  { id: 4, Name: "Milo", Species: "Cat", Breed: "Tabby", Age: 1, Status: "available" },
  { id: 5, Name: "Charlie", Species: "Dog", Breed: "Labrador", Age: 5, Status: "available" },
  { id: 6, Name: "Cleo", Species: "Cat", Breed: "Siamese", Age: 3, Status: "available" },
]

const petImageSets = {
  dog: ["/golden-retriever.jpg", "/beagle-dog.jpg", "/german-shepherd.jpg", "/labrador-dog.jpg"],
  cat: ["/calico-cat.jpg", "/black-cat.jpg", "/tabby-cat.jpg", "/siamese-cat.jpg"],
}

export default function AvailablePets() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedPet, setSelectedPet] = useState(null)
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(false)
  const [authRequired, setAuthRequired] = useState(false)
  const [adoptionFeedback, setAdoptionFeedback] = useState(null)
  const [adoptionLoadingId, setAdoptionLoadingId] = useState(null)

  const API_BASE = import.meta.env.VITE_API_URL ?? ""

  const buildApiUrl = (path) => {
    const trimmedBase = API_BASE.replace(/\/+$/, "")
    const normalizedPath = path.startsWith("/") ? path : `/${path}`
    return trimmedBase ? `${trimmedBase}${normalizedPath}` : normalizedPath
  }

  const shouldUseCredentials = (() => {
    try {
      const envFlag = String(import.meta.env?.VITE_USE_CREDENTIALS || "").toLowerCase() === "true"
      if (envFlag) return true
      if (typeof window !== "undefined" && API_BASE) {
        const apiOrigin = new URL(API_BASE).origin
        return apiOrigin === window.location.origin
      }
    } catch {
      return false
    }
    return false
  })()

  const normalizeSpeciesBreed = (pet) => {
    const rawBreed = String(pet.Breed ?? pet.breed ?? "").trim()
    const rawSpecies = String(pet.Species ?? pet.species ?? "").trim()
    const knownSpecies = new Set(["dog", "cat", "bird", "rabbit", "hamster", "other", "unknown"])

    if (knownSpecies.has(rawBreed.toLowerCase())) {
      return { species: rawBreed || rawSpecies, breed: rawSpecies || rawBreed }
    }

    return { species: rawSpecies || rawBreed || "Pet", breed: rawBreed || rawSpecies || "Companion" }
  }

  const getPetImage = (pet) => {
    const { species, breed } = normalizeSpeciesBreed(pet)
    const text = `${species} ${breed}`.toLowerCase()

    if (text.includes("beagle")) return "/beagle-dog.jpg"
    if (text.includes("german")) return "/german-shepherd.jpg"
    if (text.includes("golden")) return "/golden-retriever.jpg"
    if (text.includes("labrador")) return "/labrador-dog.jpg"
    if (text.includes("black")) return "/black-cat.jpg"
    if (text.includes("calico")) return "/calico-cat.jpg"
    if (text.includes("siamese")) return "/siamese-cat.jpg"
    if (text.includes("tabby")) return "/tabby-cat.jpg"

    if (text.includes("dog")) return petImageSets.dog[Number(pet.id || 0) % petImageSets.dog.length]
    if (text.includes("cat")) return petImageSets.cat[Number(pet.id || 0) % petImageSets.cat.length]
    return "/placeholder.jpg"
  }

  const loadPets = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("access")
      const fetchOpts = { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      if (shouldUseCredentials) fetchOpts.credentials = "include"

      const res = await fetch(buildApiUrl("/api/pets/"), fetchOpts)

      if (res.status === 401) {
        setAuthRequired(true)
        setPets(fallbackPets)
        return
      }

      const contentType = res.headers.get("content-type") || ""
      if (!res.ok || !contentType.includes("application/json")) {
        throw new Error("Pets unavailable")
      }

      const data = await res.json()
      setPets(Array.isArray(data) ? data : data.results || [])
    } catch {
      setPets(fallbackPets)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPets()
  }, [])

  useEffect(() => {
    const checkAuthAndReload = () => {
      const token = localStorage.getItem("access")
      if (token && authRequired) {
        setAuthRequired(false)
        loadPets()
      }
    }

    const onStorage = (event) => {
      if (event.key === "access" && event.newValue) checkAuthAndReload()
    }

    window.addEventListener("focus", checkAuthAndReload)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener("focus", checkAuthAndReload)
      window.removeEventListener("storage", onStorage)
    }
  }, [authRequired])

  const availablePets = useMemo(
    () => pets.filter((pet) => String(pet.Status || pet.status || "").toLowerCase() !== "adopted"),
    [pets]
  )

  const filteredPets = useMemo(() => {
    return availablePets.filter((pet) => {
      const { species, breed } = normalizeSpeciesBreed(pet)
      const term = searchTerm.toLowerCase()
      const name = String(pet.Name || pet.name || "").toLowerCase()
      const matchesSearch = name.includes(term) || breed.toLowerCase().includes(term) || species.toLowerCase().includes(term)
      const matchesType = selectedType === "all" || species.toLowerCase() === selectedType
      return matchesSearch && matchesType
    })
  }, [availablePets, searchTerm, selectedType])

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
      if (!res.ok) throw new Error(data?.error || data?.message || "Failed to submit adoption request.")

      setAdoptionFeedback({
        type: "success",
        message: data?.message || `Adoption request for ${pet.Name || pet.name} submitted successfully.`,
      })
      setSelectedPet(null)
    } catch (err) {
      setAdoptionFeedback({ type: "error", message: err?.message || "Could not submit adoption request." })
    } finally {
      setAdoptionLoadingId(null)
    }
  }

  const ageLabel = (pet) => {
    const age = pet.Age ?? pet.age
    if (typeof age === "number") return `${age} year${age === 1 ? "" : "s"}`
    return age || "Age unknown"
  }

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) setSelectedPet(null)
  }

  return (
    <main className="min-h-screen bg-stone-50">
      <div className={selectedPet ? "blur-sm" : ""}>
        <section className="relative overflow-hidden bg-stone-950 text-white">
          <img src="/golden-retriever-dog.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/80 to-stone-950/30" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-20">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-amber-200 backdrop-blur">
              <Sparkles size={16} /> Ready for a forever home
            </p>
            <h1 className="mb-4 max-w-3xl text-5xl font-black md:text-6xl">Meet pets with real personalities.</h1>
            <p className="max-w-2xl text-lg leading-8 text-stone-200">
              Search, filter, and open each pet profile to start an adoption request when you find the right match.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[18rem_1fr]">
          <aside className="h-fit rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200 lg:sticky lg:top-24">
            <h3 className="mb-5 flex items-center gap-2 text-xl font-black text-stone-950">
              <Filter size={20} /> Filters
            </h3>

            <div className="relative mb-5">
              <Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Name, breed, type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-3 pl-11 pr-4 outline-none transition focus:border-primary focus:bg-white"
              />
            </div>

            <div className="grid gap-2">
              {[
                ["all", "All Pets"],
                ["dog", "Dogs"],
                ["cat", "Cats"],
              ].map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`rounded-2xl px-4 py-3 text-left font-bold transition ${
                    selectedType === type ? "bg-primary text-white shadow-lg shadow-amber-900/10" : "bg-stone-100 text-stone-700 hover:bg-amber-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </aside>

          <section>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-primary">Available now</p>
                <h2 className="text-3xl font-black text-stone-950">{loading ? "Loading pets..." : `${filteredPets.length} pet${filteredPets.length === 1 ? "" : "s"} found`}</h2>
              </div>
              <button
                onClick={loadPets}
                className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 font-bold text-stone-700 hover:bg-stone-100"
              >
                Refresh
              </button>
            </div>

            {adoptionFeedback && (
              <div
                className={`mb-6 rounded-2xl px-5 py-4 font-semibold ${
                  adoptionFeedback.type === "success" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                }`}
              >
                {adoptionFeedback.message}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {loading ? (
                <div className="col-span-full rounded-3xl bg-white p-12 text-center font-semibold text-stone-500 shadow-sm">Loading pets...</div>
              ) : filteredPets.length > 0 ? (
                filteredPets.map((pet) => {
                  const { species, breed } = normalizeSpeciesBreed(pet)
                  const name = pet.Name || pet.name || "Pet"
                  return (
                    <article
                      key={pet.id}
                      onClick={() => setSelectedPet(pet)}
                      className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone-200 transition hover:-translate-y-1 hover:shadow-2xl"
                    >
                      <div className="relative h-64 overflow-hidden">
                        <img src={getPetImage(pet)} alt={name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-stone-950/80 to-transparent" />
                        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-sm font-black text-primary backdrop-blur">
                          {species}
                        </span>
                        <button
                          onClick={(event) => {
                            event.stopPropagation()
                            submitAdoptionRequest(pet)
                          }}
                          disabled={adoptionLoadingId === pet.id}
                          className="absolute bottom-4 right-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-stone-950 shadow-lg transition hover:bg-amber-400 disabled:opacity-60"
                          aria-label={`Adopt ${name}`}
                        >
                          <Heart size={22} fill="currentColor" />
                        </button>
                      </div>

                      <div className="p-5">
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-2xl font-black text-stone-950">{name}</h3>
                            <p className="font-bold text-primary">{breed}</p>
                          </div>
                          <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-bold text-stone-600">{ageLabel(pet)}</span>
                        </div>
                        <button
                          onClick={(event) => {
                            event.stopPropagation()
                            setSelectedPet(pet)
                          }}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-950 px-4 py-3 font-bold text-white transition hover:bg-primary"
                        >
                          View Profile <ArrowRight size={18} />
                        </button>
                      </div>
                    </article>
                  )
                })
              ) : (
                <div className="col-span-full rounded-3xl bg-white p-12 text-center shadow-sm">
                  <PawPrint className="mx-auto mb-4 text-primary" size={42} />
                  <p className="mb-4 text-lg font-bold text-stone-700">No pets match your filters.</p>
                  <button
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedType("all")
                    }}
                    className="rounded-full bg-primary px-6 py-3 font-bold text-white hover:bg-amber-700"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          </section>
        </section>
      </div>

      {selectedPet && (
        <div onClick={handleBackdropClick} className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/75 p-4 backdrop-blur-sm">
          <div className="grid max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-[1fr_0.9fr]">
            <img src={getPetImage(selectedPet)} alt={selectedPet.Name || selectedPet.name} className="h-80 w-full object-cover md:h-full" />
            <div className="overflow-y-auto p-7">
              <button onClick={() => setSelectedPet(null)} className="mb-6 ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200">
                <X size={22} />
              </button>
              <p className="mb-2 text-sm font-bold uppercase tracking-widest text-primary">{normalizeSpeciesBreed(selectedPet).species}</p>
              <h2 className="mb-2 text-4xl font-black text-stone-950">{selectedPet.Name || selectedPet.name}</h2>
              <p className="mb-6 text-xl font-bold text-stone-600">{normalizeSpeciesBreed(selectedPet).breed}</p>
              <div className="mb-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-amber-50 p-4">
                  <p className="text-sm font-bold text-amber-700">Age</p>
                  <p className="text-lg font-black text-stone-950">{ageLabel(selectedPet)}</p>
                </div>
                <div className="rounded-2xl bg-teal-50 p-4">
                  <p className="text-sm font-bold text-teal-700">Status</p>
                  <p className="text-lg font-black text-stone-950">{selectedPet.Status || selectedPet.status || "Available"}</p>
                </div>
              </div>
              <p className="mb-7 leading-7 text-stone-600">
                This pet is ready for a loving home. Send an adoption request and the shelter team can guide you through the next step.
              </p>
              <button
                onClick={() => submitAdoptionRequest(selectedPet)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-lg font-black text-white transition hover:bg-amber-700 disabled:opacity-60"
                disabled={adoptionLoadingId === selectedPet.id}
              >
                {adoptionLoadingId === selectedPet.id ? "Sending Request..." : `Adopt ${selectedPet.Name || selectedPet.name}`}
                <Heart size={21} fill="currentColor" />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
