import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";  // 👈 ye import hona chahiye

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>   {/* 👈 YE SABSE IMPORTANT HAI */}
    <App />
  </BrowserRouter>
);