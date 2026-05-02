"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Eye, EyeOff, Mail, Lock, Shield, User } from "lucide-react"

export default function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [role, setRole] = useState("user")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) {
      setError("Please fill in all fields")
      return
    }
    setError("")
    setLoading(true)

    const result = await login(username, password, role)
    setLoading(false)

    if (!result.ok) {
      setError(result.message || 'Login failed')
      return
    }

    // Determine effective role: prefer backend-provided role when available
    const backendRole = result.data?.role ? String(result.data.role).toLowerCase() : null
    const effectiveRole = backendRole || role

    if (effectiveRole === "admin") {
      navigate("/admin")
    } else {
      navigate("/")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your PetHub account</p>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            type="button"
            onClick={() => setRole("user")}
            className={`flex-1 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
              role === "user" ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <User size={20} />
            User
          </button>
          <button
            type="button"
            onClick={() => setRole("admin")}
            className={`flex-1 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
              role === "admin" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Shield size={20} />
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm font-medium">{error}</div>}

          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
              Username
            </label>
            <div className="relative flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:border-amber-600">
              <User size={20} className="text-gray-400" />
              <input
                id="username"
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full ml-2 outline-none bg-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:border-amber-600">
              <Lock size={20} className="text-gray-400" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full ml-2 outline-none bg-transparent"
              />
              <button
                type="button"
                className="ml-2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-amber-600 text-white py-2 rounded-lg font-semibold hover:bg-amber-700 transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        

        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{" "}
          <Link to="/signup" className="text-amber-600 font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
