"use client"

import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Clock3, RefreshCcw } from "lucide-react"
import { useAuth } from "../context/AuthContext"

export default function MyAdoptionsPage() {
  const { user } = useAuth()
  const [adoptionRequests, setAdoptionRequests] = useState([])
  const [adoptionLoading, setAdoptionLoading] = useState(false)
  const [adoptionError, setAdoptionError] = useState(null)
  const [authRequired, setAuthRequired] = useState(false)
  const [petLookup, setPetLookup] = useState({})

  const API_BASE = import.meta.env.VITE_API_URL ?? ""

  const buildApiUrl = useMemo(() => {
    return (path) => {
      const trimmedBase = API_BASE.replace(/\/+$/, "")
      const normalizedPath = path.startsWith("/") ? path : `/${path}`
      return trimmedBase ? `${trimmedBase}${normalizedPath}` : normalizedPath
    }
  }, [API_BASE])

  const shouldUseCredentials = useMemo(() => {
    try {
      const envFlag = String(import.meta.env?.VITE_USE_CREDENTIALS || "").toLowerCase() === "true"
      if (envFlag) return true
      if (typeof window !== "undefined" && API_BASE) {
        const apiOrigin = new URL(API_BASE).origin
        return apiOrigin === window.location.origin
      }
    } catch (_) {}
    return false
  }, [API_BASE])

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const parsed = new Date(dateString)
    if (Number.isNaN(parsed.getTime())) return dateString
    return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
  }

  const statusClassNames = (statusRaw) => {
    const status = String(statusRaw || "pending").toLowerCase()
    if (status === "approved") return "bg-emerald-100 text-emerald-800"
    if (status === "rejected" || status === "denied") return "bg-rose-100 text-rose-700"
    return "bg-amber-100 text-amber-700"
  }

  const getRequestTimestamp = (record) => {
    const raw = record?.AdoptionDate || record?.created_at || record?.Date
    const parsed = Date.parse(raw)
    return Number.isNaN(parsed) ? 0 : parsed
  }

  const sortedRequests = useMemo(() => {
    return [...adoptionRequests].sort((a, b) => getRequestTimestamp(b) - getRequestTimestamp(a))
  }, [adoptionRequests])

  const adoptedRequests = useMemo(() => {
    return sortedRequests.filter((req) => (req.Status || req.status || "").toLowerCase() === "approved")
  }, [sortedRequests])

  const activeRequests = useMemo(() => {
    return sortedRequests.filter((req) => (req.Status || req.status || "").toLowerCase() !== "approved")
  }, [sortedRequests])

  const loadAdoptions = async () => {
    setAdoptionLoading(true)
    setAdoptionError(null)

    const token = localStorage.getItem("access")
    if (!token) {
      setAuthRequired(true)
      setAdoptionRequests([])
      setAdoptionLoading(false)
      return
    }

    try {
      const fetchOpts = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
      if (shouldUseCredentials) fetchOpts.credentials = "include"

      const res = await fetch(buildApiUrl("/api/adoptions/"), fetchOpts)

      if (res.status === 401) {
        setAuthRequired(true)
        throw new Error("Please log in to view your adoption requests.")
      }

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || `Unable to load adoption requests (Error ${res.status}).`)
      }

      const data = await res.json()
      setAdoptionRequests(Array.isArray(data) ? data : [])
      setAuthRequired(false)
    } catch (err) {
      setAdoptionError(err?.message || "Failed to load adoption requests.")
    } finally {
      setAdoptionLoading(false)
    }
  }

  const loadPetLookup = async () => {
    const token = localStorage.getItem("access")
    if (!token) return
    try {
      const fetchOpts = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
      if (shouldUseCredentials) fetchOpts.credentials = "include"
      const res = await fetch(buildApiUrl("/api/pets/"), fetchOpts)
      if (!res.ok) return
      const data = await res.json()
      const lookup = {}
      ;(Array.isArray(data) ? data : []).forEach((pet) => {
        if (pet?.id) lookup[pet.id] = pet
      })
      setPetLookup(lookup)
    } catch (_) {
      // Best-effort only.
    }
  }

  useEffect(() => {
    loadAdoptions()
    loadPetLookup()
  }, [])

  useEffect(() => {
    const maybeReload = () => {
      const token = localStorage.getItem("access")
      if (token) {
        setAuthRequired(false)
        loadAdoptions()
        loadPetLookup()
      }
    }

    const onStorage = (event) => {
      if (event.key === "access" && event.newValue) {
        maybeReload()
      }
    }

    window.addEventListener("focus", maybeReload)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener("focus", maybeReload)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  const renderContent = () => {
    if (!user || authRequired) {
      return (
        <div className="bg-card p-8 rounded-2xl border border-dashed border-amber-400 text-center space-y-4">
          <p className="text-xl font-semibold text-primary">Sign in to track your adoption progress.</p>
          <p className="text-muted-foreground">Log in with the account you used to submit adoption requests.</p>
          <div className="flex flex-col gap-3 justify-center sm:flex-row">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow hover:shadow-lg transition"
            >
              Go to Login
            </Link>
            <button
              onClick={loadAdoptions}
              className="inline-flex items-center justify-center rounded-lg border border-primary px-6 py-3 font-semibold text-primary hover:bg-primary/10 transition"
            >
              I already logged in
            </button>
          </div>
        </div>
      )
    }

    if (adoptionError) {
      return (
        <div className="bg-red-100 text-red-800 rounded-2xl p-8 text-center space-y-4">
          <p className="text-lg font-semibold">We could not load your adoption requests.</p>
          <p className="text-sm">{adoptionError}</p>
          <button
            onClick={loadAdoptions}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 text-white px-6 py-3 font-semibold hover:bg-red-700 transition"
          >
            <RefreshCcw size={18} />
            Retry
          </button>
        </div>
      )
    }

    if (adoptionLoading) {
      return (
        <div className="bg-card p-8 rounded-2xl border border-border text-center text-muted-foreground">
          Loading your adoption requests…
        </div>
      )
    }

    if (sortedRequests.length === 0) {
      return (
        <div className="bg-card p-8 rounded-2xl border border-border text-center space-y-3">
          <p className="text-xl font-semibold text-primary">No adoption requests yet</p>
          <p className="text-muted-foreground">
            When you click “Adopt” on an available pet, your requests will show up here with live status updates.
          </p>
          <Link
            to="/available-pets"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:shadow-lg transition"
          >
            Browse Pets
          </Link>
        </div>
      )
    }

    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {sortedRequests.length} request{sortedRequests.length === 1 ? "" : "s"}
          </p>
          <button
            onClick={loadAdoptions}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>

        {adoptedRequests.length > 0 && (
          <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Adopted pets</p>
              <p className="text-gray-700">These companions are already part of your family.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {adoptedRequests.map((request) => {
                const petInfo = petLookup[request.Pet_id] || petLookup[request.Pet] || {}
                return (
                  <article
                    key={`adopted-${request.id || request.Pet_id}`}
                    className="rounded-xl bg-white/80 p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold text-emerald-800">
                        {petInfo.Name || `Pet #${request.Pet_id || request.Pet}`}
                      </h3>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Adopted
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {petInfo.Breed || petInfo.Species
                        ? `${petInfo.Breed || "Unknown breed"} · ${petInfo.Species || "Unknown species"}`
                        : "Details unavailable"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Approved on {formatDate(request.AdoptionDate || request.updated_at || request.Date)}
                    </p>
                  </article>
                )
              })}
            </div>
          </div>
        )}

        {activeRequests.length > 0 ? (
          <div className="grid gap-6">
            {activeRequests.map((request) => {
              const petInfo = petLookup[request.Pet_id] || petLookup[request.Pet] || {}
              return (
                <article
                  key={request.id || `${request.Pet_id}-${request.AdoptionDate}`}
                  className="bg-card p-6 rounded-2xl shadow-sm border border-border/60 flex flex-col gap-6 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Clock3 size={24} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Pet</p>
                      <h3 className="text-2xl font-semibold text-primary">
                        {petInfo.Name || `Pet #${request.Pet_id || request.Pet}`}
                      </h3>
                      <p className="text-muted-foreground">
                        {petInfo.Breed || petInfo.Species
                          ? `${petInfo.Breed || "Unknown breed"} · ${petInfo.Species || "Unknown species"}`
                          : "Details unavailable"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-3 md:items-end">
                    <span className={`px-4 py-1 rounded-full text-sm font-semibold ${statusClassNames(request.Status)}`}>
                      {String(request.Status || "Pending").replace(/^\w/, (c) => c.toUpperCase())}
                    </span>
                    <p className="text-sm text-muted-foreground">
                      Requested on <span className="font-semibold text-foreground">{formatDate(request.AdoptionDate)}</span>
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            No active adoption requests right now.
          </div>
        )}
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="bg-primary text-primary-foreground py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <p className="uppercase tracking-[0.3em] text-sm text-primary-foreground/80">Adoption Tracker</p>
          <h1 className="text-4xl md:text-5xl font-bold">My Adoption Requests</h1>
          <p className="text-lg opacity-90">
            Every request you submit is recorded here so you always know where you are in the process.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">{renderContent()}</div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto grid gap-8 md:grid-cols-2">
          <div className="bg-card rounded-2xl border border-border p-8">
            <h3 className="text-2xl font-bold text-primary mb-4">Need help with your request?</h3>
            <p className="text-muted-foreground mb-6">
              Our adoption coordinators are ready to answer your questions, schedule meet & greets, and guide you through
              the process.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-primary-foreground font-semibold"
            >
              Contact Us
            </Link>
          </div>
          <div className="bg-card rounded-2xl border border-border p-8">
            <h3 className="text-2xl font-bold text-primary mb-4">Ready to adopt another friend?</h3>
            <p className="text-muted-foreground mb-6">
              Browse our latest pets and send multiple adoption requests. We will keep them organized right on this page.
            </p>
            <Link
              to="/available-pets"
              className="inline-flex items-center justify-center rounded-lg border border-primary px-5 py-2 text-primary font-semibold hover:bg-primary/10 transition"
            >
              View Available Pets
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

