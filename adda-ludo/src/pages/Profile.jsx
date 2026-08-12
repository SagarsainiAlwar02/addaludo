import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getData, getError } from "../api.js";
import { 
  History, Wallet, Gift, Headphones, LogOut, Pencil, Check, 
  Trophy, Gamepad2, ShieldCheck, ChevronRight, Phone
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
    <div className="min-h-screen bg-white px-4 pb-24 pt-6 font-sans text-slate-800 flex justify-center items-center">
      <div className="w-full max-w-[420px] space-y-4">
        
        {/* Main Profile Box (Sleek Dark Accent Card on White BG) */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-5 shadow-xl text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-4 relative z-10">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px] shadow-md">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.userName}`} 
                className="h-full w-full rounded-[14px] bg-slate-900 object-cover" 
                alt="avatar" 
              />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="flex gap-2 items-center">
                  <input 
                    value={tempName} 
                    maxLength={15}
                    onChange={(e) => setTempName(e.target.value)} 
                    className="w-full bg-slate-800 border border-indigo-500/50 rounded-xl px-3 py-1.5 outline-none text-xs font-semibold text-white" 
                    placeholder="Enter name"
                  />
                  <button onClick={saveProfile} className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-xl transition">
                    <Check className="w-4 h-4"/>
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-base font-black tracking-wide truncate">{profile.userName}</h2>
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3 text-indigo-400"/> {profile.phone || "No phone linked"}
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition active:scale-95"
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
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-2 text-emerald-600 mb-1.5">
              <div className="p-1.5 bg-emerald-50 rounded-lg">
                <Trophy className="w-4 h-4"/>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Won</span>
            </div>
            <h2 className="text-xl font-black text-slate-900">₹{profile.totalWon.toLocaleString()}</h2>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-2 text-indigo-600 mb-1.5">
              <div className="p-1.5 bg-indigo-50 rounded-lg">
                <Gamepad2 className="w-4 h-4"/>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Matches</span>
            </div>
            <h2 className="text-xl font-black text-slate-900">{profile.matches}</h2>
          </div>
        </div>

        {/* Dynamic KYC Box */}
        <div className={`rounded-2xl p-4 border shadow-sm flex items-center justify-between transition-all ${
           profile.kycStatus === 'approved' ? 'bg-emerald-50/60 border-emerald-100' :
           profile.kycStatus === 'rejected' ? 'bg-rose-50/60 border-rose-100' :
           'bg-indigo-50/60 border-indigo-100'
        }`}>
            <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${
                  profile.kycStatus === 'approved' ? 'bg-emerald-500 text-white' : 
                  profile.kycStatus === 'rejected' ? 'bg-rose-500 text-white' :
                  'bg-indigo-500 text-white'
                }`}>
                    <ShieldCheck className="w-5 h-5"/>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KYC Status</p>
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
                className={`text-xs font-bold px-3.5 py-2 rounded-xl transition active:scale-95 ${
                    profile.kycStatus === 'approved' ? 'bg-white text-emerald-600 border border-emerald-200' :
                    profile.kycStatus === 'rejected' ? 'bg-rose-600 text-white shadow-sm' :
                    'bg-indigo-600 text-white shadow-sm'
                }`}
            >
                {profile.kycStatus === 'approved' ? 'View' :
                 profile.kycStatus === 'rejected' ? 'Retry' : 'Verify'}
            </button>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-2xl p-2 border border-slate-100 shadow-sm divide-y divide-slate-50">
          {[
            { title: "History", icon: <History />, color: "from-blue-500 to-cyan-500", path: "/history" },
            { title: "My Wallet", icon: <Wallet />, color: "from-emerald-500 to-teal-500", path: "/wallet" },
            { title: "Refer & Earn", icon: <Gift />, color: "from-amber-500 to-orange-500", path: "/refer" },
            { title: "Support", icon: <Headphones />, color: "from-rose-500 to-pink-500", path: "/support" }
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-3.5 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-all group my-0.5"
            >
              <div className={`w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white shadow-sm group-hover:scale-105 transition-transform`}>
                {React.cloneElement(item.icon, { className: "w-4 h-4" })}
              </div>
              <span className="flex-1 font-semibold text-slate-700 text-xs">{item.title}</span>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
            </div>
          ))}

          <div onClick={handleLogout} className="flex items-center gap-3.5 p-3 hover:bg-rose-50 rounded-xl cursor-pointer transition group mt-0.5">
             <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-rose-500 shadow-sm group-hover:bg-rose-500 group-hover:text-white transition-colors">
                <LogOut className="w-4 h-4" />
             </div>
             <span className="flex-1 font-semibold text-rose-500 text-xs">Logout</span>
          </div>
        </div>

      </div>
    </div>
  );
}
