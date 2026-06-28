import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Profile({ onLogout }) {
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    userName: "Player",
    phone: "",
    totalWon: 0,
    matches: 0,
    kycStatus: "not_submitted",
  });

  const [tempName, setTempName] = useState("");

  const formatAmount = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN");
  };

  const getKycLabel = (status) => {
    if (status === "approved") return "Approved";
    if (status === "pending") return "Under Review";
    if (status === "rejected") return "Rejected";
    return "Not Submitted";
  };

  const getKycTextColor = (status) => {
    if (status === "approved") return "text-green-600";
    if (status === "pending") return "text-amber-500";
    if (status === "rejected") return "text-red-500";
    return "text-gray-400";
  };

  const getKycButtonText = (status) => {
    if (status === "approved") return "Approved";
    if (status === "pending") return "Under Review";
    if (status === "rejected") return "Submit Again";
    return "Complete KYC";
  };

  const getKycButtonClass = (status) => {
    if (status === "approved") return "bg-green-600 cursor-not-allowed opacity-90";
    if (status === "pending") return "bg-amber-500 cursor-not-allowed opacity-90";
    if (status === "rejected") return "bg-red-600 active:scale-95";
    return "bg-slate-900 active:scale-95";
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const storedUser = JSON.parse(localStorage.getItem("user")) || {};

        if (!token) {
          setProfile({
            userName: storedUser.name || "Player",
            phone: storedUser.phone || "",
            totalWon: storedUser.totalWon || 0,
            matches: storedUser.matches || 0,
            kycStatus: storedUser.kycStatus || "not_submitted",
          });
          setTempName(storedUser.name || "Player");
          return;
        }

        const res = await axios.get(`${API_URL}/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const user = res.data || {};

        const updatedProfile = {
          userName: user.name || storedUser.name || "Player",
          phone: user.phone || storedUser.phone || "",
          totalWon: user.totalWon || 0,
          matches: user.matches || 0,
          kycStatus: user.kycStatus || "not_submitted",
        };

        setProfile(updatedProfile);
        setTempName(updatedProfile.userName);

        localStorage.setItem(
          "user",
          JSON.stringify({
            ...storedUser,
            ...user,
            name: updatedProfile.userName,
            phone: updatedProfile.phone,
            totalWon: updatedProfile.totalWon,
            matches: updatedProfile.matches,
            kycStatus: updatedProfile.kycStatus,
          })
        );
      } catch (err) {
        console.log("Profile fetch error:", err);

        const storedUser = JSON.parse(localStorage.getItem("user")) || {};

        setProfile({
          userName: storedUser.name || "Player",
          phone: storedUser.phone || "",
          totalWon: storedUser.totalWon || 0,
          matches: storedUser.matches || 0,
          kycStatus: storedUser.kycStatus || "not_submitted",
        });

        setTempName(storedUser.name || "Player");
      }
    };

    fetchProfile();
  }, []);

  const saveProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const cleanName = String(tempName || "").trim();

      if (!cleanName) return alert("Name required");
      if (cleanName.length < 3 || cleanName.length > 20) {
        return alert("Name 3 se 20 character ke beech hona chahiye");
      }

      const res = await axios.patch(
        `${API_URL}/user/profile/name`,
        { name: cleanName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const savedUser = res.data?.user || {};
      const oldUser = JSON.parse(localStorage.getItem("user") || "{}");

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...oldUser,
          ...savedUser,
          name: savedUser.name || cleanName,
        })
      );

      setProfile((prev) => ({
        ...prev,
        userName: savedUser.name || cleanName,
      }));

      setTempName(savedUser.name || cleanName);
      setIsEditing(false);
      alert("Name update ho gaya");
    } catch (err) {
      alert(err.response?.data?.msg || "Name update failed");
    }
  };

  const handleLogout = () => {
    if (onLogout) return onLogout();

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleKycClick = () => {
    if (profile.kycStatus === "approved") {
      alert("Your KYC is already approved");
      return;
    }

    if (profile.kycStatus === "pending") {
      alert("Your KYC is already under review");
      return;
    }

    navigate("/kyc");
  };

  const menuItems = [
    { title: "History", icon: "↶", path: "/history", color: "bg-slate-100 text-slate-700" },
    { title: "My Wallet", icon: "▣", path: "/wallet", color: "bg-blue-50 text-blue-600" },
    { title: "Refer & Earn", icon: "🎁", path: "/refer", color: "bg-amber-50 text-amber-600" },
    { title: "Support", icon: "☏", path: "/support", color: "bg-teal-50 text-teal-600" },
  ];

  return (
    // Yahan pt-16 add kiya hai taaki black header ke neeche space ban jaye aur card poora dikhe
    <div className="min-h-screen bg-[#f1f5f9] px-3 pb-24 pt-16 font-sans">
      <div className="mx-auto max-w-[480px]">
        
        {/* Profile Card Header */}
        <div className="flex items-center gap-4 rounded-xl bg-white p-4 border border-slate-200/60 shadow-sm">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.userName}`}
            alt="avatar"
            className="h-16 w-16 rounded-full border-2 border-slate-100 bg-slate-50"
          />

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex gap-2">
                <input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-base font-medium outline-none focus:border-blue-500"
                />
                <button
                  onClick={saveProfile}
                  className="rounded-lg bg-green-500 px-4 font-bold text-white shadow-sm active:scale-95"
                >
                  ✔
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="truncate">
                  <h2 className="text-lg font-black text-slate-800 truncate">
                    {profile.userName}
                  </h2>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">{profile.phone || "No Number"}</p>
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-sm active:scale-95 transition-transform"
                >
                  ✏️
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Total Won & Matches Mini Dashboard */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white p-3.5 text-center border border-slate-200/60 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 tracking-wide">TOTAL WON</h4>
            <h2 className="mt-1 text-xl font-black text-green-600">
              ₹{formatAmount(profile.totalWon)}
            </h2>
          </div>

          <div className="rounded-xl bg-white p-3.5 text-center border border-slate-200/60 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 tracking-wide">MATCHES</h4>
            <h2 className="mt-1 text-xl font-black text-blue-600">
              {profile.matches}
            </h2>
          </div>
        </div>

        {/* KYC Status Container Banner */}
        <div className="mt-3 flex items-center justify-between rounded-xl bg-white p-3.5 border border-slate-200/60 shadow-sm">
          <div>
            <h4 className="text-sm font-bold text-slate-700">KYC Status</h4>
            <p className={`mt-0.5 text-xs font-extrabold ${getKycTextColor(profile.kycStatus)}`}>
              • {getKycLabel(profile.kycStatus)}
            </p>
          </div>

          <button
            onClick={handleKycClick}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-extrabold text-white shadow-sm transition-all ${getKycButtonClass(
              profile.kycStatus
            )}`}
          >
            {getKycButtonText(profile.kycStatus)}
          </button>
        </div>

        {/* Navigation Option Items List Card */}
        <div className="mt-3 rounded-xl bg-white px-4 py-1.5 border border-slate-200/60 shadow-sm">
          {menuItems.map((item) => (
            <div
              key={item.title}
              onClick={() => navigate(item.path)}
              className="flex cursor-pointer items-center gap-3.5 border-b border-slate-100 py-3 active:opacity-70 last:border-none"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${item.color} text-base font-bold`}>
                {item.icon}
              </div>

              <span className="flex-1 text-sm font-bold text-slate-700">
                {item.title}
              </span>

              <span className="text-xl text-slate-300 font-light">›</span>
            </div>
          ))}

          {/* Logout Trigger Option Row */}
          <div 
            onClick={handleLogout} 
            className="flex cursor-pointer items-center gap-3.5 py-3 border-t border-slate-100 active:opacity-70"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-500 text-base font-bold">
              ⇱
            </div>

            <span className="flex-1 text-sm font-bold text-red-500">
              Logout
            </span>

            <span className="text-xl text-slate-300 font-light">›</span>
          </div>
        </div>

      </div>
    </div>
  );
}
