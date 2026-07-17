import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState([]);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setGames([
        { id: 1, title: "Ludo Battle", image: "/game1.jpeg", status: "live", route: "/battle" },
        { id: 2, title: "Snake Game", image: "/game2.jpeg", status: "soon", route: null },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="page-container min-h-screen pb-20 bg-gray-50">
      
      {/* Main Content Area */}
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">All Games</h2>
        
        {/* Game Grid */}
        <div className="game-grid grid grid-cols-2 gap-4">
          {!loading && games.map((game) => (
            <div key={game.id} className="game-card bg-gray-200 h-32 rounded-lg overflow-hidden">
               <img src={game.image} alt={game.title} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {/* WHATSAPP BUTTON - SNAKE GAME KE JUST NICHE */}
        <div className="mt-6 flex justify-center">
          <button 
            onClick={() => navigate("/support")}
            className="flex items-center gap-3 bg-[#25D366] text-white px-6 py-3 rounded-full shadow-lg font-bold hover:bg-[#128C7E] transition-all"
          >
            <i className="fa-brands fa-whatsapp text-2xl"></i>
            <span>Chat with Support</span>
          </button>
        </div>
      </div>

      {/* KHELSTAR STYLE BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#1a202c] shadow-[0_-4px_10px_rgba(0,0,0,0.3)] flex justify-around items-center z-50">
        <button onClick={() => navigate("/")} className={isActive("/") ? "text-blue-400" : "text-gray-400"}>
          <i className="fa-solid fa-house text-xl"></i>
        </button>
        <button onClick={() => navigate("/wallet")} className={isActive("/wallet") ? "text-blue-400" : "text-gray-400"}>
          <i className="fa-solid fa-wallet text-xl"></i>
        </button>
        <button onClick={() => navigate("/refer")} className={isActive("/refer") ? "text-blue-400" : "text-gray-400"}>
          <i className="fa-solid fa-users text-xl"></i>
        </button>
        <button onClick={() => navigate("/support")} className={isActive("/support") ? "text-blue-400" : "text-gray-400"}>
          <i className="fa-solid fa-comment-dots text-xl"></i>
        </button>
        <button onClick={() => navigate("/profile")} className={isActive("/profile") ? "text-blue-400" : "text-gray-400"}>
          <i className="fa-solid fa-user text-xl"></i>
        </button>
      </div>
    </div>
  );
}
