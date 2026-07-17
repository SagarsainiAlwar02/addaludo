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

  const menuItems = [
    { title: "History", icon: <History className="w-4 h-4 text-white" />, path: "/history", gradient: "from-indigo-500 to-blue-600", shadow: "shadow-indigo-100" },
    { title: "My Wallet", icon: <Wallet className="w-4 h-4 text-white" />, path: "/wallet", gradient: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-100" },
    { title: "Refer & Earn", icon: <Gift className="w-4 h-4 text-white" />, path: "/refer", gradient: "from-amber-500 to-orange-600", shadow: "shadow-amber-100" },
    { title: "Support", icon: <Headphones className="w-4 h-4 text-white" />, path: "/support", gradient: "from-sky-500 to-blue-600", shadow: "shadow-sky-100" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-3 pb-20 pt-4 font-sans text-slate-800">
      <div className="mx-auto max-w-[420px]">
        
        {/* Profile Card - Sleek & Compact */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3 mb-3 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-1 opacity-5">
             <Trophy className="w-16 h-16 text-emerald-500"/>
           </div>
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.userName}`} className="h-12 w-12 rounded-full border-2 border-slate-50 shadow" />
          
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex gap-1.5">
                <input value={tempName} onChange={(e) => setTempName(e.target.value)} className="w-full bg-slate-100 rounded-md px-2 py-0.5 outline-none text-xs" />
                <button onClick={saveProfile} className="bg-emerald-500 text-white p-1.5 rounded-md"><Check className="w-3.5 h-3.5"/></button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div className="truncate">
                  <h2 className="text-base font-black text-slate-900 leading-tight truncate">{profile.userName}</h2>
                  <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1 mt-0.5"><Phone className="w-2.5 h-2.5"/> {profile.phone || "No phone"}</p>
                </div>
                <button onClick={() => setIsEditing(true)} className="p-1.5 bg-slate-100 rounded-full hover:bg-slate-200 transition">
                  <Pencil className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid - Smaller height */}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Won</span>
            <h2 className="text-base font-black text-emerald-600 mt-0.5">₹{profile.totalWon.toLocaleString()}</h2>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Matches</span>
            <h2 className="text-base font-black text-blue-600 mt-0.5">{profile.matches}</h2>
          </div>
        </div>

        {/* KYC Section - Thin Bar */}
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600"><ShieldCheck className="w-4 h-4"/></div>
             <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">KYC Status</p>
                <p className={`text-xs font-black mt-0.5 ${profile.kycStatus === 'approved' ? 'text-emerald-600' : 'text-slate-600'}`}>
                    {profile.kycStatus === 'approved' ? 'Verified' : 'Not Verified'}
                </p>
             </div>
          </div>
          <button onClick={() => navigate("/kyc")} className="text-[10px] font-black bg-slate-900 text-white px-3 py-1.5 rounded-md active:scale-95 transition">Verify</button>
        </div>

        {/* Menu Items - Reduced Padding & Small Icons */}
        <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100">
          {menuItems.map((item) => (
            <div
              key={item.title}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition group"
            >
              {/* Smaller Gradient Icon */}
              <div className={`w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} ${item.shadow} shadow-md transition-transform group-hover:scale-105`}>
                {item.icon}
              </div>
              
              <span className="flex-1 font-bold text-slate-700 text-xs ml-0.5">{item.title}</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
          ))}

          {/* Logout Option Row */}
          <div onClick={handleLogout} className="flex items-center gap-3 p-2.5 hover:bg-red-50 rounded-xl cursor-pointer transition">
             <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-md shadow-red-100">
                <LogOut className="w-4 h-4 text-white" />
             </div>
             <span className="flex-1 font-bold text-red-500 text-xs ml-0.5">Logout</span>
          </div>
        </div>

      </div>
    </div>
  );
}
