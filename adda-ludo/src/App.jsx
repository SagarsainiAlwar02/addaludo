import "./App.css";

function MaintenancePage() {
  return (
    <main className="maintenance-page">
      <section className="maintenance-panel" aria-labelledby="maintenance-title">
        <p className="maintenance-label">Temporary Notice</p>
        <h1 id="maintenance-title">Site Under Maintenance</h1>

        <div className="maintenance-message">
          <p>The site menu is currently being updated.</p>
          <p>Everything should be working again in 3-4 hours.</p>
        </div>

        <div className="maintenance-message maintenance-message-hindi" lang="hi">
          <p>साइट पर अभी मेनू अपडेट किया जा रहा है।</p>
          <p>यह 3-4 घंटे में ठीक हो जाएगा।</p>
        </div>
      </section>
    </main>
  );
}

function App() {
  return <MaintenancePage />;
}

export default App;

/*
  Frontend routes are temporarily commented out while the maintenance page is active.

  import React, { useState, useEffect } from "react";
  import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

  import { socket } from "./socket";

  import HeaderMain from "./components/HeaderMain";
  import FooterNav from "./components/FooterNav";

  import Home from "./pages/Home";
  import Battle from "./pages/Battle";
  import RoomCode from "./pages/RoomCode";
  import Wallet from "./pages/Wallet";
  import Withdraw from "./pages/Withdraw";
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
*/
