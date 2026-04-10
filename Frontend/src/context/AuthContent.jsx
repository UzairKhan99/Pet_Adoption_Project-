"use client"

import { createContext, useState, useContext, useEffect } from "react"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch (_) {
      return null
    }
  })
  const [isAdmin, setIsAdmin] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      const stored = localStorage.getItem('user')
      if (!stored) return false
      const parsed = JSON.parse(stored)
      return parsed?.role?.toUpperCase?.() === 'ADMIN'
    } catch (_) {
      return false
    }
  })

  // API base can be configured via Vite env var VITE_API_URL
  // If VITE_API_URL is set, use it; otherwise use relative paths so Vite dev proxy can forward /api
  const API_BASE = import.meta?.env?.VITE_API_URL ?? ''
  // Allow opt-in for sending cookies/credentials. Set VITE_USE_CREDENTIALS=true in .env to enable.
  const shouldUseCredentials = (() => {
    try {
      const envFlag = String(import.meta.env?.VITE_USE_CREDENTIALS || '').toLowerCase() === 'true'
      if (envFlag) return true
      // If API_BASE is same origin, allow credentials by default
      if (typeof window !== 'undefined') {
        const apiOrigin = new URL(API_BASE).origin
        return apiOrigin === window.location.origin
      }
    } catch (_) {}
    return false
  })()

  const login = async (username, password, role) => {
    try {
      const base = API_BASE.replace(/\/+$/, '')
      const url = base ? `${base}/api/login/` : `/api/login/`

      const fetchOpts = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      }
      if (shouldUseCredentials) fetchOpts.credentials = 'include'

      const res = await fetch(url, fetchOpts)

      let data = null
      try {
        data = await res.json()
      } catch (_) {
        // ignore
      }

      if (!res.ok) {
        const serverMsg = (data && (data.error || data.message)) || null
        const txt = serverMsg || (await res.text().catch(() => 'Login failed'))
        return { ok: false, message: `Error ${res.status}: ${txt}` }
      }

      // Save tokens
      if (data?.access) localStorage.setItem('access', data.access)
      if (data?.refresh) localStorage.setItem('refresh', data.refresh)

      // Enforce role selection: if backend provides a role, ensure it matches the selected role
      const backendRole = data?.role ? String(data.role).toUpperCase() : null

      if (backendRole) {
        if (role === 'admin' && backendRole !== 'ADMIN') {
          return { ok: false, message: 'This account is not an admin. Please select the correct role or use an admin account.' }
        }
        if (role === 'user' && backendRole === 'ADMIN') {
          return { ok: false, message: 'Admin accounts must sign in using the Admin role.' }
        }
      }

      // Persist backend role if available
      if (data?.role) localStorage.setItem('role', data.role)

      const resolvedRole = backendRole || role
      const nextUser = { username, role: resolvedRole }
      setUser(nextUser)
      setIsAdmin((backendRole && backendRole === 'ADMIN') || resolvedRole === 'admin' || resolvedRole?.toUpperCase() === 'ADMIN')
      localStorage.setItem('user', JSON.stringify(nextUser))

      return { ok: true, data }
    } catch (err) {
      return { ok: false, message: err?.message || 'Network error' }
    }
  }

  const logout = () => {
    setUser(null)
    setIsAdmin(false)
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('role')
    localStorage.removeItem('user')
  }

  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('user')
        if (stored) {
          const parsed = JSON.parse(stored)
          setUser(parsed)
          setIsAdmin(parsed?.role?.toUpperCase?.() === 'ADMIN')
        }
      } catch (_) {
        // ignore hydration errors
      }
    }
  }, [])

  return <AuthContext.Provider value={{ user, isAdmin, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
