"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Heart, FileCheck, Home } from "lucide-react";

export default function HowToAdoptPage() {
  const [adoptionRequests, setAdoptionRequests] = useState([]);
  const [adoptionLoading, setAdoptionLoading] = useState(false);
  const [adoptionError, setAdoptionError] = useState(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [petLookup, setPetLookup] = useState({});

  const API_BASE = import.meta.env.VITE_API_URL ?? "";

  const buildApiUrl = (path) => {
    const trimmedBase = API_BASE.replace(/\/+$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return trimmedBase ? `${trimmedBase}${normalizedPath}` : normalizedPath;
  };

  const shouldUseCredentials = (() => {
    try {
      const envFlag = String(import.meta.env?.VITE_USE_CREDENTIALS || "").toLowerCase() === "true";
      if (envFlag) return true;
      if (typeof window !== "undefined") {
        const apiOrigin = new URL(API_BASE).origin;
        return apiOrigin === window.location.origin;
      }
    } catch (_) {}
    return false;
  })();

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return dateString;
    return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  const statusClassNames = (statusRaw) => {
    const status = String(statusRaw || "pending").toLowerCase();
    if (status === "approved") return "bg-emerald-100 text-emerald-700";
    if (status === "rejected" || status === "denied") return "bg-rose-100 text-rose-700";
    return "bg-amber-100 text-amber-700";
  };

  const loadAdoptions = async () => {
    setAdoptionLoading(true);
    setAdoptionError(null);

    const token = localStorage.getItem("access");
    if (!token) {
      setAuthRequired(true);
      setAdoptionLoading(false);
      setAdoptionRequests([]);
      return;
    }

    try {
      const fetchOpts = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      if (shouldUseCredentials) fetchOpts.credentials = "include";

      const res = await fetch(buildApiUrl("/api/adoptions/"), fetchOpts);

      if (res.status === 401) {
        setAuthRequired(true);
        throw new Error("Please log in to view your adoption requests.");
      }

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Unable to load adoption requests (Error ${res.status}).`);
      }

      const data = await res.json();
      setAdoptionRequests(Array.isArray(data) ? data : []);
      setAuthRequired(false);
    } catch (err) {
      setAdoptionError(err?.message || "Failed to load adoption requests.");
    } finally {
      setAdoptionLoading(false);
    }
  };

  const loadPetLookup = async () => {
    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      const fetchOpts = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      if (shouldUseCredentials) fetchOpts.credentials = "include";
      const res = await fetch(buildApiUrl("/api/pets/"), fetchOpts);
      if (!res.ok) return;
      const data = await res.json();
      const lookup = {};
      (Array.isArray(data) ? data : []).forEach((pet) => {
        if (pet?.id) lookup[pet.id] = pet;
      });
      setPetLookup(lookup);
    } catch (_) {
      // Ignore lookup failures; the adoption list can still render.
    }
  };

  useEffect(() => {
    loadAdoptions();
    loadPetLookup();
  }, []);

  useEffect(() => {
    const maybeReload = () => {
      const token = localStorage.getItem("access");
      if (token) {
        setAuthRequired(false);
        loadAdoptions();
        loadPetLookup();
      }
    };

    const onStorage = (event) => {
      if (event.key === "access" && event.newValue) {
        maybeReload();
      }
    };

    window.addEventListener("focus", maybeReload);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", maybeReload);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const steps = [
    {
      icon: CheckCircle,
      title: 'Browse Pets',
      description: 'Explore our available pets and find one that matches your lifestyle and preferences.',
      number: 1,
    },
    {
      icon: FileCheck,
      title: 'Complete Application',
      description: 'Fill out our adoption application to help us match you with the right pet.',
      number: 2,
    },
    {
      icon: Heart,
      title: 'Meet & Greet',
      description: 'Visit our facility to meet your potential new family member in person.',
      number: 3,
    },
    {
      icon: Home,
      title: 'Bring Home',
      description: 'Complete the adoption process and welcome your new pet to their forever home.',
      number: 4,
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">How to Adopt</h1>
          <p className="text-lg opacity-90">A simple 4-step process to find your perfect pet</p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step) => {
              const IconComponent = step.icon;
              return (
                <div key={step.number} className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                        <IconComponent className="text-primary-foreground" size={40} />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center text-primary-foreground font-bold">
                        {step.number}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-primary mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* User Adoption Requests */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-4 mb-10 text-center">
            <p className="text-sm uppercase tracking-wide text-amber-600 font-semibold">Your Adoptions</p>
            <h2 className="text-4xl font-bold text-primary">Track Your Adoption Journey</h2>
            <p className="text-muted-foreground">
              View the status of every adoption request you have submitted. We keep you updated from the moment you click adopt.
            </p>
          </div>

          {authRequired ? (
            <div className="bg-card p-6 rounded-xl border border-dashed border-amber-400 text-center space-y-4">
              <p className="text-lg font-semibold text-primary">Please sign in to view your adoption progress.</p>
              <p className="text-muted-foreground">Log in with your adopter account to see every request you have submitted.</p>
              <div className="flex flex-col gap-3 justify-center sm:flex-row">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2 font-semibold text-primary-foreground shadow hover:shadow-md transition"
                >
                  Go to Login
                </Link>
                <button
                  onClick={loadAdoptions}
                  className="inline-flex items-center justify-center rounded-lg border border-primary px-6 py-2 font-semibold text-primary hover:bg-primary/10 transition"
                >
                  I am already logged in
                </button>
              </div>
            </div>
          ) : adoptionError ? (
            <div className="bg-red-100 text-red-800 rounded-xl p-6 text-center space-y-3">
              <p className="text-lg font-semibold">We could not load your adoption requests.</p>
              <p className="text-sm">{adoptionError}</p>
              <button
                onClick={loadAdoptions}
                className="inline-flex items-center justify-center rounded-lg bg-red-600 text-white px-6 py-2 font-semibold hover:bg-red-700 transition"
              >
                Retry
              </button>
            </div>
          ) : adoptionLoading ? (
            <div className="bg-card p-6 rounded-xl border border-border/60 text-center text-muted-foreground">
              Loading your adoption requests...
            </div>
          ) : adoptionRequests.length === 0 ? (
            <div className="bg-card p-6 rounded-xl border border-border/60 text-center space-y-2">
              <p className="text-lg font-semibold text-primary">No adoption requests yet</p>
              <p className="text-muted-foreground">Browse pets and click the Adopt button to start a request.</p>
              <Link
                to="/available-pets"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2 font-semibold text-primary-foreground hover:shadow-lg transition"
              >
                Explore Pets
              </Link>
            </div>
          ) : null}

          {!authRequired && adoptionRequests.length > 0 && (
            <div className="grid gap-6">
              {adoptionRequests.map((request) => {
                const petInfo = petLookup[request.Pet_id] || petLookup[request.Pet] || {}
                return (
                  <div key={request.id || `${request.Pet_id}-${request.AdoptionDate}`} className="bg-card p-6 rounded-xl shadow-sm border border-border/60 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-wide text-muted-foreground mb-2">Pet</p>
                      <h3 className="text-2xl font-bold text-primary">
                        {petInfo.Name || `Pet #${request.Pet_id || request.Pet}`}
                      </h3>
                      <p className="text-muted-foreground">
                        {petInfo.Breed || petInfo.Species ? `${petInfo.Breed || 'Unknown breed'} · ${petInfo.Species || 'Unknown species'}` : 'Details unavailable'}
                      </p>
                    </div>

                    <div className="flex flex-col items-start gap-3 md:items-end">
                      <span className={`px-4 py-1 rounded-full text-sm font-semibold ${statusClassNames(request.Status)}`}>
                        {String(request.Status || "Pending").replace(/^\w/, (c) => c.toUpperCase())}
                      </span>
                      <p className="text-sm text-muted-foreground">
                        Requested on <span className="font-semibold text-foreground">{formatDate(request.AdoptionDate)}</span>
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-primary mb-12 text-center">Adoption Requirements</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card p-8 rounded-xl">
              <h3 className="text-2xl font-bold text-primary mb-4">What We Need</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start">
                  <span className="text-primary font-bold mr-3">•</span>
                  <span>Valid government-issued ID</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary font-bold mr-3">•</span>
                  <span>Proof of residence</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary font-bold mr-3">•</span>
                  <span>Veterinary references (if applicable)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary font-bold mr-3">•</span>
                  <span>Information about your home</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary font-bold mr-3">•</span>
                  <span>Your pet care experience</span>
                </li>
              </ul>
            </div>

            <div className="bg-card p-8 rounded-xl">
              <h3 className="text-2xl font-bold text-primary mb-4">Adoption Fees</h3>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <p className="font-semibold text-foreground">Dogs</p>
                  <p>$150 - $300</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Cats</p>
                  <p>$75 - $150</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Includes</p>
                  <ul className="list-disc list-inside text-sm">
                    <li>Vaccinations & Health Check</li>
                    <li>Microchipping</li>
                    <li>Spay/Neuter</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-primary mb-12 text-center">Frequently Asked Questions</h2>

          <div className="space-y-6">
            {[
              {
                question: 'How long does the adoption process take?',
                answer:
                  'Typically, the adoption process takes 2-5 business days from application to bringing your pet home.',
              },
              {
                question: 'Can I return my pet if it does not work out?',
                answer:
                  'Yes, we offer a 30-day trial period. If the adoption is not working out, we will take the pet back.',
              },
              {
                question: 'Do you offer post-adoption support?',
                answer: 'We provide free counseling and support for the first year after adoption.',
              },
              {
                question: 'What if my pet gets sick after adoption?',
                answer:
                  'All adopted pets come with a health guarantee and we can recommend trusted veterinarians.',
              },
            ].map((faq, index) => (
              <details
                key={index}
                className="bg-card p-6 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
              >
                <summary className="font-bold text-primary text-lg">
                  {faq.question}
                </summary>
                <p className="text-muted-foreground mt-4">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Start?</h2>
          <p className="text-lg mb-8 opacity-90">Begin your adoption journey today and find your perfect companion</p>
          <Link
            to="/available-pets"
            className="inline-flex items-center justify-center px-8 py-4 bg-primary-foreground text-primary font-bold rounded-lg hover:shadow-xl transition-all duration-200"
          >
            Browse Available Pets
          </Link>
        </div>
      </section>
    </main>
  );
}
