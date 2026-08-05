import { useState } from "react";
import API, { getError } from "../../api";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("admin@addaludo.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      alert("Email aur password dono bharna zaroori hai");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post("/auth/admin/login", {
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      const data = res.data?.data || res.data;
      const token = data?.token;
      const admin = data?.admin || data?.user || data;

      if (!token) {
        alert("Token nahi mila");
        return;
      }

      localStorage.setItem("adminToken", token);
      localStorage.setItem("adminUser", JSON.stringify(admin));

      // REDIRECT
      window.location.href = "/dashboard";
    } catch (err) {
      console.log(
        "LOGIN ERROR:",
        err.response?.data || err.message
      );

      alert(getError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Admin Login</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Checking..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;
