import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  History, Wallet, Gift, Headphones, LogOut, Pencil, Check, 
  Trophy, Gamepad2, ShieldCheck, ChevronRight, Phone
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
        const res = await axios.get(`${API_URL}/user/profile`, { headers: { Authorization: `Bearer ${token}` } });
        setProfile({ userName: res.data.name || "Player", phone: res.data.phone || "", totalWon: res.data.totalWon || 0, matches: res.data.matches || 0, kycStatus: res.data.kycStatus || "not_submitted" });
        setTempName(res.data.name || "Player");
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
        alert("Name Updated!");
    } catch (err) { alert("Update failed"); }
  };

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  return (
    <div className="min-h-screen bg-slate-50 px-3 pb-24 pt-24 font-sans text-slate-800">
      <div className="mx-auto max-w-[420px]">
        
        {/* Profile Box - Edit Option Restored */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-l-indigo-500 flex items-center gap-3 mb-4 transition-all hover:shadow-md">
          <div className="bg-indigo-100 p-1 rounded-full">
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.userName}`} className="h-10 w-10" />
          </div>
          
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex gap-1.5 items-center">
                <input value={tempName} onChange={(e) => setTempName(e.target.value)} className="w-full bg-slate-100 rounded-lg px-2 py-1 outline-none text-xs font-bold" />
                <button onClick={saveProfile} className="bg-emerald-500 text-white p-1.5 rounded-lg"><Check className="w-3.5 h-3.5"/></button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-black text-slate-900 truncate">{profile.userName}</h2>
                  <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1"><Phone className="w-2.5 h-2.5"/> {profile.phone || "No phone"}</p>
                </div>
                <button onClick={() => setIsEditing(true)} className="p-1.5 bg-slate-100 rounded-full hover:bg-slate-200 transition">
                  <Pencil className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gradient-to-br from-emerald-50 to-white p-3 rounded-2xl border border-emerald-100 shadow-sm hover:scale-[1.02] transition">
            <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
               <Trophy className="w-3 h-3"/>
               <span className="text-[9px] font-bold uppercase tracking-wider">Total Won</span>
            </div>
            <h2 className="text-lg font-black text-emerald-700">₹{profile.totalWon.toLocaleString()}</h2>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-white p-3 rounded-2xl border border-blue-100 shadow-sm hover:scale-[1.02] transition">
            <div className="flex items-center gap-1.5 text-blue-600 mb-1">
               <Gamepad2 className="w-3 h-3"/>
               <span className="text-[9px] font-bold uppercase tracking-wider">Matches</span>
            </div>
            <h2 className="text-lg font-black text-blue-700">{profile.matches}</h2>
          </div>
        </div>

        {/* KYC Box */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 shadow-sm border border-indigo-100 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-500 p-2 rounded-xl text-white"><ShieldCheck className="w-5 h-5"/></div>
             <div>
                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">KYC Status</p>
                <p className={`text-xs font-black ${profile.kycStatus === 'approved' ? 'text-indigo-700' : 'text-slate-600'}`}>
                    {profile.kycStatus === 'approved' ? 'Verified Account' : 'Pending Verification'}
                </p>
             </div>
          </div>
          <button onClick={() => navigate("/kyc")} className="text-[10px] font-bold bg-white text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-200 active:scale-95 transition">Verify</button>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100">
          {[
            { title: "History", icon: <History />, color: "from-blue-400 to-blue-600", path: "/history" },
            { title: "My Wallet", icon: <Wallet />, color: "from-emerald-400 to-emerald-600", path: "/wallet" },
            { title: "Refer & Earn", icon: <Gift />, color: "from-amber-400 to-amber-600", path: "/refer" },
            { title: "Support", icon: <Headphones />, color: "from-rose-400 to-rose-600", path: "/support" }
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-all group"
            >
              <div className={`w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white shadow-lg shadow-slate-200 group-hover:rotate-6 transition-transform`}>
                {React.cloneElement(item.icon, { className: "w-4 h-4" })}
              </div>
              <span className="flex-1 font-bold text-slate-700 text-xs">{item.title}</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
          ))}

          <div onClick={handleLogout} className="flex items-center gap-3 p-3 hover:bg-red-50 rounded-xl cursor-pointer transition">
             <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-lg">
                <LogOut className="w-4 h-4" />
             </div>
             <span className="flex-1 font-bold text-red-500 text-xs">Logout</span>
          </div>
        </div>
      </div>
    </div>
  );
}
