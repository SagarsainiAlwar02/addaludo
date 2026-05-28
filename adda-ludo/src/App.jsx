import React, { useState, useEffect, Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import { socket } from "./socket";

import HeaderMain from "./components/HeaderMain";
import FooterNav from "./components/FooterNav";

import Home from "./pages/Home";
import Login from "./pages/Login";

import "./index.css";

const Battle = lazy(() => import("./pages/Battle"));
const RoomCode = lazy(() => import("./pages/RoomCode"));
const Wallet = lazy(() => import("./pages/Wallet"));
const Withdraw = lazy(() => import("./pages/Withdraw"));
const Profile = lazy(() => import("./pages/Profile"));
const Refer = lazy(() => import("./pages/Refer"));
const Support = lazy(() => import("./pages/Support"));
const Lobby = lazy(() => import("./pages/Lobby"));
const Kyc = lazy(() => import("./pages/Kyc"));
const Redeem = lazy(() => import("./pages/Redeem"));
const Game = lazy(() => import("./pages/Game"));
const History = lazy(() => import("./pages/History"));

function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      Loading...
    </div>
  );
}

function Layout({ children }) {
  return (
    <>
      <HeaderMain />
      <Suspense fallback={<Loader />}>{children}</Suspense>
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

  const protectedPage = (component) => (
    <ProtectedRoute isAuthenticated={isAuthenticated}>
      <Layout>{component}</Layout>
    </ProtectedRoute>
  );

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

        <Route path="/" element={protectedPage(<Home />)} />
        <Route path="/battle" element={protectedPage(<Battle />)} />
        <Route path="/room-code/:battleId" element={protectedPage(<RoomCode />)} />
        <Route path="/wallet" element={protectedPage(<Wallet />)} />
        <Route path="/withdraw" element={protectedPage(<Withdraw />)} />
        <Route path="/redeem" element={protectedPage(<Redeem />)} />
        <Route path="/refer" element={protectedPage(<Refer />)} />
        <Route path="/support" element={protectedPage(<Support />)} />
        <Route path="/kyc" element={protectedPage(<Kyc />)} />
        <Route path="/profile" element={protectedPage(<Profile onLogout={handleLogout} />)} />
        <Route path="/history" element={protectedPage(<History />)} />
        <Route path="/lobby" element={protectedPage(<Lobby />)} />
        <Route path="/game/:roomId" element={protectedPage(<Game />)} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;