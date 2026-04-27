import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext'

import Home from './pages/Home'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import AvailablePet from './pages/AvailablePet'
import About from './pages/About'
import HowToAdopt from './pages/HowToAdopt'
import Contact from './pages/Contact'
import Donation from './pages/Donation'
import Navbar from './components/Navbar'
import AdminDashboard from './pages/AdminDashboard' // <-- Fix missing import
import MyAdoptions from './pages/MyAdoptions'

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname === "/admin";
  return (
    <>
      {!isAdminRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/available-pets" element={<AvailablePet />} />
        <Route path="/about" element={<About />} />
        <Route path="/how-to-adopt" element={<HowToAdopt />} />
        <Route path="/my-adoptions" element={<MyAdoptions />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/donation" element={<Donation />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App
