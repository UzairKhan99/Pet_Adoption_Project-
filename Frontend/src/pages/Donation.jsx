import React, { useState, useEffect } from "react";
import {
  Heart,
  DollarSign,
  Shield,
  Check,
  User,
  CreditCard,
  Calendar,
  Lock,
} from "lucide-react";

// ---------- Helpers ----------
const currencySymbol = "Rs";
const locale = "en-PK";

const formatCurrency = (value) => {
  const amount = Number(value) || 0;
  return `${currencySymbol} ${new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(amount)}`;
};

const luhnCheck = (num) => {
  const digits = num.replace(/\D/g, "");
  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (shouldDouble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    shouldDouble = !shouldDouble;
  }
  return digits.length >= 13 && sum % 10 === 0;
};

const isValidExpiry = (expiry) => {
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) return false;
  const [month, year] = expiry.split("/").map(Number);
  const now = new Date();
  const exp = new Date(2000 + year, month);
  return exp > now;
};

// ============================================================
//                    MAIN COMPONENT
// ============================================================

const DonationPage = () => {
  const [donationType, setDonationType] = useState("one-time");
  const [selectedAmount, setSelectedAmount] = useState(5000);
  const [customAmount, setCustomAmount] = useState("");

  const [selectedShelter, setSelectedShelter] = useState("");
  const [shelterOptions, setShelterOptions] = useState([]);
  const [loadingShelters, setLoadingShelters] = useState(false);
  const [sheltersError, setSheltersError] = useState(null);

  const [isAnonymous, setIsAnonymous] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("visa");

  const [cardDetails, setCardDetails] = useState({
    nameOnCard: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const presetAmounts = [1000, 2500, 5000, 10000, 20000, 50000];

  // 🔥 ALWAYS use Django backend unless overridden in .env
  const API_BASE =
    import.meta.env.VITE_API_URL?.replace(/\/+$/, "") ||
    "";

  // ============================================================
  //                    LOAD SHELTERS
  // ============================================================

  useEffect(() => {
    let alive = true;

    const loadShelters = async () => {
      setLoadingShelters(true);
      try {
        const token = localStorage.getItem("access");

        const res = await fetch(`${API_BASE}/api/shelters/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) throw new Error("Shelter load failed");

        const raw = await res.text();
        let data = [];
        try {
          data = JSON.parse(raw);
        } catch (_) {}

        if (!alive) return;

        setShelterOptions(Array.isArray(data) ? data : data.results || []);
        if (!selectedShelter && data.length > 0) {
          setSelectedShelter(String(data[0].id));
        }
      } catch (err) {
        setSheltersError(err.message || "Failed to load shelters");
      }
      setLoadingShelters(false);
    };

    loadShelters();
    return () => {
      alive = false;
    };
  }, []);

  // ============================================================
  //                    CARD INPUT FORMATTING
  // ============================================================

  const handleCardInput = (field, value) => {
    let formatted = value;

    if (field === "cardNumber") {
      formatted = value
        .replace(/\D/g, "")
        .slice(0, 16)
        .replace(/(\d{4})(?=\d)/g, "$1 ");
    }

    if (field === "expiry") {
      formatted = value.replace(/[^\d]/g, "").slice(0, 4);
      if (formatted.length >= 3) {
        formatted = formatted.slice(0, 2) + "/" + formatted.slice(2);
      }
    }

    if (field === "cvv") {
      formatted = value.replace(/\D/g, "").slice(0, 4);
    }

    setCardDetails((prev) => ({ ...prev, [field]: formatted }));
  };

  // ============================================================
  //                    VALIDATE CARD
  // ============================================================

  const validateCardDetails = () => {
    const { nameOnCard, cardNumber, expiry, cvv } = cardDetails;
  
    if (!nameOnCard.trim())
      return { valid: false, message: "Enter name on card." };
  
    // Accept ANY 16-digit card number
    const cleanNumber = cardNumber.replace(/\D/g, "");
    if (cleanNumber.length < 16)
      return { valid: false, message: "Card number must be 16 digits." };
  
    // Keep expiry validation
    if (!isValidExpiry(expiry))
      return { valid: false, message: "Invalid expiry date." };
  
    // Keep CVV validation
    if (!/^\d{3,4}$/.test(cvv))
      return { valid: false, message: "Invalid CVV." };
  
    return { valid: true };
  };
  

  // ============================================================
  //                    SUBMIT DONATION
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const amount = customAmount ? Number(customAmount) : selectedAmount;
    const token = localStorage.getItem("access");

    if (!token) {
      alert("You must be logged in to donate.");
      return;
    }

    const { valid, message } = validateCardDetails();
    if (!valid) {
      alert(message);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/donations/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          Amount: amount,
          Shelter: selectedShelter,
        }),
      });

      const raw = await res.text();
      console.log("Donation API raw response:", raw);

      let data = {};
      try {
        data = JSON.parse(raw);
      } catch (_) {}

      if (!res.ok) {
        alert(data.error || data.message || "Donation failed");
        return;
      }

      alert(`Donation successful! Donation ID: ${data.id}`);
    } catch (err) {
      alert("Network error");
    }
  };

  const finalAmount = customAmount ? Number(customAmount) : selectedAmount;

  // ============================================================
  //                    UI
  // ============================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-full mb-4">
            <Heart className="w-8 h-8 text-white" fill="white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Make a Difference Today
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your donation helps us rescue and care for abandoned pets.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* MAIN FORM */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8">

              {/* Donation Type */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-orange-500" />
                  Donation Type
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {["one-time", "monthly"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setDonationType(t)}
                      className={`p-4 rounded-lg border-2 ${
                        donationType === t
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200"
                      }`}
                    >
                      <p className="font-semibold capitalize">{t}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-orange-500" />
                  Select Amount
                </h3>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {presetAmounts.map((a) => (
                    <button
                      key={a}
                      onClick={() => {
                        setSelectedAmount(a);
                        setCustomAmount("");
                      }}
                      className={`p-4 rounded-lg border-2 font-semibold ${
                        selectedAmount === a && !customAmount
                          ? "border-orange-500 bg-orange-50 text-orange-600"
                          : "border-gray-200"
                      }`}
                    >
                      {formatCurrency(a)}
                    </button>
                  ))}
                </div>

                <label className="block text-sm font-medium mb-2">
                  Or enter custom amount
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-500">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Shelters */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-orange-500" />
                  Choose Shelter
                </h3>

                {loadingShelters ? (
                  <p>Loading shelters...</p>
                ) : sheltersError ? (
                  <p className="text-red-600">{sheltersError}</p>
                ) : (
                  <select
                    value={selectedShelter}
                    onChange={(e) => setSelectedShelter(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg"
                  >
                    {shelterOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.Name || s.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Card Info */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Lock className="w-5 h-5 mr-2 text-orange-500" />
                  Card Details
                </h3>

                <input
                  type="text"
                  placeholder="Name on card"
                  value={cardDetails.nameOnCard}
                  onChange={(e) => handleCardInput("nameOnCard", e.target.value)}
                  className="w-full mb-4 px-4 py-3 border rounded-lg"
                />

                <input
                  type="text"
                  placeholder="1234 5678 1234 5678"
                  value={cardDetails.cardNumber}
                  onChange={(e) =>
                    handleCardInput("cardNumber", e.target.value)
                  }
                  className="w-full mb-4 px-4 py-3 border rounded-lg"
                />

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardDetails.expiry}
                    onChange={(e) => handleCardInput("expiry", e.target.value)}
                    className="px-4 py-3 border rounded-lg"
                  />

                  <input
                    type="password"
                    placeholder="CVV"
                    value={cardDetails.cvv}
                    onChange={(e) => handleCardInput("cvv", e.target.value)}
                    className="px-4 py-3 border rounded-lg"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                className="w-full bg-orange-500 text-white py-4 rounded-lg font-semibold text-lg hover:bg-orange-600 flex items-center justify-center"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Donate {formatCurrency(finalAmount)}{" "}
                {donationType === "monthly" && "/ month"}
              </button>

              <p className="text-center text-sm text-gray-500 mt-4">
                <Shield className="w-4 h-4 inline mr-1" />
                Secure payment powered by Stripe
              </p>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Your Impact</h3>

              {[2500, 5000, 10000, 25000].map((amt) => (
                <div key={amt} className="flex items-start mb-3">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <div>
                    <p className="font-semibold">{formatCurrency(amt)}</p>
                    <p className="text-sm text-gray-600">
                      Helps support rescued pets
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Why Donate?</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-blue-500 mr-2" />
                  100% of donations go to pet care
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-blue-500 mr-2" />
                  Instant email receipt
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-blue-500 mr-2" />
                  Cancel monthly donations anytime
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Donors</h3>

              {[
                ["Sarah M.", 10000],
                ["Anonymous", 25000],
                ["John D.", 5000],
              ].map(([name, amt]) => (
                <div key={name} className="flex justify-between mb-2">
                  <span>{name}</span>
                  <strong className="text-orange-500">
                    {formatCurrency(amt)}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationPage;
