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
    <div className="min-h-screen bg-slate-50 px-3 pb-24 pt-24 font-sans text-slate-800">
      <div className="mx-auto max-w-[420px]">
        
        {/* Profile Box */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-l-indigo-500 flex items-center gap-3 mb-4 transition-all hover:shadow-md">
          <div className="bg-indigo-100 p-1 rounded-full">
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.userName}`} className="h-10 w-10" alt="avatar" />
          </div>
          
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex gap-1.5 items-center">
                <input 
                  value={tempName} 
                  maxLength={15}
                  onChange={(e) => setTempName(e.target.value)} 
                  className="w-full bg-slate-100 rounded-lg px-2 py-1 outline-none text-xs font-bold" 
                />
                <button onClick={saveProfile} className="bg-emerald-500 text-white p-1.5 rounded-lg">
                  <Check className="w-3.5 h-3.5"/>
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-black text-slate-900 truncate">{profile.userName}</h2>
                  <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                    <Phone className="w-2.5 h-2.5"/> {profile.phone || "No phone"}
                  </p>
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

        {/* Dynamic KYC Box */}
        <div className={`rounded-2xl p-4 shadow-sm border mb-4 flex items-center justify-between transition-all ${
           profile.kycStatus === 'approved' ? 'bg-emerald-50 border-emerald-100' :
           profile.kycStatus === 'rejected' ? 'bg-red-50 border-red-100' :
           'bg-indigo-50 border-indigo-100'
        }`}>
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${profile.kycStatus === 'approved' ? 'bg-emerald-500 text-white' : 'bg-indigo-500 text-white'}`}>
                    <ShieldCheck className="w-5 h-5"/>
                </div>
                <div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">KYC Status</p>
                    <p className={`text-xs font-black ${
                        profile.kycStatus === 'approved' ? 'text-emerald-700' :
                        profile.kycStatus === 'rejected' ? 'text-red-600' : 'text-indigo-700'
                    }`}>
                        {profile.kycStatus === 'approved' ? 'Verified' : 
                         profile.kycStatus === 'rejected' ? 'Rejected' : 
                         profile.kycStatus === 'pending' ? 'Under Review' : 'Not Verified'}
                    </p>
                </div>
            </div>
            <button
                onClick={() => navigate("/kyc")}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border active:scale-95 transition ${
                    profile.kycStatus === 'approved' ? 'bg-white text-emerald-600 border-emerald-200' :
                    profile.kycStatus === 'rejected' ? 'bg-red-500 text-white border-red-500' :
                    'bg-indigo-600 text-white border-indigo-500'
                }`}
            >
                {profile.kycStatus === 'approved' ? 'View' :
                 profile.kycStatus === 'rejected' ? 'Retry KYC' : 'Complete Now'}
            </button>
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
