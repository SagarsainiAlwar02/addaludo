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
    if (status === "approved") return "text-green-500";
    if (status === "pending") return "text-orange-500";
    if (status === "rejected") return "text-red-500";
    return "text-gray-500";
  };

  const getKycButtonText = (status) => {
    if (status === "approved") return "Approved";
    if (status === "pending") return "Under Review";
    if (status === "rejected") return "Submit Again";
    return "Complete KYC";
  };

  const getKycButtonClass = (status) => {
    if (status === "approved") return "bg-green-600";
    if (status === "pending") return "bg-orange-500";
    if (status === "rejected") return "bg-red-600";
    return "bg-black";
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
    { title: "History", icon: "↶", path: "/history" },
    { title: "My Wallet", icon: "▣", path: "/wallet" },
    { title: "Refer & Earn", icon: "🎁", path: "/refer" },
    { title: "Support", icon: "☏", path: "/support" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f3f4f6] via-[#e5e7eb] to-[#d1d5db] px-4 pb-28 pt-4">
      <div className="mx-auto max-w-[780px]">
        <div className="flex items-center gap-5 rounded-2xl bg-white shadow-md p-7 border border-gray-200">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.userName}`}
            alt="avatar"
            className="h-24 w-24 rounded-full border-4 border-slate-200"
          />

          <div className="flex-1">
            {isEditing ? (
              <div className="flex gap-3">
                <input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full rounded-lg border px-4 py-3 text-xl outline-none"
                />

                <button
                  onClick={saveProfile}
                  className="rounded-lg bg-green-500 px-5 text-white"
                >
                  ✔
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {profile.userName}
                  </h2>
                  <p className="mt-1 text-lg text-gray-500">{profile.phone}</p>
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-2xl"
                >
                  ✏️
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-5">
          <div className="rounded-2xl bg-white shadow-md p-6 text-center">
            <h4 className="text-lg text-gray-500">Total Won</h4>
            <h2 className="mt-2 text-3xl font-bold text-green-600">
              ₹ {formatAmount(profile.totalWon)}
            </h2>
          </div>

          <div className="rounded-2xl bg-white shadow-md p-6 text-center">
            <h4 className="text-lg text-gray-500">Matches</h4>
            <h2 className="mt-2 text-3xl font-bold text-blue-600">
              {profile.matches}
            </h2>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-2xl bg-white shadow-md p-6">
          <div>
            <h4 className="text-xl font-semibold text-gray-700">KYC Status</h4>
            <p
              className={`mt-2 text-lg font-medium ${getKycTextColor(
                profile.kycStatus
              )}`}
            >
              {getKycLabel(profile.kycStatus)}
            </p>
          </div>

          <button
            onClick={handleKycClick}
            className={`rounded-lg px-5 py-2 text-white ${getKycButtonClass(
              profile.kycStatus
            )}`}
          >
            {getKycButtonText(profile.kycStatus)}
          </button>
        </div>

        <div className="mt-6 rounded-2xl bg-white shadow-md px-6 py-3">
          {menuItems.map((item) => (
            <div
              key={item.title}
              onClick={() => navigate(item.path)}
              className="flex cursor-pointer items-center gap-5 border-b border-gray-200 py-5 last:border-none"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
                {item.icon}
              </div>

              <span className="flex-1 text-xl font-medium text-gray-800">
                {item.title}
              </span>

              <span className="text-4xl text-gray-400">›</span>
            </div>
          ))}

          <div onClick={handleLogout} className="flex cursor-pointer items-center gap-5 py-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-500">
              ⇱
            </div>

            <span className="flex-1 text-xl font-medium text-red-500">
              Logout
            </span>

            <span className="text-4xl text-gray-400">›</span>
          </div>
        </div>
      </div>
    </div>
  );
}