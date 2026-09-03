import React, { useEffect, useState } from "react";
import { Globe2, LogOut, Mail, Moon, Sun, UserRound } from "lucide-react";
import api from "../api";

function applyTheme(theme) {
  document.body.classList.toggle("theme-dark", theme === "dark");
}

export default function SettingsModal({ show, onClose, isLoggedIn, user, onLoginToggle, activeZone, zones = [], onZoneChange }) {
  const [language, setLanguage] = useState(() => localStorage.getItem("preferredLanguage") || "en");
  const [theme, setTheme] = useState(() => localStorage.getItem("preferredTheme") || "light");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState("");

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("preferredTheme", theme);
  }, [theme]);

  if (!show) return null;

  const updateLanguage = (event) => {
    const nextLanguage = event.target.value;
    setLanguage(nextLanguage);
    localStorage.setItem("preferredLanguage", nextLanguage);
  };
  const sendFeedback = async (event) => {
    event.preventDefault();
    if (!feedback.trim() || feedbackSending) return;
    setFeedbackSending(true); setFeedbackStatus("");
    try {
      await api.post("/api/feedback", { message: feedback.trim() });
      setFeedback(""); setFeedbackOpen(false); setFeedbackStatus("Thanks — your message has been sent.");
    } catch (error) {
      setFeedbackStatus(error.response?.data?.error?.message || "Unable to send your message. Please try again.");
    } finally { setFeedbackSending(false); }
  };

  return (
    <div className="modal fade show settings-modal" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered modal-sm" onClick={(event) => event.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Settings</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close settings" />
          </div>
          <div className="modal-body">
            <div className="settings-account settings-field">
              <div className="settings-account-title"><UserRound size={17} /> Account</div>
              {isLoggedIn ? (
                <>
                  <div>Signed in as <strong>{user?.username || "User"}</strong></div>
                  {user?.email && <div className="text-muted small">{user.email}</div>}
                  <button type="button" className="btn btn-outline-danger btn-sm mt-2" onClick={() => { onClose(); onLoginToggle?.(); }}><LogOut size={15} /> Log out</button>
                </>
              ) : (
                <>
                  <div className="text-muted small">You are not logged in.</div>
                  <button type="button" className="btn btn-primary btn-sm mt-2" onClick={() => { onClose(); onLoginToggle?.(); }}>Log in</button>
                </>
              )}
            </div>
            <div className="settings-field">
              <label htmlFor="settings-zone">📍 Sharing area</label>
              <select id="settings-zone" className="form-select" value={activeZone || ""} onChange={(event) => onZoneChange?.(event.target.value)}>
                {zones.map((zone) => <option value={zone.slug} key={zone.slug} disabled={zone.enabled === false}>{zone.countryCode === "FR" ? "🇫🇷" : zone.countryCode === "GR" ? "🇬🇷" : "🌍"} {zone.name}{zone.enabled === false ? " · Coming soon" : ""}</option>)}
              </select>
              <small className="text-muted">Only books listed in this area are shown.</small>
            </div>

            <div className="settings-field">
              <label htmlFor="settings-language"><Globe2 size={17} /> Interface language</label>
              <select id="settings-language" className="form-select" value={language} onChange={updateLanguage}>
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="el">Ελληνικά</option>
              </select>
              <small className="text-muted">Your preference is saved for this device.</small>
            </div>

            <div className="settings-field">
              <span><Sun size={17} /> Theme</span>
              <div className="btn-group w-100" role="group" aria-label="Theme">
                <button type="button" className={`btn ${theme === "light" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setTheme("light")}><Sun size={16} /> Light</button>
                <button type="button" className={`btn ${theme === "dark" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setTheme("dark")}><Moon size={16} /> Dark</button>
              </div>
            </div>

            {isLoggedIn && <div className="settings-field">
              <div className="settings-account-title"><Mail size={17} /> Feedback</div>
              <p className="text-muted small mb-2">BookMyBook is under continuous development. If you spot a bug, a problematic behaviour or book, or have an idea for improvement, send us a message.</p>
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => { setFeedbackOpen((current) => !current); setFeedbackStatus(""); }}>{feedbackOpen ? "Cancel" : "Report a problem or suggest an improvement"}</button>
              {feedbackOpen && <form className="mt-2" onSubmit={sendFeedback}><textarea className="form-control mb-2" rows="4" maxLength="3000" value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Tell us what happened or what you would like to suggest…" required /><button type="submit" className="btn btn-primary btn-sm" disabled={feedbackSending || !feedback.trim()}>{feedbackSending ? "Sending…" : "Send message"}</button></form>}
              {feedbackStatus && <div className="text-muted small mt-2" role="status">{feedbackStatus}</div>}
            </div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
