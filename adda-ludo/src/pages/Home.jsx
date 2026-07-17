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
      text: "Fast withdrawal • Safe play • Instant matches",
      button: "Play Now",
      route: "/battle",
      tag: "LIVE GAMING PLATFORM",
    },
    {
      title: "Welcome",
      subtitle: "Hot games • Instant wins • Safe play",
      heading: "Refer & Earn",
      text: "25 लोगो को Refer= ₹1100 बोनस💰,50 लोगो को Refer= ₹2100 बोनस💰,  100 लोगो को Refer= ₹5100 बोनस💰",
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
        {
          id: 3,
          title: "Support",
          image: "/wpsupport.jpeg",
          status: "online",
          route: "/support",
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
    <div className="page-container pb-10">
      {/* GENUINE DARK COLOR SLIDER - NOW COMPACT & SHARP RECTANGLE */}
      <div className="relative overflow-hidden rounded-none p-4 mb-5 text-white shadow-xl bg-gradient-to-br from-[#111827] via-[#1f2937] to-[#030712] transition-all duration-700">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500 opacity-10 blur-3xl"></div>

        <div className="relative z-10 flex flex-col justify-between text-white">
          <div>
            <div className="inline-flex items-center gap-2 rounded-none bg-white/10 border border-white/10 px-2.5 py-0.5 text-[11px] font-bold text-white tracking-wide mb-3">
              🎲 {current.tag}
            </div>

            <h2 className="text-2xl font-black leading-tight text-white">
              {current.title}
            </h2>

            <p className="text-white mt-1 text-xs font-medium opacity-90">
              {current.subtitle}
            </p>

            {/* INNER CONTENT BOX - RECTANGLE */}
            <div className="mt-3 bg-white/5 border border-white/10 rounded-none p-3 backdrop-blur text-white">
              <h3 className="text-base font-bold text-white">
                {current.heading}
              </h3>

              <p className="text-xs text-white mt-0.5 opacity-90">
                {current.text}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => navigate(current.route)}
              className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-4 py-2 rounded-none text-xs font-bold shadow-lg active:scale-95 transition"
            >
              {current.button} →
            </button>

            <div className="flex gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`h-1.5 transition-all duration-300 ${
                    activeSlide === i
                      ? "w-6 bg-white"
                      : "w-1.5 bg-white/40"
                  }`}
                ></button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* HEADER */}
      <div className="section-header">
        <h2>All Games</h2>

        <button className="btn-rules">
          Rules{" "}
          <i
            className="fa-solid fa-arrow-right-long"
            style={{ marginLeft: "4px" }}
          ></i>
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-center p-5 text-gray-500 font-semibold">
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

              {game.status === "online" && (
                <span className="game-badge" style={{ color: "#16a34a" }}>
                  Online
                </span>
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

      {/* WHATSAPP SUPPORT ICON - FIXED JUST BELOW SNAKE & LUDO GAMES IN THE FLOW */}
      <div className="mt-6 flex justify-center">
        <div 
          onClick={() => navigate("/support")}
          className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
        >
          {/* Embedded SVG WhatsApp Button - 100% reliable layout */}
          <div className="w-12 h-12 bg-[#25D366] rounded-full shadow-md flex items-center justify-center border border-white">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 448 512" 
              className="w-7 h-7 text-white"
              fill="currentColor"
            >
              <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.3-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
            </svg>
          </div>
          <span className="text-[10px] font-bold text-gray-700 bg-gray-200/80 px-2 py-0.5 rounded shadow-sm mt-1 uppercase tracking-wider font-sans">
            Support
          </span>
        </div>
      </div>

    </div>
  );
}
