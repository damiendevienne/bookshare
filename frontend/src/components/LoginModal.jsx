import React, { useState } from "react";
import axios from "axios";

export default function LoginModal({ show, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [email, setEmail] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

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
            <h5 className="modal-title">{forgotMode ? "Forgot Password" : "Login"}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {error && <p className="text-danger">{error}</p>}
            {infoMessage && <p className="text-success">{infoMessage}</p>}

            {!forgotMode ? (
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
                <p className="mt-2 text-center">
                  <button
                    className="btn btn-link p-0"
                    onClick={() => setForgotMode(true)}
                  >
                    Forgot password?
                  </button>
                </p>
              </>
            ) : (
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
                  <button
                    className="btn btn-link p-0"
                    onClick={() => setForgotMode(false)}
                  >
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
