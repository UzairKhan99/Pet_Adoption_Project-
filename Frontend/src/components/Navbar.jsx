"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return "";
    const parts = String(name).split(/\s+|@|\.|_|-/).filter(Boolean);
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1][0] || "")).toUpperCase();
  };

  const baseNav = [
    { label: "Home", to: "/" },
    { label: "Available Pets", to: "/available-pets" },
    { label: "About Us", to: "/about" },
    { label: "How to Adopt", to: "/how-to-adopt" },
    { label: "Donation", to: "/donation" },
  ];

  const adopterNav = user ? [...baseNav, { label: "My Adoptions", to: "/my-adoptions" }] : baseNav;

  const adminNav = [{ label: "Admin", to: "/admin" }];

  const navItems = isAdmin ? adminNav : adopterNav;

  return (
    <nav className="bg-primary shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-white/30 backdrop-blur-md">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-10 h-10 bg-primary-foreground rounded-full flex items-center justify-center">
              <span className="text-2xl">🐾</span>
            </div>
            <span className="text-2xl font-bold text-primary-foreground">PawPal</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-primary-foreground hover:text-secondary font-medium transition-colors duration-200"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {!user ? (
              <>
                <Link
                  to={'/login'}
                  className="px-6 py-2 text-primary font-semibold bg-primary-foreground rounded-lg hover:bg-secondary transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-6 py-2 text-primary-foreground font-semibold bg-accent rounded-lg hover:bg-opacity-90 transition-colors duration-200"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                {isAdmin ? (
                  <Link to="/admin" className="px-4 py-2 text-primary-foreground font-semibold bg-accent rounded-lg hover:bg-opacity-90 transition-colors duration-200">Admin</Link>
                ) : null}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-800">
                    {getInitials(user?.username || user?.email)}
                  </div>
                  <span className="text-sm text-gray-800">{user?.username || user?.email}</span>
                </div>
                <button onClick={() => logout()} className="px-4 py-2 text-primary font-semibold bg-primary-foreground rounded-lg hover:bg-secondary transition-colors duration-200">Logout</button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-primary-foreground hover:text-secondary"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="block px-4 py-2 text-primary-foreground hover:bg-opacity-80 hover:bg-accent rounded transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-primary-foreground space-y-2">
              {!user ? (
                <>
                  <Link
                    to="/login"
                    className="block w-full px-4 py-2 text-center text-primary font-semibold bg-primary-foreground rounded-lg"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="block w-full px-4 py-2 text-center text-primary-foreground font-semibold bg-accent rounded-lg"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  {isAdmin ? (
                    <Link to="/admin" className="block w-full px-4 py-2 text-center text-primary font-semibold bg-primary-foreground rounded-lg" onClick={() => setIsOpen(false)}>Admin</Link>
                  ) : null}
                  <div className="flex items-center gap-2 px-4 py-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-800 mr-2">
                      {getInitials(user?.username || user?.email)}
                    </div>
                    <div className="text-sm text-gray-800">{user?.username || user?.email}</div>
                  </div>
                  <button onClick={() => { setIsOpen(false); logout(); }} className="block w-full px-4 py-2 text-center text-primary font-semibold bg-accent rounded-lg">Logout</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
