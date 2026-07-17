import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      title: "Welcome to Adda Ludo",
      subtitle: "Play game and earn money",
      heading: "24×7 Support",
      text: "Fast withdrawal • Safe play",
      button: "Play Now",
      route: "/battle",
      tag: "LIVE GAMING PLATFORM",
    },
    {
      title: "Welcome",
      subtitle: "Hot games • Instant wins",
      heading: "Refer & Earn",
      text: "25 Refer= ₹1100, 50 Refer= ₹2100, 100 Refer= ₹5100💰",
      button: "Refer Now",
      route: "/refer",
      tag: "REFER BONUS",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 2000);

    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    setLoading(true);

    setTimeout(() => {
      setGames([
        {
          id: 1,
          title: "Ludo Battle",
          image: "/game1.jpeg",
          status: "live",
          route: "/battle",
        },
        {
          id: 2,
          title: "Snake Game",
          image: "/game2.jpeg",
          status: "soon",
          route: null,
        },
      ]);

      setLoading(false);
    }, 500);
  }, []);

  const handleGameClick = (game) => {
    if (game.route) navigate(game.route);
  };

  const current = slides[activeSlide];

  return (
    <div className="page-container pt-1 relative min-h-screen pb-20">
      {/* ULTRA COMPACT CURVED SLIDER */}
      <div className="relative overflow-hidden rounded-2xl p-3 mb-2 text-white shadow-md bg-gradient-to-br from-[#111827] via-[#1f2937] to-[#030712] transition-all duration-700">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500 opacity-10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500 opacity-10 blur-2xl"></div>

        <div className="relative z-10 flex flex-col justify-between text-white">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-2 py-0.5 text-[10px] font-bold text-white tracking-wide mb-1.5">
              🎲 {current.tag}
            </div>

            <h2 className="text-xl font-black leading-tight text-white">
              {current.title}
            </h2>

            <p className="text-white mt-0.5 text-[11px] font-medium opacity-90">
              {current.subtitle}
            </p>

            {/* INNER BOX WITH CURVED SHAPE */}
            <div className="mt-2 bg-white/5 border border-white/10 rounded-xl p-2 backdrop-blur text-white">
              <h3 className="text-sm font-bold text-white leading-none">
                {current.heading}
              </h3>

              <p className="text-[11px] text-white mt-0.5 opacity-90 leading-tight">
                {current.text}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center mt-3">
            <button
              onClick={() => navigate(current.route)}
              className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-md active:scale-95 transition"
            >
              {current.button} →
            </button>

            <div className="flex gap-1">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    activeSlide === i
                      ? "w-4 bg-white"
                      : "w-1 bg-white/40"
                  }`}
                ></button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* HEADER */}
      <div className="section-header mb-2 mt-1">
        <h2 className="text-lg font-bold">All Games</h2>

        <button className="btn-rules py-1 px-2.5 text-xs">
          Rules{" "}
          <i
            className="fa-solid fa-arrow-right-long"
            style={{ marginLeft: "4px" }}
          ></i>
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-center p-3 text-gray-500 font-semibold text-sm">
          Loading games...
        </div>
      )}

      {/* GAME GRID */}
      <div className="game-grid">
        {!loading &&
          games.map((game) => (
            <div
              key={game.id}
              className="game-card"
              onClick={() => handleGameClick(game)}
              style={{ cursor: game.route ? "pointer" : "default" }}
            >
              {game.status === "live" && (
                <span className="game-badge badge-live">Live</span>
              )}

              {game.status === "soon" && (
                <span className="game-badge badge-soon">Coming Soon</span>
              )}

              <img
                src={game.image}
                alt={game.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
      </div>

      {/* NEWLY DESIGNED PREMIUM WHATSAPP SUPPORT BUTTON */}
      <div 
        onClick={() => navigate("/support")}
        className="fixed bottom-24 right-5 z-50 flex flex-col items-center group cursor-pointer"
      >
        {/* Glowing Background Effect */}
        <div className="absolute inset-0 bg-[#25D366] rounded-full blur-md opacity-40 animate-pulse group-hover:opacity-60 transition-opacity"></div>
        
        {/* Main Icon Button */}
        <div className="relative bg-gradient-to-b from-[#25D366] to-[#128C7E] p-3 rounded-full shadow-[0_4px_15px_rgba(37,211,102,0.4)] flex items-center justify-center transform active:scale-90 group-hover:-translate-y-1 transition-all duration-350 border border-white/20">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className="w-7 h-7 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
          >
            <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.333 4.993L2 22l5.233-1.373a9.946 9.946 0 004.773 1.218c5.508 0 9.99-4.478 9.994-9.986A9.998 9.998 0 0012.012 2zm4.7 13.913c-.26.732-1.29 1.41-2.079 1.48-.593.054-1.37.087-2.185-.173A10.232 10.232 0 018.6 14.54a9.016 9.016 0 01-2.454-4.2c-.227-.775-.25-1.503.013-2.193.303-.79.79-1.077 1.076-1.37.13-.133.26-.2.39-.2.134 0 .262.007.363.023.11.016.257.043.376.326.136.325.467 1.14.508 1.222.04.085.068.183.012.296-.057.113-.085.183-.17.283-.084.1-.176.223-.254.3-.087.086-.178.18-.077.355.1.173.447.738.96 1.196.66.587 1.213.77 1.387.857.174.086.275.072.376-.043.1-.117.433-.505.548-.68.114-.173.23-.142.39-.083.16.057 1.01.477 1.183.564.174.086.29.13.333.203.043.073.043.423-.12.89z" />
          </svg>
        </div>

        {/* Clean Text Label */}
        <span className="relative text-[10px] font-bold text-white bg-slate-900/90 tracking-wide uppercase px-2 py-0.5 rounded-md shadow-sm mt-1.5 border border-white/10 font-sans backdrop-blur-sm">
          Support
        </span>
      </div>
    </div>
  );
}
