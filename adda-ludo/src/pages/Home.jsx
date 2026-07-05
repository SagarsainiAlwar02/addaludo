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
      text: "👉25 लोगो को Refer करने पर ₹1100 बोनस💰Free ,
                  👉50 लोगो को Refer करने पर ₹2100 बोनस💰Free,
                      👉100 लोगो को Refer करने पर ₹5100 बोनस💰Free",
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
    <div className="page-container">
      {/* GENUINE DARK COLOR SLIDER */}
      <div className="relative overflow-hidden rounded-2xl p-6 mb-6 text-white shadow-xl bg-gradient-to-br from-[#111827] via-[#1f2937] to-[#030712] transition-all duration-700">
        <div className="absolute top-0 right-0 w-44 h-44 bg-blue-500 opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-44 h-44 bg-emerald-500 opacity-10 blur-3xl"></div>

        <div className="relative z-10 min-h-[215px] flex flex-col justify-between text-white">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs font-bold text-white tracking-wide mb-4">
              🎲 {current.tag}
            </div>

            <h2 className="text-3xl font-black leading-tight text-white">
              {current.title}
            </h2>

            <p className="text-white mt-2 text-sm font-medium">
              {current.subtitle}
            </p>

            <div className="mt-5 bg-white/10 border border-white/10 rounded-xl p-4 backdrop-blur text-white">
              <h3 className="text-xl font-bold text-white">
                {current.heading}
              </h3>

              <p className="text-sm text-white mt-1">
                {current.text}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center mt-5">
            <button
              onClick={() => navigate(current.route)}
              className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg active:scale-95 transition"
            >
              {current.button} →
            </button>

            <div className="flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    activeSlide === i
                      ? "w-7 bg-white"
                      : "w-2 bg-white/40"
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
    </div>
  );
}
