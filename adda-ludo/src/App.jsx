import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

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
import Kyc from "./pages/Kyc";
import Login from "./pages/Login";
import Redeem from "./pages/Redeem";
import History from "./pages/History";

import "./index.css";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

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

function AppStatusScreen({ title, message, showRetry = false, onRetry }) {
  return (
    // <div className="min-h-screen bg-[#f4f6f8] px-4 py-10">
    //   <main className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-[600px] items-center justify-center">
    //     <section className="w-full rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
    //       <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-50 text-2xl text-cyan-600">
    //         <i className="fa-solid fa-screwdriver-wrench"></i>
    //       </div>
    //       <h1 className="mb-2 text-3xl font-extrabold text-slate-900">
    //         {title}
    //       </h1>
    //       <p className="mx-auto max-w-[420px] text-sm leading-6 text-slate-600">
    //         {message}
    //       </p>
    //       {showRetry && (
    //         <button
    //           type="button"
    //           onClick={onRetry}
    //           className="mt-6 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm active:scale-95"
    //         >
    //           Check Again
    //         </button>
    //       )}
    //     </section>
    //   </main>
    // </div>
    <div>

    </div>
  );
}

function MaintenancePage() {
  return (
    <>
      <style>
        {`
            .maintenance-page {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 24px;
              background: #f4f6f8;
              color: #1e2022;
            }

            .maintenance-panel {
              width: 100%;
              max-width: 560px;
              padding: 32px 24px;
              text-align: center;
              background: #ffffff;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
            }

            .maintenance-label {
              margin-bottom: 10px;
              color: #06b6d4;
              font-size: 0.78rem;
              font-weight: 800;
              letter-spacing: 0;
              text-transform: uppercase;
            }

            .maintenance-panel h1 {
              margin-bottom: 18px;
              color: #111827;
              font-size: 2rem;
              line-height: 1.15;
              letter-spacing: 0;
            }

            .maintenance-message {
              margin-top: 16px;
              color: #4b5563;
              font-size: 1rem;
              line-height: 1.7;
            }

            .maintenance-message p {
              margin: 0;
            }

            .maintenance-message-hindi {
              margin-top: 22px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #1f2937;
              font-weight: 600;
            }

            @media (max-width: 420px) {
              .maintenance-panel {
                padding: 28px 18px;
              }

              .maintenance-panel h1 {
                font-size: 1.65rem;
              }

              .maintenance-message {
                font-size: 0.95rem;
              }
            }
          `}
      </style>
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
    </>
  );
}

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });
  const [maintenanceState, setMaintenanceState] = useState({
    loading: true,
    enabled: false,
  });

  const isAuthenticated = !!user && !!localStorage.getItem("token");

  const checkMaintenanceMode = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/maintenance`, {
        cache: "no-store",
      });
      const data = await response.json();

      // wait 3 seconds for testing purposes
      
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setMaintenanceState({
        loading: false,
        enabled: data?.maintenanceMode === true,
        enabled: data?.maintenanceMode === true,
      });
    } catch (err) {
      console.log("Maintenance check failed:", err);
      setMaintenanceState({
        loading: false,
        enabled: false,
      });
    }
  }, []);

  useEffect(() => {
    checkMaintenanceMode();
  }, [checkMaintenanceMode]);

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        setUser(JSON.parse(localStorage.getItem("user")) || null);
      } catch {
        setUser(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
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

  if (maintenanceState.loading) {
    return (
      // <AppStatusScreen
      //   title="Checking Status"
      //   message="Please wait while we confirm the latest service status."
      // />
      <AppStatusScreen />
    );
  }

  if (maintenanceState.enabled) {
    return <MaintenancePage />;
  }

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

        {/* ✅ Winning coin withdraw page */}
        <Route path="/withdraw" element={protectedPage(<Withdraw />)} />

        {/* ✅ Referral earning redeem page */}
        <Route path="/redeem" element={protectedPage(<Redeem />)} />

        <Route path="/refer" element={protectedPage(<Refer />)} />
        <Route path="/support" element={protectedPage(<Support />)} />
        <Route path="/kyc" element={protectedPage(<Kyc />)} />
        <Route path="/profile" element={protectedPage(<Profile onLogout={handleLogout} />)} />
        <Route path="/history" element={protectedPage(<History />)} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

