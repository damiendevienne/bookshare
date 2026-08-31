import React from "react";
import { Settings } from "lucide-react";
import SettingsModal from "./SettingsModal";

export default function Header({ searchTerm, setSearchTerm, activeFilterCount, isLoggedIn, user, onLoginToggle }) {
  const [showSettings, setShowSettings] = React.useState(false);
  const [showRealisticLogo, setShowRealisticLogo] = React.useState(false);

  return (
    <header className="bg-white shadow-sm py-3 site-header">
      <div className="container text-center">
        <button
          type="button"
          className="settings-trigger"
          onClick={() => setShowSettings(true)}
          aria-label="Open settings"
          title="Settings"
        >
          <Settings size={21} />
        </button>
        {/*<h1 className="fs-3 mb-2">📚 BookShare Heraklion</h1>*/}
        <div className="text-center my-4 logo-stage">
          <button
            type="button"
            className="logo-flip"
            onClick={() => setShowRealisticLogo((current) => !current)}
            aria-label="Flip between BookMyBook logos"
            aria-pressed={showRealisticLogo}
          >
            <span className={`logo-flip-inner ${showRealisticLogo ? "is-flipped" : ""}`}>
              <img className="logo-flip-face logo-flip-front" src="/images/logomadi-elegant.png" alt="bookmybook logo" />
              <img className="logo-flip-face logo-flip-back" src="/images/logomadi-proposition-realiste.png" alt="bookmybook realistic logo" />
            </span>
          </button>
          <div className="logo-tagline">
            <span>Borrow and share physical books</span>
            <span>with people around you</span>
          </div>
        </div>
        <div className="d-flex justify-content-center align-items-center">
          <input
            type="text"
            className="form-control"
            style={{ maxWidth: "400px" }}
            placeholder="Search by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span
            className="ms-2 position-relative"
            style={{ cursor: "pointer" }}
            data-bs-toggle="offcanvas"
            data-bs-target="#filterCanvas"
            aria-controls="filterCanvas"
          >
            <img src="/images/filtre.png" alt="Filter" style={{ height: "24px" }} />

            {activeFilterCount > 0 && (
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-secondary"
                style={{ fontSize: "0.6rem", padding: "0.15em 0.3em" }}
              >
                {activeFilterCount}
              </span>
            )}
          </span>
        </div>
      </div>
      <SettingsModal
        show={showSettings}
        onClose={() => setShowSettings(false)}
        isLoggedIn={isLoggedIn}
        user={user}
        onLoginToggle={onLoginToggle}
      />
    </header>
  );
}
