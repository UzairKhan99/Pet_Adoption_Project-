import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'

export default function SignUp() {
  const API_BASE = import.meta?.env?.VITE_API_URL || 'http://127.0.0.1:8000'
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.username || !formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    // username validation: allow letters, numbers, dot, underscore, hyphen (3-30 chars)
    const usernameRegex = /^[a-zA-Z0-9._-]{3,30}$/
    if (!usernameRegex.test(formData.username)) {
      setError('Username may include letters, numbers, ., -, _ and must be 3–30 characters')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setError('')
    setLoading(true)

    try {
      const base = API_BASE.replace(/\/+$/, '')
      const url = base ? `${base}/api/register/` : `/api/register/`

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      })

      // Try parse JSON; if not JSON, we'll fall back to text
      let data = null
      try {
        data = await res.json()
      } catch (_) {
        // ignore parse errors
      }

      if (!res.ok) {
        const serverMsg = (data && (data.error || data.message)) || null
        if (serverMsg) {
          setError(`Error ${res.status}: ${serverMsg}`)
        } else {
          const txt = await res.text().catch(() => '')
          setError(txt ? `Error ${res.status}: ${txt}` : `Error ${res.status}: Registration failed`)
        }
        setLoading(false)
        return
      }

      // success — show success prompt, then navigate to login
      setSuccess((data && (data.message || data.detail)) || 'Account created successfully')
      setError('')
      setLoading(false)
      setTimeout(() => navigate('/login'), 1400)
      return
    } catch (err) {
      setError(err?.message ? `Network error: ${err.message}` : 'Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join PetHub</h1>
          <p className="text-gray-600">Create your account and find your perfect pet</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm font-medium">{success}</div>}
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm font-medium">{error}</div>}

          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
            <div className="relative flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:border-amber-600">
              <User size={20} className="text-gray-400" />
              <input
                id="username"
                type="text"
                name="username"
                placeholder="username123"
                value={formData.username}
                onChange={handleChange}
                className="w-full ml-2 outline-none bg-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Allowed: letters, numbers, <span className="font-medium">.</span> <span className="font-medium">-</span> <span className="font-medium">_</span> (3–30 chars)</p>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
            <div className="relative flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:border-amber-600">
              <User size={20} className="text-gray-400" />
              <input
                id="name"
                type="text"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                className="w-full ml-2 outline-none bg-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <div className="relative flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:border-amber-600">
              <Mail size={20} className="text-gray-400" />
              <input
                id="email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full ml-2 outline-none bg-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:border-amber-600">
              <Lock size={20} className="text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
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

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
            <div className="relative flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:border-amber-600">
              <Lock size={20} className="text-gray-400" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full ml-2 outline-none bg-transparent"
              />
              <button
                type="button"
                className="ml-2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-amber-600 text-white py-2 rounded-lg font-semibold hover:bg-amber-700 transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        

        <p className="text-center mt-6 text-gray-600">
          Already have an account? <Link to="/login" className="text-amber-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
