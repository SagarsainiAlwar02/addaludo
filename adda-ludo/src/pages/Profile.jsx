import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getData, getError } from "../api.js";
import { 
  History, Wallet, Gift, Headphones, LogOut, Pencil, Check, 
  Trophy, Gamepad2, ShieldCheck, ChevronRight, Phone, User
} from "lucide-react";

// 5 random characters generator function
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
    <div className="min-h-screen bg-slate-900 px-4 pb-24 pt-6 font-sans text-slate-100 flex justify-center items-center">
      <div className="w-full max-w-[420px] space-y-4">
        
        {/* Modern Dark Header / Profile Box */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 p-5 border border-slate-800 shadow-2xl">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-4 relative z-10">
            {/* Avatar Container */}
            <div className="relative group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px] shadow-lg shadow-indigo-500/20">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.userName}`} 
                  className="h-full w-full rounded-[14px] bg-slate-900 object-cover" 
                  alt="avatar" 
                />
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="flex gap-2 items-center">
                  <input 
                    value={tempName} 
                    maxLength={15}
                    onChange={(e) => setTempName(e.target.value)} 
                    className="w-full bg-slate-800/80 border border-indigo-500/50 rounded-xl px-3 py-1.5 outline-none text-xs font-semibold text-white focus:ring-2 focus:ring-indigo-500" 
                    placeholder="Enter name"
                  />
                  <button onClick={saveProfile} className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-xl transition shadow-lg shadow-emerald-500/20">
                    <Check className="w-4 h-4"/>
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-base font-extrabold text-white tracking-wide truncate flex items-center gap-1.5">
                      {profile.userName}
                    </h2>
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3 text-indigo-400"/> {profile.phone || "No phone linked"}
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700/50 transition active:scale-95"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden group">
            <div className="flex items-center gap-2 text-emerald-400 mb-1.5">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                <Trophy className="w-4 h-4"/>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Won</span>
            </div>
            <h2 className="text-xl font-black text-white">₹{profile.totalWon.toLocaleString()}</h2>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden group">
            <div className="flex items-center gap-2 text-indigo-400 mb-1.5">
              <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                <Gamepad2 className="w-4 h-4"/>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Matches</span>
            </div>
            <h2 className="text-xl font-black text-white">{profile.matches}</h2>
          </div>
        </div>

        {/* Dynamic KYC Box */}
        <div className={`rounded-2xl p-4 border backdrop-blur-md shadow-lg flex items-center justify-between transition-all ${
           profile.kycStatus === 'approved' ? 'bg-emerald-950/30 border-emerald-500/30' :
           profile.kycStatus === 'rejected' ? 'bg-rose-950/30 border-rose-500/30' :
           'bg-indigo-950/30 border-indigo-500/30'
        }`}>
            <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${
                  profile.kycStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 
                  profile.kycStatus === 'rejected' ? 'bg-rose-500/20 text-rose-400' :
                  'bg-indigo-500/20 text-indigo-400'
                }`}>
                    <ShieldCheck className="w-5 h-5"/>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KYC Status</p>
                    <p className={`text-xs font-bold ${
                        profile.kycStatus === 'approved' ? 'text-emerald-400' :
                        profile.kycStatus === 'rejected' ? 'text-rose-400' : 'text-indigo-400'
                    }`}>
                        {profile.kycStatus === 'approved' ? 'Verified' : 
                         profile.kycStatus === 'rejected' ? 'Rejected' : 
                         profile.kycStatus === 'pending' ? 'Under Review' : 'Not Verified'}
                    </p>
                </div>
            </div>
            <button
                onClick={() => navigate("/kyc")}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl transition active:scale-95 shadow-md ${
                    profile.kycStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20' :
                    profile.kycStatus === 'rejected' ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20' :
                    'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                }`}
            >
                {profile.kycStatus === 'approved' ? 'View' :
                 profile.kycStatus === 'rejected' ? 'Retry' : 'Verify'}
            </button>
        </div>

        {/* Menu Items */}
        <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-2 border border-slate-800/80 shadow-xl divide-y divide-slate-800/50">
          {[
            { title: "History", icon: <History />, color: "from-blue-500 to-cyan-500", path: "/history" },
            { title: "My Wallet", icon: <Wallet />, color: "from-emerald-500 to-teal-500", path: "/wallet" },
            { title: "Refer & Earn", icon: <Gift />, color: "from-amber-500 to-orange-500", path: "/refer" },
            { title: "Support", icon: <Headphones />, color: "from-rose-500 to-pink-500", path: "/support" }
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-3.5 p-3 hover:bg-slate-800/60 rounded-xl cursor-pointer transition-all group my-0.5"
            >
              <div className={`w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white shadow-md group-hover:scale-105 transition-transform`}>
                {React.cloneElement(item.icon, { className: "w-4 h-4" })}
              </div>
              <span className="flex-1 font-semibold text-slate-200 text-xs">{item.title}</span>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
            </div>
          ))}

          <div onClick={handleLogout} className="flex items-center gap-3.5 p-3 hover:bg-rose-500/10 rounded-xl cursor-pointer transition group mt-0.5">
             <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-rose-400 shadow-md group-hover:bg-rose-500 group-hover:text-white transition-colors">
                <LogOut className="w-4 h-4" />
             </div>
             <span className="flex-1 font-semibold text-rose-400 text-xs">Logout</span>
          </div>
        </div>

      </div>
    </div>
  );
}
