import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./Pages/Login/Login";
import Dashboard from "./Pages/Dashboard/Dashboard";
import Users from "./Pages/Users/Users";
import Withdraw from "./Pages/Withdraw/Withdeaw"; // ✅ FIXED
import Deposit from "./Pages/Deposite/Deposite";
import Matches from "./Pages/Matches/Matches";
import Settings from "./Pages/Settings/Settings";
import PaymentControl from "./Pages/PaymentControl/PaymentControl";
import AdminControl from "./Pages/AdminControl/AdminControl";
import Layout from "./components/Layout/Layout";
import Kyc from "./Pages/kyc/kyc";

// 🔐 Protected route
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <Routes>

      {/* PUBLIC */}
      <Route path="/login" element={<Login />} />

      {/* PROTECTED ROUTES */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Layout>
              <Users />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/withdraw"
        element={
          <ProtectedRoute>
            <Layout>
              <Withdraw />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/deposit"
        element={
          <ProtectedRoute>
            <Layout>
              <Deposit />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/matches"
        element={
          <ProtectedRoute>
            <Layout>
              <Matches />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment"
        element={
          <ProtectedRoute>
            <Layout>
              <PaymentControl />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin-control"
        element={
          <ProtectedRoute>
            <Layout>
              <AdminControl />
            </Layout>
          </ProtectedRoute>
        }
      />


      <Route
  path="/kyc"
  element={
    <ProtectedRoute>
      <Layout>
        <Kyc />
      </Layout>
    </ProtectedRoute>
  }
/>

      {/* DEFAULT REDIRECT */}
      <Route path="*" element={<Navigate to="/dashboard" />} />

    </Routes>
  );
}

export default App;