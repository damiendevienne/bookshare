import React, { useState } from "react";
import api from "../api";
import { Eye, EyeOff } from "lucide-react";
import { communityCharterIntro, communityCharterPoints, communityCharterClosing } from "../constants/communityCharter";

export default function LoginModal({ show, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [charterAccepted, setCharterAccepted] = useState(false);
  const [showCharter, setShowCharter] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState("login"); // "login" | "forgot" | "register"

  if (!show) return null;

  const handleLogin = async () => {
    setError("");
    try {
      const res = await api.post("/api/auth/local", {
        identifier: username,
        password,
      });

      const jwt = res.data.jwt;
      const user = res.data.user;

      sessionStorage.setItem("jwt", jwt);
      sessionStorage.setItem("user", JSON.stringify(user));

      onLoginSuccess(user, jwt);
      onClose();
    } catch (err) {
      if (err.response?.status === 400) {
        const message = err.response?.data?.error?.message || "";
        setError(message.toLowerCase().includes("confirmed") ? "Please confirm your email address before logging in." : "Incorrect username or password.");
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
      await api.post("/api/auth/forgot-password", { email });
      setInfoMessage("If this email exists, a reset link has been sent.");
    } catch (err) {
      setError("Error sending reset email.");
      console.error("Forgot password error:", err);
    }
  };

  const handleRegister = async () => {
    setError("");
    setInfoMessage("");
    if (!charterAccepted) {
      setError("Please accept the Community Charter to create an account.");
      return;
    }
    if (!passwordValid) {
      setError("Password must be at least 8 characters and include at least one letter and one number.");
      return;
    }
    try {
      const res = await api.post("/api/auth/local/register", {
        username,
        email,
        password,
        communityCharterAccepted: true,
      });

      // With email confirmation enabled Strapi deliberately returns no JWT.
      // Do not sign the new account in until its email address is verified.
      if (!res.data.jwt) {
        setInfoMessage("Your account was created. Check your email to confirm your address before logging in.");
        setMode("login");
        setPassword("");
        return;
      }
      const jwt = res.data.jwt;
      const user = res.data.user;
      sessionStorage.setItem("jwt", jwt);
      sessionStorage.setItem("user", JSON.stringify(user));
      onLoginSuccess(user, jwt);
      onClose();
    } catch (err) {
      if (err.response?.status === 400) {
        setError("Invalid or already used credentials.");
      } else {
        setError("Unexpected error occurred.");
        console.error("Register error:", err);
      }
    }
  };

  const passwordValid = password.length >= 8 && password.length <= 72
    && /[A-Za-z]/.test(password) && /\d/.test(password);

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
                ? "Login to BookMyBook"
                : mode === "forgot"
                ? "Forgot Password"
                : "Create your BookMyBook account"}
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
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="mb-3 password-field">
                  <label className="form-label">Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" className="password-visibility-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}><span className="visually-hidden">{showPassword ? "Hide password" : "Show password"}</span>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
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
                <div className="mb-3 password-field">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    autoComplete="email"
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
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="mb-3 password-field">
                  <label className="form-label">Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" className="password-visibility-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}><span className="visually-hidden">{showPassword ? "Hide password" : "Show password"}</span>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                  <small className={`form-text ${passwordValid ? "text-success" : password ? "text-danger" : ""}`}>At least 8 characters, with letters &amp; numbers.</small>
                </div>

                <div className="form-check mb-3">
                  <input
                    id="community-charter-accepted"
                    className="form-check-input"
                    type="checkbox"
                    checked={charterAccepted}
                    onChange={(e) => setCharterAccepted(e.target.checked)}
                  />
                  <label className="form-check-label small" htmlFor="community-charter-accepted">I have read and agree to the</label>{" "}
                  <button
                    type="button"
                    className="btn btn-link p-0 align-baseline small"
                    aria-expanded={showCharter}
                    onClick={() => setShowCharter((current) => !current)}
                  >
                    Community Charter
                  </button>.
                  <div className="form-text">This agreement is required to create an account.</div>
                  {showCharter && (
                    <div className="community-charter-preview mt-2 p-3 rounded" role="region" aria-label="Community Charter">
                      <p className="small mb-2">{communityCharterIntro}</p>
                      <ul className="small mb-0 ps-3">{communityCharterPoints.map((point) => <li key={point}>{point}</li>)}</ul>
                      <p className="small mt-3 mb-0 fw-semibold text-center">{communityCharterClosing}</p>
                    </div>
                  )}
                </div>

                <button className="btn btn-primary w-100" onClick={handleRegister} disabled={!charterAccepted || !passwordValid}>
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
