import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./Pages/Login/Login";
import Layout from "./components/Layout/Layout";

import Dashboard from "./Pages/Dashboard/Dashboard";
import Withdraw from "./Pages/Withdraw/Withdeaw";
import Deposit from "./Pages/Deposite/Deposite";

const Users = lazy(() => import("./Pages/Users/Users"));
const Matches = lazy(() => import("./Pages/Matches/Matches"));
const Settings = lazy(() => import("./Pages/Settings/Settings"));
const PaymentControl = lazy(() => import("./Pages/PaymentControl/PaymentControl"));
const AdminControl = lazy(() => import("./Pages/AdminControl/AdminControl"));
const Kyc = lazy(() => import("./Pages/kyc/kyc"));

const Loader = () => null;

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("adminToken");
  if (!token) return <Navigate to="/login" />;
  return children;
};

const ProtectedLayout = ({ children }) => (
  <ProtectedRoute>
    <Layout>
      <Suspense fallback={<Loader />}>{children}</Suspense>
    </Layout>
  </ProtectedRoute>
);

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/withdraw" element={<ProtectedLayout><Withdraw /></ProtectedLayout>} />
      <Route path="/deposit" element={<ProtectedLayout><Deposit /></ProtectedLayout>} />

      <Route path="/users" element={<ProtectedLayout><Users /></ProtectedLayout>} />
      <Route path="/matches" element={<ProtectedLayout><Matches /></ProtectedLayout>} />
      <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
      <Route path="/payment" element={<ProtectedLayout><PaymentControl /></ProtectedLayout>} />
      <Route path="/admin-control" element={<ProtectedLayout><AdminControl /></ProtectedLayout>} />
      <Route path="/kyc" element={<ProtectedLayout><Kyc /></ProtectedLayout>} />

      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;