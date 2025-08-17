import React, { useState, useEffect } from "react";
import { authService } from "../services/api";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    setIsLoggedIn(authService.isAuthenticated());
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await authService.login(email, password);
      setSuccess("Login successful!");
      setIsLoggedIn(true);
      // You can redirect or update your app state here
      console.log("Login response:", response);
    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred during login");
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setSuccess("Logged out successfully!");
      setIsLoggedIn(false);
      // Clear form fields
      setEmail("");
      setPassword("");
    } catch (err) {
      setError("Error during logout");
    }
  };

  if (isLoggedIn) {
    return (
      <div className="login-container">
        <h2>Welcome!</h2>
        <p>You are logged in.</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  return (
    <div className="login-container">
      <h2>Login</h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
