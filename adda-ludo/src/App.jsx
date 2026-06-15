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

export default function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#111827",
        color: "#fff",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <div>
        <h1 style={{ fontSize: "40px", marginBottom: "20px" }}>
          🚧 Website Under Maintenance
        </h1>

        <p style={{ fontSize: "22px", lineHeight: "1.8" }}>
          Server Issue 🛜 की वजह से हमारी वेबसाइट अगले
          <strong>  घंटे </strong>
          के लिए Maintenance पर रहेगी.
        </p>

        <p style={{ fontSize: "20px", marginTop: "15px" }}>
          👉 कृपया धैर्य रखें 🙏
        </p>

        <p style={{ fontSize: "20px" }}>
          आपका विश्वास और सहयोग हमारे लिए बहुत महत्वपूर्ण है।
        </p>

        <p
          style={{
            marginTop: "30px",
            fontSize: "24px",
            fontWeight: "bold",
          }}
        >
          धन्यवाद 🙏
        </p>

        <p style={{ marginTop: "10px", opacity: 0.8 }}>
          Team Adda Ludo
        </p>
      </div>
    </div>
  );
}







import React from "react";

export default function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#111827",
        color: "#fff",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <div>
        <h1 style={{ fontSize: "40px", marginBottom: "20px" }}>
          🚧 Website Under Maintenance
        </h1>

        <p style={{ fontSize: "22px", lineHeight: "1.8" }}>
          Server Issue 🛜 की वजह से हमारी वेबसाइट अगले
          <strong> 24 घंटे </strong>
          के लिए Maintenance पर रहेगी.
        </p>

        <p style={{ fontSize: "20px", marginTop: "15px" }}>
          👉 कृपया धैर्य रखें 🙏
        </p>

        <p style={{ fontSize: "20px" }}>
          आपका विश्वास और सहयोग हमारे लिए बहुत महत्वपूर्ण है।
        </p>

        <p
          style={{
            marginTop: "30px",
            fontSize: "24px",
            fontWeight: "bold",
          }}
        >
          धन्यवाद 🙏
        </p>

        <p style={{ marginTop: "10px", opacity: 0.8 }}>
          Team Adda Ludo
        </p>
      </div>
    </div>
  );
}
