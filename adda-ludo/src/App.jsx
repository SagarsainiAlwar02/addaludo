  // import React, { useState, useEffect } from "react";
  // import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

  // import { socket } from "./socket";

  // import HeaderMain from "./components/HeaderMain";
  // import FooterNav from "./components/FooterNav";

  // import Home from "./pages/Home";
  // import Battle from "./pages/Battle";
  // import RoomCode from "./pages/RoomCode";
  // import Wallet from "./pages/Wallet";
  // import Withdraw from "./pages/Withdraw";
  // import Profile from "./pages/Profile";
  // import Refer from "./pages/Refer";
  // import Support from "./pages/Support";
  // import Lobby from "./pages/Lobby";
  // import Kyc from "./pages/Kyc";
  // import Login from "./pages/Login";
  // import Redeem from "./pages/Redeem";
  // import Game from "./pages/Game";
  // import History from "./pages/History";

  // import "./index.css";

  // function Layout({ children }) {
  //   return (
  //     <>
  //       <HeaderMain />
  //       {children}
  //       <FooterNav />
  //     </>
  //   );
  // }

  // function ProtectedRoute({ children, isAuthenticated }) {
  //   return isAuthenticated ? children : <Navigate to="/login" replace />;
  // }

  // function App() {
  //   const [user, setUser] = useState(() => {
  //     try {
  //       return JSON.parse(localStorage.getItem("user")) || null;
  //     } catch {
  //       return null;
  //     }
  //   });

  //   const isAuthenticated = !!user && !!localStorage.getItem("token");

  //   useEffect(() => {
  //     const handleStorageChange = () => {
  //       try {
  //         setUser(JSON.parse(localStorage.getItem("user")) || null);
  //       } catch {
  //         setUser(null);
  //       }
  //     };

  //     window.addEventListener("storage", handleStorageChange);

  //     socket.on("connect", () => {
  //       console.log("🔥 Connected:", socket.id);
  //     });

  //     return () => {
  //       window.removeEventListener("storage", handleStorageChange);
  //       socket.off("connect");
  //     };
  //   }, []);

  //   const handleLogin = (userData) => {
  //     localStorage.setItem("user", JSON.stringify(userData));

  //     if (userData?.token) {
  //       localStorage.setItem("token", userData.token);
  //     }

  //     setUser(userData);
  //   };

  //   const handleLogout = () => {
  //     localStorage.removeItem("user");
  //     localStorage.removeItem("token");
  //     setUser(null);
  //   };

  //   const protectedPage = (component) => (
  //     <ProtectedRoute isAuthenticated={isAuthenticated}>
  //       <Layout>{component}</Layout>
  //     </ProtectedRoute>
  //   );

  //   return (
  //     <Router>
  //       <Routes>
  //         <Route
  //           path="/login"
  //           element={
  //             !isAuthenticated ? (
  //               <Login onLogin={handleLogin} />
  //             ) : (
  //               <Navigate to="/" replace />
  //             )
  //           }
  //         />

  //         <Route path="/" element={protectedPage(<Home />)} />
  //         <Route path="/battle" element={protectedPage(<Battle />)} />
  //         <Route path="/room-code/:battleId" element={protectedPage(<RoomCode />)} />
  //         <Route path="/wallet" element={protectedPage(<Wallet />)} />

  //         {/* ✅ Winning coin withdraw page */}
  //         <Route path="/withdraw" element={protectedPage(<Withdraw />)} />

  //         {/* ✅ Referral earning redeem page */}
  //         <Route path="/redeem" element={protectedPage(<Redeem />)} />

  //         <Route path="/refer" element={protectedPage(<Refer />)} />
  //         <Route path="/support" element={protectedPage(<Support />)} />
  //         <Route path="/kyc" element={protectedPage(<Kyc />)} />
  //         <Route path="/profile" element={protectedPage(<Profile onLogout={handleLogout} />)} />
  //         <Route path="/history" element={protectedPage(<History />)} />
  //         <Route path="/lobby" element={protectedPage(<Lobby />)} />
  //         <Route path="/game/:roomId" element={protectedPage(<Game />)} />

  //         <Route path="*" element={<Navigate to="/" replace />} />
  //       </Routes>
  //     </Router>
  //   );
  // }

  // export default App;











  import React from "react";
import { BrowserRouter as Router } from "react-router-dom";

import "./index.css";

function App() {
  return (
    <Router>
      <div
        className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#000000]"
      >
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center shadow-2xl">
          
          <div className="text-6xl mb-5">🚧</div>

          <h1 className="text-3xl font-black text-white mb-3">
            Website Under Maintenance
          </h1>

          <p className="text-gray-300 text-base leading-7">
             New update ke karan website agle 2 ghante ke liye maintenance par hai.
          </p>

          <p className="text-gray-400 text-sm mt-4">
            Kripya thodi der baad dobara try karein.
          </p>

        </div>
      </div>
    </Router>
  );
}

export default App;