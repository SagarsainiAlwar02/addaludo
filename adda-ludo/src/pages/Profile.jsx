import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
  Phone,
  User
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Profile({ onLogout }) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({ userName: "Player", phone: "", totalWon: 0, matches: 0, kycStatus: "not_submitted" });
  const [tempName, setTempName] = useState("");

  // ... (All fetch logic remains the same)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const storedUser = JSON.parse(localStorage.getItem("user")) || {};
        if (!token) {
          setProfile({ userName: storedUser.name || "Player", phone: storedUser.phone || "", totalWon: storedUser.totalWon || 0, matches: storedUser.matches || 0, kycStatus: storedUser.kycStatus || "not_submitted" });
          setTempName(storedUser.name || "Player");
          return;
        }
        const res = await axios.get(`${API_URL}/user/profile`, { headers: { Authorization: `Bearer ${token}` } });
        const user = res.data || {};
        const updatedProfile = { userName: user.name || storedUser.name || "Player", phone: user.phone || storedUser.phone || "", totalWon: user.totalWon || 0, matches: user.matches || 0, kycStatus: user.kycStatus || "not_submitted" };
        setProfile(updatedProfile);
        setTempName(updatedProfile.userName);
      } catch (err) {
        console.log("Profile fetch error:", err);
      }
    };
    fetchProfile();
  }, []);

  const saveProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const cleanName = String(tempName || "").trim();
      if (!cleanName) return alert("Name required");
      const res = await axios.patch(`${API_URL}/user/profile/name`, { name: cleanName }, { headers: { Authorization: `Bearer ${token}` } });
      const savedUser = res.data?.user || {};
      setProfile((prev) => ({ ...prev, userName: savedUser.name || cleanName }));
      setIsEditing(false);
      alert("Profile updated!");
    } catch (err) { alert("Failed to update"); }
  };

  const handleLogout = () => { if (onLogout) return onLogout(); localStorage.clear(); navigate("/login"); };

  const menuItems = [
    { title: "History", icon: <History className="w-5 h-5" />, path: "/history", color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "My Wallet", icon: <Wallet className="w-5 h-5" />, path: "/wallet", color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Refer & Earn", icon: <Gift className="w-5 h-5" />, path: "/refer", color: "text-amber-600", bg: "bg-amber-50" },
    { title: "Support", icon: <Headphones className="w-5 h-5" />, path: "/support", color: "text-sky-600", bg: "bg-sky-50" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-24 pt-8 font-sans text-slate-800">
      <div className="mx-auto max-w-[480px]">
        
        {/* Profile Card - White with Subtle Shadow */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 mb-6">
          <div className="relative">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.userName}`}
              alt="avatar"
              className="h-16 w-16 rounded-full border-4 border-slate-50 bg-slate-100"
            />
          </div>
          
          <div className="flex-1">
            {isEditing ? (
              <div className="flex gap-2">
                <input value={tempName} onChange={(e) => setTempName(e.target.value)} className="w-full bg-slate-100 rounded-lg px-3 py-1 outline-none" />
                <button onClick={saveProfile} className="bg-emerald-500 text-white px-3 rounded-lg"><Check className="w-4 h-4"/></button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{profile.userName}</h2>
                  <p className="text-xs text-slate-400 font-medium flex items-center gap-1"><Phone className="w-3 h-3"/> {profile.phone || "No phone"}</p>
                </div>
                <button onClick={() => setIsEditing(true)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition">
                  <Pencil className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Section - Dynamic Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
            <div className="flex items-center gap-2 mb-2 text-emerald-600">
              <Trophy className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Won</span>
            </div>
            <h2 className="text-xl font-black text-slate-900">₹{profile.totalWon.toLocaleString()}</h2>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
            <div className="flex items-center gap-2 mb-2 text-blue-600">
              <Gamepad2 className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Matches</span>
            </div>
            <h2 className="text-xl font-black text-slate-900">{profile.matches}</h2>
          </div>
        </div>

        {/* KYC Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><ShieldCheck className="w-5 h-5"/></div>
             <div>
                <p className="text-xs font-bold text-slate-400 uppercase">KYC Status</p>
                <p className={`text-sm font-bold ${profile.kycStatus === 'approved' ? 'text-emerald-600' : 'text-slate-600'}`}>
                    {profile.kycStatus === 'approved' ? 'Verified' : 'Not Verified'}
                </p>
             </div>
          </div>
          <button onClick={() => navigate("/kyc")} className="text-xs font-bold bg-slate-900 text-white px-4 py-2 rounded-lg active:scale-95 transition">Verify</button>
        </div>

        {/* Menu Items - Cleaner Look */}
        <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100">
          {menuItems.map((item) => (
            <div
              key={item.title}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl cursor-pointer transition group"
            >
              <div className={`p-3 rounded-2xl ${item.bg}${item.color}`}>
                {item.icon}
              </div>
              <span className="flex-1 font-bold text-slate-700">{item.title}</span>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition" />
            </div>
          ))}

          <div onClick={handleLogout} className="flex items-center gap-4 p-4 hover:bg-red-50 rounded-2xl cursor-pointer transition">
             <div className="p-3 rounded-2xl bg-red-50 text-red-500"><LogOut className="w-5 h-5" /></div>
             <span className="flex-1 font-bold text-red-500">Logout</span>
          </div>
        </div>

      </div>
    </div>
  );
}
