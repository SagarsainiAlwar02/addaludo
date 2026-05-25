import React from "react";
import "./index.css";

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#000000]">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center shadow-2xl">
        <div className="text-6xl mb-5">🚧</div>
        <h1 className="text-3xl font-black text-white mb-3">
          Website Under Maintenance
        </h1>
        <p className="text-gray-300 text-base leading-7">
          Server problem ki wajah se website temporary maintenance par hai.
        </p>
        <p className="text-gray-400 text-sm mt-4">
          Kripya thodi der baad dobara try karein.
        </p>
      </div>
    </div>
  );
}

export default App;
