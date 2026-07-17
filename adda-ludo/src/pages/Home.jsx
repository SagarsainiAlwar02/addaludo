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
    <div className="page-container pt-1">
      {/* ULTRA COMPACT CURVED SLIDER - Size reduced significantly */}
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

            {/* INNER BOX WITH CURVED SHAPE & MINIMAL SIZE */}
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

      {/* HEADER - Shifted closer to the slider */}
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

      {/* GAME GRID - Now sits higher up the page */}
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
    </div>
  );
}
