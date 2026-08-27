import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getData, getError } from "../api.js";
import { 
  History, Wallet, Gift, Headphones, LogOut, Pencil, Check, 
  Trophy, Gamepad2, ShieldCheck, ChevronRight, Phone, Download
} from "lucide-react";

const generateRandomName = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomName = "";
  for (let i = 0; i < 5; i++) {
    randomName += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return randomName;
};

export default function Profile({ onLogout }) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({ 
    userName: "", 
    phone: "", 
    totalWon: 0, 
    matches: 0, 
    kycStatus: "not_submitted" 
  });
  const [tempName, setTempName] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/user/profile");
        const data = getData(res);
        const user = data?.user || {};

        const finalUserName = user.name || generateRandomName();
        const stats = data?.stats || {};
        const wallet = data?.wallet || {};

        setProfile({ 
          userName: finalUserName, 
          phone: user.phone || "", 
          totalWon: stats.totalWon || wallet.winnings || 0, 
          matches: `${stats.wonMatches || 0}/${stats.totalMatches || 0}`, 
          kycStatus: user.kycStatus || "not_submitted" 
        });
        
        setTempName(finalUserName);
      } catch (err) { 
        console.log("Error fetching profile:", err); 
      }
    };
    fetchProfile();
  }, []);

  const saveProfile = async () => {
    if (tempName.trim().length < 3) {
      alert("Name minimum 3 characters ka hona chahiye!");
      return;
    }

    try {
      await api.patch("/user/profile", { name: tempName });
      
      setProfile(prev => ({ ...prev, userName: tempName }));
      setIsEditing(false);
      alert("Name Updated!");
    } catch (err) { 
      alert(getError(err)); 
    }
  };

  const handleLogout = () => { 
    localStorage.clear(); 
    navigate("/login"); 
  };

  return (
    // Lowered top-padding (pt-24) to push profile box down and scale-95 to lower overall zoom
    <div className="min-h-screen bg-slate-100 px-3 pb-20 pt-24 font-sans text-slate-800 flex justify-center items-start scale-95 origin-top">
      <div className="w-full max-w-[400px] space-y-3">
        
        {/* Ludo Themed Main Profile Card */}
        <div 
          className="relative overflow-hidden rounded-2xl p-4 shadow-lg text-white border border-indigo-900/30 bg-cover bg-center"
          style={{ 
            backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.92), rgba(30, 27, 75, 0.85)), url('https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?q=80&w=800&auto=format&fit=crop')` 
          }}
        >
          <div className="flex items-center gap-3 relative z-10">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-xl bg-amber-400 p-[2px] shadow-md shrink-0">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.userName}`} 
                className="h-full w-full rounded-[10px] bg-slate-900 object-cover" 
                alt="avatar" 
              />
            </div>

            {/* User Details */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="flex gap-1.5 items-center">
                  <input 
                    value={tempName} 
                    maxLength={15}
                    onChange={(e) => setTempName(e.target.value)} 
                    className="w-full bg-slate-900/90 border border-amber-400/50 rounded-lg px-2 py-1 outline-none text-xs font-semibold text-white" 
                    placeholder="Enter name"
                  />
                  <button onClick={saveProfile} className="bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded-lg transition">
                    <Check className="w-3.5 h-3.5"/>
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-sm font-black tracking-wide truncate text-white">{profile.userName}</h2>
                    <p className="text-[11px] text-amber-300 font-bold flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-amber-400"/> {profile.phone || "No phone linked"}
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-amber-400 rounded-lg border border-amber-400/30 transition active:scale-95"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ludo Wallpaper Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Total Won Box */}
          <div 
            className="p-3 rounded-2xl shadow-md border border-emerald-900/20 bg-cover bg-center relative overflow-hidden"
            style={{ 
              backgroundImage: `linear-gradient(to bottom right, rgba(6, 78, 59, 0.9), rgba(15, 23, 42, 0.85)), url('https://images.unsplash.com/photo-1541278107931-e006523892df?q=80&w=400&auto=format&fit=crop')` 
            }}
          >
            <div className="flex items-center gap-1.5 text-emerald-300 mb-1">
              <div className="p-1 bg-emerald-500/20 rounded-md">
                <Trophy className="w-3.5 h-3.5"/>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-200">Total Won</span>
            </div>
            <h2 className="text-base font-black text-white">₹{profile.totalWon.toLocaleString()}</h2>
          </div>

          {/* Matches Box */}
          <div 
            className="p-3 rounded-2xl shadow-md border border-indigo-900/20 bg-cover bg-center relative overflow-hidden"
            style={{ 
              backgroundImage: `linear-gradient(to bottom right, rgba(30, 27, 75, 0.9), rgba(15, 23, 42, 0.85)), url('https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?q=80&w=400&auto=format&fit=crop')` 
            }}
          >
            <div className="flex items-center gap-1.5 text-indigo-300 mb-1">
              <div className="p-1 bg-indigo-500/20 rounded-md">
                <Gamepad2 className="w-3.5 h-3.5"/>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-200">Matches</span>
            </div>
            <h2 className="text-base font-black text-white">{profile.matches}</h2>
          </div>
        </div>

        {/* KYC Status Box */}
        <div className={`rounded-2xl p-3 border shadow-sm flex items-center justify-between transition-all ${
           profile.kycStatus === 'approved' ? 'bg-emerald-50 border-emerald-200' :
           profile.kycStatus === 'rejected' ? 'bg-rose-50 border-rose-200' :
           'bg-indigo-50 border-indigo-200'
        }`}>
            <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${
                  profile.kycStatus === 'approved' ? 'bg-emerald-500 text-white' : 
                  profile.kycStatus === 'rejected' ? 'bg-rose-500 text-white' :
                  'bg-indigo-600 text-white'
                }`}>
                    <ShieldCheck className="w-4 h-4"/>
                </div>
                <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">KYC Status</p>
                    <p className={`text-xs font-bold ${
                        profile.kycStatus === 'approved' ? 'text-emerald-700' :
                        profile.kycStatus === 'rejected' ? 'text-rose-700' : 'text-indigo-700'
                    }`}>
                        {profile.kycStatus === 'approved' ? 'Verified' : 
                         profile.kycStatus === 'rejected' ? 'Rejected' : 
                         profile.kycStatus === 'pending' ? 'Under Review' : 'Not Verified'}
                    </p>
                </div>
            </div>
            <button
                onClick={() => navigate("/kyc")}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition active:scale-95 ${
                    profile.kycStatus === 'approved' ? 'bg-white text-emerald-600 border border-emerald-200' :
                    profile.kycStatus === 'rejected' ? 'bg-rose-600 text-white shadow-sm' :
                    'bg-indigo-600 text-white shadow-sm'
                }`}
            >
                {profile.kycStatus === 'approved' ? 'View' :
                 profile.kycStatus === 'rejected' ? 'Retry' : 'Verify'}
            </button>
        </div>

        {/* Navigation Menu */}
        <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-sm divide-y divide-slate-100">
          {[
            { title: "History", icon: <History />, color: "from-blue-500 to-cyan-500", path: "/history" },
            { title: "My Wallet", icon: <Wallet />, color: "from-emerald-500 to-teal-500", path: "/wallet" },
            { title: "Refer & Earn", icon: <Gift />, color: "from-amber-500 to-orange-500", path: "/refer" },
            { title: "Support", icon: <Headphones />, color: "from-rose-500 to-pink-500", path: "/support" }
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-all group my-0.5"
            >
              <div className={`w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-br ${item.color} text-white shadow-sm group-hover:scale-105 transition-transform`}>
                {React.cloneElement(item.icon, { className: "w-3.5 h-3.5" })}
              </div>
              <span className="flex-1 font-bold text-slate-700 text-xs">{item.title}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
            </div>
          ))}

          {(() => {
            const ua = navigator.userAgent || "";
            const isApp = /AddaLudo/i.test(ua) || /WebView/i.test(ua) || /wv/i.test(ua);
            if (isApp) return null;
            return (
              <a
                href={`${import.meta.env.VITE_API_URL?.replace(/\/api$/, "") || "http://localhost:5000"}/api/app/download`}
                target="_blank"
                className="flex items-center gap-3 p-2.5 hover:bg-emerald-50 rounded-xl cursor-pointer transition group mt-0.5"
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-emerald-500 shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <Download className="w-3.5 h-3.5" />
                </div>
                <span className="flex-1 font-bold text-emerald-500 text-xs">Download App</span>
              </a>
            );
          })()}

          <div onClick={handleLogout} className="flex items-center gap-3 p-2.5 hover:bg-rose-50 rounded-xl cursor-pointer transition group mt-0.5">
             <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-rose-500 shadow-sm group-hover:bg-rose-500 group-hover:text-white transition-colors">
                <LogOut className="w-3.5 h-3.5" />
             </div>
             <span className="flex-1 font-bold text-rose-500 text-xs">Logout</span>
          </div>
        </div>

      </div>
    </div>
  );
}
