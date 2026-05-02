"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import {
  BarChart3,
  Users,
  Play as Paw,
  Home,
  Heart,
  Clock,
  Plus,
  LogOut,
  Menu,
  X,
} from "lucide-react"

export default function AdminDashboard() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [statusMessage, setStatusMessage] = useState(null)

  const [pets, setPets] = useState([])
  const [shelters, setShelters] = useState([])
  const [adoptions, setAdoptions] = useState([])
  const [vets, setVets] = useState([])
  const [appointments, setAppointments] = useState([])
  const [medicalRecords, setMedicalRecords] = useState([])
  const [donations, setDonations] = useState([])

  const initialPetFormState = {
    Name: "",
    Species: "",
    Breed: "",
    Age: "",
    Gender: "",
    Status: "available",
    Shelter: "",
  }
  const [petForm, setPetForm] = useState(initialPetFormState)
  const [editingPetId, setEditingPetId] = useState(null)

  const initialShelterFormState = {
    Name: "",
    Location: "",
    Contact: "",
  }
  const [shelterForm, setShelterForm] = useState(initialShelterFormState)
  const [editingShelterId, setEditingShelterId] = useState(null)
  const [shelterOptions, setShelterOptions] = useState([])

  const API_BASE = import.meta?.env?.VITE_API_URL ?? "http://127.0.0.1:8000"
  const buildApiUrl = (path) => {
    const trimmedBase = API_BASE.replace(/\/+$/, "")
    const normalizedPath = path.startsWith("/") ? path : `/${path}`
    return trimmedBase ? `${trimmedBase}${normalizedPath}` : normalizedPath
  }
  const shouldUseCredentials = (() => {
    try {
      const envFlag = String(import.meta?.env?.VITE_USE_CREDENTIALS || "").toLowerCase() === "true"
      if (envFlag) return true
      if (typeof window !== "undefined" && API_BASE) {
        const apiOrigin = new URL(API_BASE).origin
        return apiOrigin === window.location.origin
      }
    } catch (_) {}
    return false
  })()

  const getAuthHeaders = (headers = {}) => {
    const token = localStorage.getItem("access")
    return token ? { ...headers, Authorization: `Bearer ${token}` } : headers
  }

  const refreshAccessToken = async () => {
    const refresh = localStorage.getItem("refresh")
    if (!refresh) throw new Error("Session expired. Please log in again.")
    const res = await fetch(buildApiUrl("/api/token/refresh/"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    })
    if (!res.ok) {
      throw new Error("Session expired. Please log in again.")
    }
    const data = await res.json().catch(() => ({}))
    if (!data?.access) throw new Error("Session expired. Please log in again.")
    localStorage.setItem("access", data.access)
    return data.access
  }

  const apiRequest = async (path, options = {}, retry = true) => {
    const fetchOptions = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(options.headers || {}),
      },
    }
    if (shouldUseCredentials && !fetchOptions.credentials) {
      fetchOptions.credentials = "include"
    }

    const res = await fetch(buildApiUrl(path), fetchOptions)
    let data = null
    try {
      data = await res.json()
    } catch (_) {
      // ignore empty body
    }

    if (res.status === 401 && retry) {
      try {
        await refreshAccessToken()
        return apiRequest(path, options, false)
      } catch (refreshError) {
        logout()
        navigate("/login")
        throw refreshError
      }
    }

    if (!res.ok) {
      const message = data?.error || data?.message || res.statusText || `Request failed (${res.status})`
      throw new Error(message)
    }
    return data
  }

  const showStatus = (type, message) => {
    setStatusMessage({ type, message })
    setTimeout(() => setStatusMessage(null), 5000)
  }

  const formatDate = (value) => {
    if (!value) return "-"
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return parsed.toLocaleDateString()
  }

  const getAdoptionTimestamp = (record) => {
    const raw = record?.AdoptionDate || record?.Date || record?.created_at
    const parsed = Date.parse(raw)
    return Number.isNaN(parsed) ? 0 : parsed
  }

  if (!isAdmin) {
    navigate("/login")
    return null
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  // Dashboard stats (will be populated from backend counts)
  const [stats, setStats] = useState([
    { key: "pets", label: "Total Pets", value: "-", icon: Paw, color: "bg-amber-100 text-amber-600" },
    { key: "users", label: "Total Users", value: "-", icon: Users, color: "bg-blue-100 text-blue-600" },
    { key: "shelters", label: "Total Shelters", value: "-", icon: Home, color: "bg-green-100 text-green-600" },
    { key: "donations", label: "Total Donations", value: "-", icon: Heart, color: "bg-red-100 text-red-600" },
    { key: "pending_adoptions", label: "Pending Adoptions", value: "-", icon: Clock, color: "bg-orange-100 text-orange-600" },
  ])

  // ---------- LOADERS ----------

  const loadPets = async () => {
    try {
      const data = await apiRequest("/api/adm/pets/")
      setPets(Array.isArray(data) ? data : [])
    } catch (err) {
      showStatus("error", err.message)
    }
  }

  const loadShelters = async () => {
    try {
      const data = await apiRequest("/api/adm/shelters/")
      const list = Array.isArray(data) ? data : []
      setShelters(list)
      setShelterOptions(list)
    } catch (err) {
      showStatus("error", err.message)
    }
  }

  const loadAdoptions = async () => {
    try {
      const data = await apiRequest("/api/adoptions/")
      setAdoptions(Array.isArray(data) ? data : [])
    } catch (err) {
      showStatus("error", err.message)
    }
  }

  const loadVets = async () => {
    try {
      const data = await apiRequest("/api/adm/vets/")
      setVets(Array.isArray(data) ? data : [])
    } catch (err) {
      showStatus("error", err.message)
    }
  }

  const loadAppointments = async () => {
    try {
      const data = await apiRequest("/api/adm/appointments/")
      setAppointments(Array.isArray(data) ? data : [])
    } catch (err) {
      showStatus("error", err.message)
    }
  }

  const loadMedicalRecords = async () => {
    try {
      const data = await apiRequest("/api/adm/medical-records/")
      setMedicalRecords(Array.isArray(data) ? data : [])
    } catch (err) {
      showStatus("error", err.message)
    }
  }

  const loadDonations = async () => {
    try {
      const data = await apiRequest("/api/donations/")
      setDonations(Array.isArray(data) ? data : [])
    } catch (err) {
      showStatus("error", err.message)
    }
  }

  const loadOverviewStats = async () => {
    setLoading(true)
    setError("")
    try {
      const [petList, shelterList, donationList, adoptionList] = await Promise.all([
        apiRequest("/api/adm/pets/"),
        apiRequest("/api/adm/shelters/"),
        apiRequest("/api/donations/"),
        apiRequest("/api/adoptions/"),
      ])

      const pendingAdoptions = (Array.isArray(adoptionList) ? adoptionList : []).filter(
        (a) => (a.Status || a.status || "").toLowerCase() === "pending"
      ).length

      setStats((prev) =>
        prev.map((stat) => {
          if (stat.key === "pets") return { ...stat, value: Array.isArray(petList) ? petList.length : "-" }
          if (stat.key === "shelters") return { ...stat, value: Array.isArray(shelterList) ? shelterList.length : "-" }
          if (stat.key === "donations") return { ...stat, value: Array.isArray(donationList) ? donationList.length : "-" }
          if (stat.key === "pending_adoptions") return { ...stat, value: pendingAdoptions }
          return stat
        })
      )
    } catch (err) {
      setError(err?.message || "Failed to load overview data")
    } finally {
      setLoading(false)
    }
  }

  // ---------- FORM HANDLERS ----------

  const handlePetSubmit = async (event) => {
    event.preventDefault()
    try {
      const payload = {
        Name: petForm.Name.trim(),
        Species: petForm.Species.trim(),
        Breed: petForm.Breed.trim(),
        Age: Number(petForm.Age) || 0,
        Gender: petForm.Gender.trim() || "Unknown",
        Status: petForm.Status.trim() || "available",
      }
      if (petForm.Shelter) payload.Shelter_id = Number(petForm.Shelter)

      const path = editingPetId ? `/api/adm/pets/${editingPetId}/` : "/api/adm/pets/"
      await apiRequest(path, {
        method: editingPetId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      })
      showStatus("success", `Pet ${editingPetId ? "updated" : "created"} successfully`)
      setPetForm(initialPetFormState)
      setEditingPetId(null)
      await loadPets()
      await loadOverviewStats()
    } catch (err) {
      showStatus("error", err.message)
    }
  }

  const handlePetDelete = async (id) => {
    if (!window.confirm("Delete this pet?")) return
    try {
      await apiRequest(`/api/adm/pets/${id}/`, { method: "DELETE" })
      showStatus("success", "Pet deleted")
      await loadPets()
      await loadOverviewStats()
    } catch (err) {
      showStatus("error", err.message)
    }
  }

  const handleShelterSubmit = async (event) => {
    event.preventDefault()
    try {
      const payload = {
        Name: shelterForm.Name.trim(),
        Location: shelterForm.Location.trim(),
        Contact: shelterForm.Contact.trim(),
      }
      const path = editingShelterId ? `/api/adm/shelters/${editingShelterId}/` : "/api/adm/shelters/"
      await apiRequest(path, {
        method: editingShelterId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      })
      showStatus("success", `Shelter ${editingShelterId ? "updated" : "created"} successfully`)
      setShelterForm(initialShelterFormState)
      setEditingShelterId(null)
      await loadShelters()
      await loadOverviewStats()
    } catch (err) {
      showStatus("error", err.message)
    }
  }

  const handleShelterDelete = async (id) => {
    if (!window.confirm("Delete this shelter?")) return
    try {
      await apiRequest(`/api/adm/shelters/${id}/`, { method: "DELETE" })
      showStatus("success", "Shelter deleted")
      await loadShelters()
      await loadOverviewStats()
    } catch (err) {
      showStatus("error", err.message)
    }
  }

  const handleAdoptionStatusChange = async (id, status) => {
    try {
      await apiRequest(`/api/adm/adoptions/${id}/`, {
        method: "PUT",
        body: JSON.stringify({ Status: status }),
      })
      showStatus("success", `Adoption ${status}`)
      await Promise.all([loadAdoptions(), loadPets(), loadOverviewStats()])
    } catch (err) {
      showStatus("error", err.message)
    }
  }

  const handleRefreshAdoptions = () => {
    loadAdoptions()
    loadOverviewStats()
  }

  const startCreatePet = () => {
    setEditingPetId(null)
    setPetForm(initialPetFormState)
  }

  const startEditPet = (pet) => {
    setEditingPetId(pet.id)
    setPetForm({
      Name: pet.Name || "",
      Species: pet.Species || "",
      Breed: pet.Breed || "",
      Age: pet.Age ?? "",
      Gender: pet.Gender || "",
      Status: pet.Status || "available",
      Shelter: pet.Shelter_id || pet.Shelter || "",
    })
  }

  const startCreateShelter = () => {
    setEditingShelterId(null)
    setShelterForm(initialShelterFormState)
  }

  const startEditShelter = (shelter) => {
    setEditingShelterId(shelter.id)
    setShelterForm({
      Name: shelter.Name || "",
      Location: shelter.Location || "",
      Contact: shelter.Contact || "",
    })
  }

  // ---------- MENU + LOOKUPS ----------

  useEffect(() => {
    if (activeTab === "overview") {
      loadOverviewStats()
    }
  }, [activeTab])

  useEffect(() => {
    loadShelters()
  }, [])

  const menuItems = [
    { id: "overview", label: "System Overview", icon: BarChart3 },
    { id: "pets", label: "Manage Pets", icon: Paw },
    { id: "users", label: "Manage Users", icon: Users },
    { id: "shelters", label: "Manage Shelters", icon: Home },
    { id: "vets", label: "Manage Veterinarians", icon: Users },
    { id: "records", label: "Medical Records", icon: Users },
    { id: "appointments", label: "Appointments", icon: Clock },
    { id: "donations", label: "Donations", icon: Heart },
    { id: "adoptions", label: "Adoption Requests", icon: Users },
  ]

  const shelterLookup = useMemo(() => {
    const mapping = {}
    shelterOptions.forEach((shelter) => {
      if (shelter?.id != null) {
        mapping[shelter.id] = shelter.Name || shelter.name || `Shelter #${shelter.id}`
      }
    })
    return mapping
  }, [shelterOptions])

  const petRows = useMemo(
    () =>
      pets.map((pet) => {
        const shelterName = shelterLookup[pet.Shelter_id || pet.Shelter] || pet.Shelter || pet.Shelter_id || "-"
        return {
          key: pet.id,
          cells: [
            pet.Name || pet.name || "-",
            pet.Breed || pet.breed || "-",
            pet.Age ?? "-",
            shelterName,
            pet.Status || pet.status || "-",
          ],
          actions: (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => startEditPet(pet)}
                className="px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition"
              >
                Edit
              </button>
              <button
                onClick={() => handlePetDelete(pet.id)}
                className="px-3 py-1 rounded-md bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition"
              >
                Delete
              </button>
            </div>
          ),
        }
      }),
    [pets, shelterLookup]
  )

  const shelterRows = useMemo(
    () =>
      shelters.map((shelter) => ({
        key: shelter.id,
        cells: [
          shelter.Name || shelter.name || "-",
          shelter.Location || shelter.location || "-",
          shelter.Contact || shelter.contact || "-",
          shelter.Status || shelter.status || "-",
        ],
        actions: (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => startEditShelter(shelter)}
              className="px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition"
            >
              Edit
            </button>
            <button
              onClick={() => handleShelterDelete(shelter.id)}
              className="px-3 py-1 rounded-md bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition"
            >
              Delete
            </button>
          </div>
        ),
      })),
    [shelters]
  )

  const adoptionRows = useMemo(() => {
    const cleaned = adoptions
      .filter((record) => {
        const status = (record.Status || record.status || "").toLowerCase()
        return status !== "rejected" && status !== "denied"
      })
      .sort((a, b) => getAdoptionTimestamp(b) - getAdoptionTimestamp(a))

    return cleaned.map((record) => {
      const statusRaw = (record.Status || record.status || "pending").toLowerCase()
      const canModerate = statusRaw === "pending"
      const readableStatus = record.Status || record.status || "Pending"
      return {
        key: record.id || `${record.Pet_id || record.Pet}-${record.Adopter_id || record.Adopter}`,
        cells: [
          record.Pet || record.Pet_id || "-",
          record.Adopter || record.Adopter_id || "-",
          formatDate(record.AdoptionDate || record.Date || record.created_at),
          readableStatus.replace(/^\w/, (c) => c.toUpperCase()),
        ],
        actions: (
          <div className="flex flex-wrap gap-2">
            <button
              disabled={!canModerate}
              onClick={() => handleAdoptionStatusChange(record.id, "approved")}
              className={`px-3 py-1 rounded-md text-sm font-semibold transition ${
                canModerate
                  ? "bg-green-50 text-green-700 hover:bg-green-100"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Approve
            </button>
            <button
              disabled={!canModerate}
              onClick={() => handleAdoptionStatusChange(record.id, "rejected")}
              className={`px-3 py-1 rounded-md text-sm font-semibold transition ${
                canModerate
                  ? "bg-red-50 text-red-700 hover:bg-red-100"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Reject
            </button>
          </div>
        ),
      }
    })
  }, [adoptions])

  const donationRows = useMemo(
    () =>
      donations.map((d) => ({
        key: d.id,
        cells: [
          d.id,
          d.User || d.User_id || "-",
          d.Shelter || d.Shelter_id || "-",
          `Rs ${d.Amount}`,
          formatDate(d.CreatedAt || d.DonationDate || d.created_at || d.Date),
        ],
        actions: <span className="text-gray-400">—</span>,
      })),
    [donations]
  )

  // Management table component
  const ManagementTable = ({ title, columns, rows, headerActions, emptyMessage = "No records found." }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        {headerActions}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  {col}
                </th>
              ))}
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-6 text-center text-sm text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={row.key || idx} className="border-b border-gray-200 hover:bg-gray-50 transition">
                  {row.cells.map((cell, i) => (
                    <td key={i} className="px-6 py-3 text-sm text-gray-700">
                      {cell}
                    </td>
                  ))}
                  <td className="px-6 py-3 text-sm text-gray-700">
                    {row.actions || <span className="text-gray-400">—</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  // Load data when tab changes
  useEffect(() => {
    setError("")
    if (activeTab === "pets") {
      loadPets()
    } else if (activeTab === "shelters") {
      loadShelters()
    } else if (activeTab === "adoptions") {
      loadAdoptions()
    } else if (activeTab === "vets") {
      loadVets()
    } else if (activeTab === "appointments") {
      loadAppointments()
    } else if (activeTab === "records") {
      loadMedicalRecords()
    } else if (activeTab === "donations") {
      loadDonations()
    }
  }, [activeTab])

  // ---------- RENDER ----------

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "w-64" : "w-20"
          } bg-gray-900 text-white transition-all duration-300 min-h-screen relative`}
        >
          <div className="p-4 flex items-center justify-between">
            {sidebarOpen && <h2 className="text-xl font-bold">Admin Panel</h2>}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hover:bg-gray-800 p-2 rounded transition">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <nav className="mt-6">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition ${
                    activeTab === item.id ? "bg-amber-600 text-white" : "text-gray-300 hover:bg-gray-800"
                  }`}
                >
                  <Icon size={20} />
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              )
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 text-gray-300 hover:text-white transition ${
                !sidebarOpen && "justify-center"
              }`}
            >
              <LogOut size={20} />
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <header className="bg-white shadow-md p-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <div className="text-right">
                <p className="text-gray-600">Welcome back!</p>
                <p className="text-sm text-gray-500">{user?.username || user?.email || ""}</p>
              </div>
            </div>
          </header>

          <main className="p-6 space-y-6">
            {statusMessage && (
              <div
                className={`rounded-lg border px-4 py-3 text-sm font-medium ${
                  statusMessage.type === "success"
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {statusMessage.message}
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            {activeTab === "overview" && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">System Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {stats.map((stat) => {
                    const Icon = stat.icon
                    return (
                      <div key={stat.label} className="bg-white rounded-lg shadow-md p-6">
                        <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                          <Icon size={24} />
                        </div>
                        <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">{loading ? "…" : stat.value}</p>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {activeTab === "pets" && (
              <section className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {editingPetId ? "Edit Pet" : "Add Pet"}
                      </h2>
                      <p className="text-sm text-gray-500">Manage available pets directly from the dashboard.</p>
                    </div>
                    {editingPetId && (
                      <button
                        onClick={startCreatePet}
                        className="text-sm font-semibold text-amber-600 hover:underline"
                      >
                        Cancel editing
                      </button>
                    )}
                  </div>

                  <form onSubmit={handlePetSubmit} className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-700">Name</label>
                      <input
                        required
                        value={petForm.Name}
                        onChange={(e) => setPetForm((prev) => ({ ...prev, Name: e.target.value }))}
                        className="rounded-lg border border-gray-300 px-3 py-2 focus:border-amber-600 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-700">Species</label>
                      <input
                        required
                        value={petForm.Species}
                        onChange={(e) => setPetForm((prev) => ({ ...prev, Species: e.target.value }))}
                        className="rounded-lg border border-gray-300 px-3 py-2 focus:border-amber-600 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-700">Breed</label>
                      <input
                        required
                        value={petForm.Breed}
                        onChange={(e) => setPetForm((prev) => ({ ...prev, Breed: e.target.value }))}
                        className="rounded-lg border border-gray-300 px-3 py-2 focus:border-amber-600 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-700">Age</label>
                      <input
                        type="number"
                        min="0"
                        value={petForm.Age}
                        onChange={(e) => setPetForm((prev) => ({ ...prev, Age: e.target.value }))}
                        className="rounded-lg border border-gray-300 px-3 py-2 focus:border-amber-600 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-700">Gender</label>
                      <input
                        value={petForm.Gender}
                        onChange={(e) => setPetForm((prev) => ({ ...prev, Gender: e.target.value }))}
                        className="rounded-lg border border-gray-300 px-3 py-2 focus:border-amber-600 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-700">Status</label>
                      <select
                        value={petForm.Status}
                        onChange={(e) => setPetForm((prev) => ({ ...prev, Status: e.target.value }))}
                        className="rounded-lg border border-gray-300 px-3 py-2 focus:border-amber-600 focus:outline-none"
                      >
                        {["available", "pending", "adopted"].map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <label className="text-sm font-semibold text-gray-700">Shelter</label>
                      <select
                        required
                        value={petForm.Shelter}
                        onChange={(e) => setPetForm((prev) => ({ ...prev, Shelter: e.target.value }))}
                        className="rounded-lg border border-gray-300 px-3 py-2 focus:border-amber-600 focus:outline-none"
                      >
                        <option value="">Select shelter</option>
                        {shelterOptions.map((shelter) => (
                          <option key={shelter.id} value={shelter.id}>
                            {shelter.Name || shelter.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-2 font-semibold text-white hover:bg-amber-700 transition"
                      >
                        <Plus size={18} />
                        {editingPetId ? "Update Pet" : "Create Pet"}
                      </button>
                    </div>
                  </form>
                </div>

                <ManagementTable
                  title="Manage Pets"
                  columns={["Pet Name", "Breed", "Age", "Shelter", "Status"]}
                  rows={petRows}
                  headerActions={
                    <button
                      onClick={startCreatePet}
                      className="bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-700 transition"
                    >
                      <Plus size={18} />
                      New Pet
                    </button>
                  }
                />
              </section>
            )}

            {activeTab === "users" && (
              <ManagementTable
                title="Manage Users"
                columns={["User Name", "Email", "Phone", "Joined Date", "Status"]}
                rows={[
                  {
                    key: "users-placeholder",
                    cells: ["User management not implemented", "", "", "", ""],
                  },
                ]}
                emptyMessage="User management not implemented yet."
              />
            )}

            {activeTab === "shelters" && (
              <section className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {editingShelterId ? "Edit Shelter" : "Add Shelter"}
                      </h2>
                      <p className="text-sm text-gray-500">Keep shelter contact information up to date.</p>
                    </div>
                    {editingShelterId && (
                      <button
                        onClick={startCreateShelter}
                        className="text-sm font-semibold text-amber-600 hover:underline"
                      >
                        Cancel editing
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleShelterSubmit} className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-700">Name</label>
                      <input
                        required
                        value={shelterForm.Name}
                        onChange={(e) => setShelterForm((prev) => ({ ...prev, Name: e.target.value }))}
                        className="rounded-lg border border-gray-300 px-3 py-2 focus:border-amber-600 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-700">Location</label>
                      <input
                        required
                        value={shelterForm.Location}
                        onChange={(e) => setShelterForm((prev) => ({ ...prev, Location: e.target.value }))}
                        className="rounded-lg border border-gray-300 px-3 py-2 focus:border-amber-600 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <label className="text-sm font-semibold text-gray-700">Contact</label>
                      <input
                        required
                        value={shelterForm.Contact}
                        onChange={(e) => setShelterForm((prev) => ({ ...prev, Contact: e.target.value }))}
                        className="rounded-lg border border-gray-300 px-3 py-2 focus:border-amber-600 focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-2 font-semibold text-white hover:bg-amber-700 transition"
                      >
                        <Plus size={18} />
                        {editingShelterId ? "Update Shelter" : "Create Shelter"}
                      </button>
                    </div>
                  </form>
                </div>

                <ManagementTable
                  title="Manage Shelters"
                  columns={["Shelter Name", "Location", "Contact", "Status"]}
                  rows={shelterRows}
                  headerActions={
                    <button
                      onClick={startCreateShelter}
                      className="bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-700 transition"
                    >
                      <Plus size={18} />
                      New Shelter
                    </button>
                  }
                />
              </section>
            )}

            {activeTab === "adoptions" && (
              <ManagementTable
                title="Adoption Requests"
                columns={["Pet", "Adopter", "Date", "Status"]}
                rows={adoptionRows}
                headerActions={
                  <button
                    onClick={handleRefreshAdoptions}
                    className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Refresh
                  </button>
                }
                emptyMessage="No adoption requests yet."
              />
            )}

            {activeTab === "vets" && (
              <ManagementTable
                title="Manage Veterinarians"
                columns={["Name", "Specialty", "Contact"]}
                rows={vets.map((v) => ({
                  key: v.id,
                  cells: [v.Name || v.name || "-", v.Specialty || v.specialty || "-", v.Contact || v.contact || "-"],
                }))}
                emptyMessage="No veterinarians added yet."
              />
            )}

            {activeTab === "appointments" && (
              <ManagementTable
                title="Appointments"
                columns={["Pet", "Vet", "Date", "Status"]}
                rows={appointments.map((a) => ({
                  key: a.id,
                  cells: [
                    a.Pet || a.Pet_id || "-",
                    a.Vet || a.Vet_id || "-",
                    formatDate(a.Date || a.AppointmentDate || a.date),
                    a.Status || a.status || "-",
                  ],
                }))}
                emptyMessage="No appointments recorded."
              />
            )}

            {activeTab === "records" && (
              <ManagementTable
                title="Medical Records"
                columns={["Pet", "Record Type", "Date", "Notes"]}
                rows={medicalRecords.map((r) => ({
                  key: r.id,
                  cells: [
                    r.Pet || r.Pet_id || "-",
                    r.Type || r.RecordType || "-",
                    formatDate(r.Date || r.RecordDate || r.date),
                    r.Notes || r.notes || r.Treatment || "-",
                  ],
                }))}
                emptyMessage="No medical records available."
              />
            )}

            {activeTab === "donations" && (
              <ManagementTable
                title="Donations"
                columns={["ID", "User", "Shelter", "Amount", "Date"]}
                rows={donationRows}
                headerActions={
                  <button
                    onClick={loadDonations}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Refresh
                  </button>
                }
                emptyMessage="No donations recorded yet."
              />
            )}

            {activeTab !== "overview" &&
              activeTab !== "pets" &&
              activeTab !== "users" &&
              activeTab !== "shelters" &&
              activeTab !== "adoptions" &&
              activeTab !== "vets" &&
              activeTab !== "appointments" &&
              activeTab !== "records" &&
              activeTab !== "donations" && (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <p className="text-gray-600 text-lg">
                    Management panel for {menuItems.find((m) => m.id === activeTab)?.label} coming soon...
                  </p>
                </div>
              )}
          </main>
        </div>
      </div>
    </div>
  )
}
