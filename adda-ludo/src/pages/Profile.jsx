import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
// Lucide React Icons for beautiful & clean premium look
import { 
  History, 
  Wallet, 
  Gift, 
  Headphones, 
  LogOut, 
  Pencil, 
  Check, 
  Trophy, 
  Gamepad2, 
  ShieldCheck, 
  ChevronRight,
  Phone
} from "lucide-react";

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
    if (status === "approved") return "text-emerald-400";
    if (status === "pending") return "text-amber-400";
    if (status === "rejected") return "text-rose-400";
    return "text-slate-400";
  };

  const getKycButtonText = (status) => {
    if (status === "approved") return "Approved";
    if (status === "pending") return "Under Review";
    if (status === "rejected") return "Submit Again";
    return "Complete KYC";
  };

  const getKycButtonClass = (status) => {
    if (status === "approved") return "bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 cursor-not-allowed opacity-90";
    if (status === "pending") return "bg-amber-600/30 text-amber-400 border border-amber-500/30 cursor-not-allowed opacity-90";
    if (status === "rejected") return "bg-rose-600 text-white active:scale-95";
    return "bg-gradient-to-r from-emerald-500 to-blue-500 text-white active:scale-95";
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
    { title: "History", icon: <History className="w-5 h-5 text-indigo-400" />, path: "/history", bg: "bg-indigo-500/10 border border-indigo-500/20" },
    { title: "My Wallet", icon: <Wallet className="w-5 h-5 text-emerald-400" />, path: "/wallet", bg: "bg-emerald-500/10 border border-emerald-500/20" },
    { title: "Refer & Earn", icon: <Gift className="w-5 h-5 text-amber-400" />, path: "/refer", bg: "bg-amber-500/10 border border-amber-500/20" },
    { title: "Support", icon: <Headphones className="w-5 h-5 text-cyan-400" />, path: "/support", bg: "bg-cyan-500/10 border border-cyan-500/20" },
  ];

  return (
    // AddaLudo Themes Colors Match: Deep Blue-Black Gradient Background
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a] px-4 pb-24 pt-20 text-slate-100 font-sans">
      <div className="mx-auto max-w-[480px]">
        
        {/* Profile Premium Card Container */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#1e293b] p-5 border border-slate-700/60 shadow-xl mb-4">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500 opacity-10 blur-3xl"></div>
          
          <div className="relative z-10 flex items-center gap-4">
            <div className="relative">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.userName}`}
                alt="avatar"
                className="h-16 w-16 rounded-full border-2 border-emerald-500 bg-slate-800 shadow-inner"
              />
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 h-4 w-4 rounded-full border-2 border-[#1e293b] animate-pulse"></div>
            </div>

            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="flex gap-2">
                  <input
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="w-full rounded-xl bg-slate-800/80 border border-slate-600 px-3 py-1.5 text-base font-medium text-white outline-none focus:border-emerald-500 backdrop-blur"
                  />
                  <button
                    onClick={saveProfile}
                    className="rounded-xl bg-emerald-500 px-4 font-bold text-white shadow-md active:scale-95 transition flex items-center justify-center"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate">
                    <h2 className="text-xl font-black text-white tracking-wide truncate">
                      {profile.userName}
                    </h2>
                    <p className="text-xs font-semibold text-slate-400 mt-1 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      {profile.phone || "No Number Connected"}
                    </p>
                  </div>

                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm active:scale-95 border border-slate-700 transition"
                  >
                    <Pencil className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Stat Boxes (Total Won & Matches Played) */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Total Won - Elegant Gold/Emerald Blend */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#1e293b] to-[#0f172a] p-4 text-center border border-slate-700/60 shadow-md">
            <div className="absolute top-1 right-2 opacity-5">
              <Trophy className="w-16 h-16 text-emerald-400" />
            </div>
            <div className="flex justify-center mb-1">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <h4 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Total Won</h4>
            <h2 className="mt-1 text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-500">
              ₹{formatAmount(profile.totalWon)}
            </h2>
          </div>

          {/* Matches Played - Metallic Blue theme */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#1e293b] to-[#0f172a] p-4 text-center border border-slate-700/60 shadow-md">
            <div className="absolute top-1 right-2 opacity-5">
              <Gamepad2 className="w-16 h-16 text-blue-400" />
            </div>
            <div className="flex justify-center mb-1">
              <Gamepad2 className="w-5 h-5 text-blue-400" />
            </div>
            <h4 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Matches</h4>
            <h2 className="mt-1 text-xl font-black text-blue-400">
              {profile.matches}
            </h2>
          </div>
        </div>

        {/* KYC Status Section Container */}
        <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#1e293b] to-[#0f172a] p-4 border border-slate-700/60 shadow-md mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-200">KYC Verification</h4>
              <p className={`mt-0.5 text-xs font-extrabold ${getKycTextColor(profile.kycStatus)}`}>
                ● {getKycLabel(profile.kycStatus)}
              </p>
            </div>
          </div>

          <button
            onClick={handleKycClick}
            className={`rounded-xl px-4 py-2 text-xs font-black shadow-md transition-all uppercase tracking-wider ${getKycButtonClass(
              profile.kycStatus
            )}`}
          >
            {getKycButtonText(profile.kycStatus)}
          </button>
        </div>

        {/* Option Navigation Link Menu list */}
        <div className="rounded-2xl bg-[#1e293b]/60 border border-slate-700/50 shadow-xl overflow-hidden backdrop-blur-sm">
          {menuItems.map((item) => (
            <div
              key={item.title}
              onClick={() => navigate(item.path)}
              className="flex cursor-pointer items-center gap-4 border-b border-slate-800/60 px-4 py-3.5 hover:bg-slate-800/30 active:bg-slate-800/50 transition-colors"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.bg}`}>
                {item.icon}
              </div>

              <span className="flex-1 text-sm font-bold text-slate-200 tracking-wide">
                {item.title}
              </span>

              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
          ))}

          {/* Logout Trigger Option Row Container */}
          <div 
            onClick={handleLogout} 
            className="flex cursor-pointer items-center gap-4 px-4 py-3.5 hover:bg-rose-500/5 active:bg-rose-500/10 transition-colors group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 group-hover:bg-rose-500/20">
              <LogOut className="w-4 h-4" />
            </div>

            <span className="flex-1 text-sm font-bold text-rose-400 tracking-wide">
              Logout Account
            </span>

            <ChevronRight className="w-4 h-4 text-rose-400/60 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

      </div>
    </div>
  );
}
