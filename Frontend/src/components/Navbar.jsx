"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, PawPrint, X } from "lucide-react";
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
  const navItems = isAdmin ? [{ label: "Admin", to: "/admin" }] : adopterNav;

  return (
    <nav className="sticky top-0 z-50 border-b border-amber-100 bg-white/90 shadow-sm backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex flex-shrink-0 items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <PawPrint size={22} />
            </div>
            <span className="text-2xl font-bold text-primary">PawPal</span>
          </Link>

          <div className="hidden items-center space-x-8 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="font-medium text-gray-700 transition-colors duration-200 hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center space-x-4 md:flex">
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="rounded-lg border border-primary px-6 py-2 font-semibold text-primary transition-colors duration-200 hover:bg-amber-50"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="rounded-lg bg-primary px-6 py-2 font-semibold text-white transition-colors duration-200 hover:bg-amber-700"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                {isAdmin ? (
                  <Link
                    to="/admin"
                    className="rounded-lg bg-accent px-4 py-2 font-semibold text-white transition-colors duration-200 hover:bg-teal-800"
                  >
                    Admin
                  </Link>
                ) : null}
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-primary">
                    {getInitials(user?.username || user?.email)}
                  </div>
                  <span className="max-w-40 truncate text-sm text-gray-700">{user?.username || user?.email}</span>
                </div>
                <button
                  onClick={() => logout()}
                  className="rounded-lg border border-primary px-4 py-2 font-semibold text-primary transition-colors duration-200 hover:bg-amber-50"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-lg p-2 text-primary transition hover:bg-amber-50"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="space-y-2 border-t border-amber-100 pb-4 pt-4 md:hidden">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="block rounded px-4 py-2 text-gray-700 transition-colors duration-200 hover:bg-amber-50 hover:text-primary"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="space-y-2 border-t border-amber-100 pt-4">
              {!user ? (
                <>
                  <Link
                    to="/login"
                    className="block w-full rounded-lg border border-primary px-4 py-2 text-center font-semibold text-primary"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="block w-full rounded-lg bg-primary px-4 py-2 text-center font-semibold text-white"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  {isAdmin ? (
                    <Link
                      to="/admin"
                      className="block w-full rounded-lg bg-accent px-4 py-2 text-center font-semibold text-white"
                      onClick={() => setIsOpen(false)}
                    >
                      Admin
                    </Link>
                  ) : null}
                  <div className="flex items-center gap-2 px-4 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-primary">
                      {getInitials(user?.username || user?.email)}
                    </div>
                    <div className="truncate text-sm text-gray-700">{user?.username || user?.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      logout();
                    }}
                    className="block w-full rounded-lg border border-primary px-4 py-2 text-center font-semibold text-primary"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
