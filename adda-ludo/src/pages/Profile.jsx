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
  Phone
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Profile({ onLogout }) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({ userName: "Player", phone: "", totalWon: 0, matches: 0, kycStatus: "not_submitted" });
  const [tempName, setTempName] = useState("");

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
        setProfile({ userName: user.name || "Player", phone: user.phone || "", totalWon: user.totalWon || 0, matches: user.matches || 0, kycStatus: user.kycStatus || "not_submitted" });
        setTempName(user.name || "Player");
      } catch (err) { console.log(err); }
    };
    fetchProfile();
  }, []);

  const saveProfile = async () => {
    try {
        const token = localStorage.getItem("token");
        await axios.patch(`${API_URL}/user/profile/name`, { name: tempName }, { headers: { Authorization: `Bearer ${token}` } });
        setProfile(prev => ({...prev, userName: tempName}));
        setIsEditing(false);
    } catch (err) { alert("Update failed"); }
  };

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  // Menu items with Gradient Icon Styles
  const menuItems = [
    { title: "History", icon: <History className="w-6 h-6 text-white" />, path: "/history", gradient: "from-indigo-500 to-blue-600", shadow: "shadow-indigo-200" },
    { title: "My Wallet", icon: <Wallet className="w-6 h-6 text-white" />, path: "/wallet", gradient: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-200" },
    { title: "Refer & Earn", icon: <Gift className="w-6 h-6 text-white" />, path: "/refer", gradient: "from-amber-500 to-orange-600", shadow: "shadow-amber-200" },
    { title: "Support", icon: <Headphones className="w-6 h-6 text-white" />, path: "/support", gradient: "from-sky-500 to-blue-600", shadow: "shadow-sky-200" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-24 pt-8 font-sans text-slate-800">
      <div className="mx-auto max-w-[480px]">
        
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 mb-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-3 opacity-10">
             <Trophy className="w-24 h-24 text-emerald-500"/>
           </div>
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.userName}`} className="h-16 w-16 rounded-full border-4 border-slate-50 shadow-md" />
          
          <div className="flex-1">
            {isEditing ? (
              <div className="flex gap-2">
                <input value={tempName} onChange={(e) => setTempName(e.target.value)} className="w-full bg-slate-100 rounded-lg px-3 py-1 outline-none text-sm" />
                <button onClick={saveProfile} className="bg-emerald-500 text-white p-2 rounded-lg"><Check className="w-4 h-4"/></button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-900">{profile.userName}</h2>
                  <p className="text-xs text-slate-400 font-bold flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3"/> {profile.phone || "No phone"}</p>
                </div>
                <button onClick={() => setIsEditing(true)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition">
                  <Pencil className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:scale-[1.02] transition">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Won</span>
            <h2 className="text-xl font-black text-emerald-600 mt-1">₹{profile.totalWon.toLocaleString()}</h2>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:scale-[1.02] transition">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Matches</span>
            <h2 className="text-xl font-black text-blue-600 mt-1">{profile.matches}</h2>
          </div>
        </div>

        {/* Menu Items with Premium Icon Style */}
        <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100">
          {menuItems.map((item) => (
            <div
              key={item.title}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-4 p-3.5 hover:bg-slate-50 rounded-2xl cursor-pointer transition group"
            >
              {/* Premium Gradient Icon Container */}
              <div className={`w-12 h-12 flex items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} ${item.shadow} shadow-lg transition-transform group-hover:scale-105`}>
                {item.icon}
              </div>
              
              <span className="flex-1 font-bold text-slate-700 ml-1">{item.title}</span>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </div>
          ))}

          {/* Logout with Rose Gradient */}
          <div onClick={handleLogout} className="flex items-center gap-4 p-3.5 hover:bg-red-50 rounded-2xl cursor-pointer transition">
             <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-200">
                <LogOut className="w-6 h-6 text-white" />
             </div>
             <span className="flex-1 font-bold text-red-500 ml-1">Logout</span>
          </div>
        </div>

      </div>
    </div>
  );
}
