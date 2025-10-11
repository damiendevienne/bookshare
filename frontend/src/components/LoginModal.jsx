import React, { useState } from "react";
import axios from "axios";

export default function LoginModal({ show, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [mode, setMode] = useState("login"); // "login" | "forgot" | "register"

  if (!show) return null;

  const handleLogin = async () => {
    setError("");
    try {
      const res = await axios.post("http://localhost:1337/api/auth/local", {
        identifier: username,
        password,
      });

      const jwt = res.data.jwt;
      const user = res.data.user;

      localStorage.setItem("jwt", jwt);
      localStorage.setItem("user", JSON.stringify(user));

      onLoginSuccess(user, jwt);
      onClose();
    } catch (err) {
      if (err.response?.status === 400) {
        setError("Incorrect username or password.");
      } else {
        setError("Unexpected error occurred.");
        console.error("Login error:", err);
      }
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setInfoMessage("");
    try {
      await axios.post("http://localhost:1337/api/auth/forgot-password", { email });
      setInfoMessage("If this email exists, a reset link has been sent.");
    } catch (err) {
      setError("Error sending reset email.");
      console.error("Forgot password error:", err);
    }
  };

  const handleRegister = async () => {
    setError("");
    setInfoMessage("");
    try {
      const res = await axios.post("http://localhost:1337/api/auth/local/register", {
        username,
        email,
        password,
      });

      const jwt = res.data.jwt;
      const user = res.data.user;

      localStorage.setItem("jwt", jwt);
      localStorage.setItem("user", JSON.stringify(user));

      onLoginSuccess(user, jwt);
      onClose();
    } catch (err) {
      const message = err.response?.data?.error?.message || "";
      console.log("Register error message BLAVLAVLA:", message);
      if (err.response?.status === 400) {
        setError("Invalid or already used credentials.");
      } else {
        setError("Unexpected error occurred.");
        console.error("Register error:", err);
      }
    }
  };

  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
      tabIndex="-1"
      onClick={onClose}
    >
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {mode === "login"
                ? "Login"
                : mode === "forgot"
                ? "Forgot Password"
                : "Create Account"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            {error && <p className="text-danger">{error}</p>}
            {infoMessage && <p className="text-success">{infoMessage}</p>}

            {/* === LOGIN MODE === */}
            {mode === "login" && (
              <>
                <div className="mb-3">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button className="btn btn-primary w-100" onClick={handleLogin}>
                  Login
                </button>

                <p className="mt-3 text-center">
                  <button
                    className="btn btn-link p-0"
                    onClick={() => setMode("forgot")}
                  >
                    Forgot password?
                  </button>
                </p>

                <p className="mt-1 text-center">
                  <small>
                    No account yet?{" "}
                    <button
                      className="btn btn-link p-0"
                      onClick={() => setMode("register")}
                    >
                      Create one
                    </button>
                  </small>
                </p>
              </>
            )}

            {/* === FORGOT PASSWORD MODE === */}
            {mode === "forgot" && (
              <>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button className="btn btn-primary w-100" onClick={handleForgotPassword}>
                  Send reset link
                </button>
                <p className="mt-2 text-center">
                  <button className="btn btn-link p-0" onClick={() => setMode("login")}>
                    Back to login
                  </button>
                </p>
              </>
            )}

            {/* === REGISTER MODE === */}
            {mode === "register" && (
              <>
                <div className="mb-3">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button className="btn btn-primary w-100" onClick={handleRegister}>
                  Register
                </button>

                <p className="mt-2 text-center">
                  <button className="btn btn-link p-0" onClick={() => setMode("login")}>
                    Back to login
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
