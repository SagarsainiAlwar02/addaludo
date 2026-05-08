import { useState } from "react";
import API from "../../api";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("Adda48931@gmail.com");
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

      const res = await API.post("/admin-auth/login", {
        email: email.trim(),
        password: password.trim(),
      });

      if (!res.data?.token) {
        alert("Token nahi mila. Backend response check karo.");
        return;
      }

      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("adminUser", JSON.stringify(res.data.admin));

      window.location.href = "/dashboard";
    } catch (err) {
      console.log("LOGIN ERROR:", err.response?.data || err.message);

      alert(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          "Login failed - backend/API URL check karo"
      );
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