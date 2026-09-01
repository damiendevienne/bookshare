import React, { useState } from "react";
import api from "../api";

export default function PasswordResetPage() {
  const code = new URLSearchParams(window.location.search).get("code") || "";
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!code) return setError("This reset link is invalid or incomplete.");
    if (password.length < 6) return setError("Your password must contain at least 6 characters.");
    if (password !== passwordConfirmation) return setError("The passwords do not match.");
    setSaving(true);
    try {
      await api.post("/api/auth/reset-password", { code, password, passwordConfirmation });
      setMessage("Your password has been changed. You can now log in.");
      setPassword("");
      setPasswordConfirmation("");
    } catch (err) {
      setError(err.response?.data?.error?.message || "This reset link is invalid or has expired.");
    } finally {
      setSaving(false);
    }
  };

  return <main className="container py-5 auth-page"><div className="row justify-content-center"><div className="col-12 col-md-6 col-lg-4"><div className="card shadow-sm"><div className="card-body p-4"><h1 className="h4 mb-3">Choose a new password</h1>{error && <div className="alert alert-danger">{error}</div>}{message && <div className="alert alert-success">{message}</div>}{!message && <form onSubmit={submit}><label className="form-label" htmlFor="new-password">New password</label><input id="new-password" className="form-control mb-3" type="password" minLength="6" required value={password} onChange={(event) => setPassword(event.target.value)} /><label className="form-label" htmlFor="confirm-password">Confirm password</label><input id="confirm-password" className="form-control mb-3" type="password" minLength="6" required value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} /><button className="btn btn-primary w-100" disabled={saving}>{saving ? "Saving…" : "Change password"}</button></form>}{message && <a className="btn btn-primary w-100" href="/">Back to BookMyBook</a>}</div></div></div></div></main>;
}
