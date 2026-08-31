import React, { useEffect, useState } from "react";
import { Globe2, LogOut, Moon, Sun, UserRound } from "lucide-react";

function applyTheme(theme) {
  document.body.classList.toggle("theme-dark", theme === "dark");
}

export default function SettingsModal({ show, onClose, isLoggedIn, user, onLoginToggle }) {
  const [language, setLanguage] = useState(() => localStorage.getItem("preferredLanguage") || "en");
  const [theme, setTheme] = useState(() => localStorage.getItem("preferredTheme") || "light");

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

  return (
    <div className="modal fade show settings-modal" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered modal-sm" onClick={(event) => event.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Settings</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close settings" />
          </div>
          <div className="modal-body">
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

            <div className="settings-account">
              <div className="settings-account-title"><UserRound size={17} /> Account</div>
              {isLoggedIn ? (
                <>
                  <div><strong>{user?.username || "User"}</strong></div>
                  {user?.email && <div className="text-muted small">{user.email}</div>}
                  {user?.id && <div className="text-muted small">Account ID: {user.id}</div>}
                  <button type="button" className="btn btn-outline-danger btn-sm mt-2" onClick={() => { onClose(); onLoginToggle?.(); }}><LogOut size={15} /> Log out</button>
                </>
              ) : (
                <>
                  <div className="text-muted small">You are not logged in.</div>
                  <button type="button" className="btn btn-primary btn-sm mt-2" onClick={() => { onClose(); onLoginToggle?.(); }}>Log in</button>
                </>
              )}
            </div>

            <div className="settings-extra text-muted small">
              <strong>More options</strong><br />Location and bug reports will be available here as the app grows.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
