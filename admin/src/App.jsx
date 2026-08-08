import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./Pages/Login/Login";
import Layout from "./components/Layout/Layout";
import NoAccess from "./Pages/NoAccess/NoAccess";

import Dashboard from "./Pages/Dashboard/Dashboard";
import Withdraw from "./Pages/Withdraw/Withdeaw";
import Deposit from "./Pages/Deposite/Deposite";

const Users = lazy(() => import("./Pages/Users/Users"));
const Matches = lazy(() => import("./Pages/Matches/Matches"));
const Settings = lazy(() => import("./Pages/Settings/Settings"));
const PaymentControl = lazy(() => import("./Pages/PaymentControl/PaymentControl"));
const AdminControl = lazy(() => import("./Pages/AdminControl/AdminControl"));
const Kyc = lazy(() => import("./Pages/kyc/kyc"));
const DummyBattles = lazy(() => import("./Pages/DummyBattles/DummyBattles"));
const ClientTracking = lazy(() => import("./Pages/ClientTracking/ClientTracking"));

import { PATH_PERMISSION, isAdmin, firstAllowedPath } from "./permissions";

const Loader = () => null;

/**
 * Guards a route for both authentication and section permission.
 * - no token             -> /login
 * - admin                -> always allowed
 * - agent without the path's permission -> first allowed page (or /no-access)
 * - /dummy-battles etc.  -> admin only (PATH_PERMISSION value === null)
 */
const Guard = ({ path, children }) => {
  const token = localStorage.getItem("adminToken");
  if (!token) return <Navigate to="/login" />;

  // If the session object is missing (e.g. cleared storage but token present),
  // let Layout fetch /admin/me and re-render with fresh role+permissions.
  const user = JSON.parse(localStorage.getItem("adminUser") || "null");
  if (!user) {
    return (
      <Layout>
        <Suspense fallback={<Loader />}>{children}</Suspense>
      </Layout>
    );
  }

  const required = PATH_PERMISSION[path];
  if (required === null) {
    // Admin-only route
    if (!isAdmin(user)) return <Navigate to={firstAllowedPath(user)} />;
  } else if (required && !isAdmin(user)) {
    const perms = Array.isArray(user?.permissions) ? user.permissions : [];
    if (!perms.includes(required)) return <Navigate to={firstAllowedPath(user)} />;
  }

  return (
    <Layout>
      <Suspense fallback={<Loader />}>{children}</Suspense>
    </Layout>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/no-access" element={<NoAccess />} />

      <Route path="/dashboard" element={<Guard path="/dashboard"><Dashboard /></Guard>} />
      <Route path="/withdraw" element={<Guard path="/withdraw"><Withdraw /></Guard>} />
      <Route path="/deposit" element={<Guard path="/deposit"><Deposit /></Guard>} />

      <Route path="/users" element={<Guard path="/users"><Users /></Guard>} />
      <Route path="/matches" element={<Guard path="/matches"><Matches /></Guard>} />
      <Route path="/dummy-battles" element={<Guard path="/dummy-battles"><DummyBattles /></Guard>} />
      <Route path="/client-tracking" element={<Guard path="/client-tracking"><ClientTracking /></Guard>} />
      <Route path="/settings" element={<Guard path="/settings"><Settings /></Guard>} />
      <Route path="/payment" element={<Guard path="/payment"><PaymentControl /></Guard>} />
      <Route path="/admin-control" element={<Guard path="/admin-control"><AdminControl /></Guard>} />
      <Route path="/kyc" element={<Guard path="/kyc"><Kyc /></Guard>} />

      <Route path="*" element={<Navigate to={firstAllowedPath()} />} />
    </Routes>
  );
}

export default App;
