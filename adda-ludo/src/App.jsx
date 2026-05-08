import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import { socket } from "./socket";

import HeaderMain from "./components/HeaderMain";
import FooterNav from "./components/FooterNav";
import Withdraw from "./pages/Withdraw";
import Home from "./pages/Home";
import Battle from "./pages/Battle";
import RoomCode from "./pages/RoomCode";
import Wallet from "./pages/Wallet";
import Profile from "./pages/Profile";
import Refer from "./pages/Refer";
import Support from "./pages/Support";
import Lobby from "./pages/Lobby";
import Kyc from "./pages/Kyc";
import Login from "./pages/Login";
import Redeem from "./pages/Redeem";
import Game from "./pages/Game";
import History from "./pages/History";

import "./index.css";

function Layout({ children }) {
  return (
    <>
      <HeaderMain />
      {children}
      <FooterNav />
    </>
  );
}

function ProtectedRoute({ children, isAuthenticated }) {
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = !!user && !!localStorage.getItem("token");

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        setUser(JSON.parse(localStorage.getItem("user")) || null);
      } catch {
        setUser(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    socket.on("connect", () => {
      console.log("🔥 Connected:", socket.id);
    });

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      socket.off("connect");
    };
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));

    if (userData?.token) {
      localStorage.setItem("token", userData.token);
    }

    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            !isAuthenticated ? (
              <Login onLogin={handleLogin} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
  path="/withdraw"
  element={
    <ProtectedRoute isAuthenticated={isAuthenticated}>
      <Layout>
        <Withdraw />
      </Layout>
    </ProtectedRoute>
  }
/>

        <Route path="/" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Layout><Home /></Layout></ProtectedRoute>} />
        <Route path="/battle" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Layout><Battle /></Layout></ProtectedRoute>} />
        <Route path="/room-code/:battleId" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Layout><RoomCode /></Layout></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Layout><Wallet /></Layout></ProtectedRoute>} />
        <Route path="/redeem" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Layout><Redeem /></Layout></ProtectedRoute>} />
        <Route path="/refer" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Layout><Refer /></Layout></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Layout><Support /></Layout></ProtectedRoute>} />
        <Route path="/kyc" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Layout><Kyc /></Layout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Layout><Profile onLogout={handleLogout} /></Layout></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Layout><History /></Layout></ProtectedRoute>} />
        <Route path="/lobby" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Layout><Lobby /></Layout></ProtectedRoute>} />
        <Route path="/game/:roomId" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Layout><Game /></Layout></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;