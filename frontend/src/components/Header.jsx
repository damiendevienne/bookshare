import React from "react";
import { Settings } from "lucide-react";
import SettingsModal from "./SettingsModal";

export default function Header({ isLoggedIn, user, onLoginToggle, activeZone, zones, onZoneChange, welcomeMessage, onDismissWelcome }) {
  const [showSettings, setShowSettings] = React.useState(false);
  const [showRealisticLogo, setShowRealisticLogo] = React.useState(false);

  return (
    <header className="bg-white shadow-sm py-3 site-header">
      {welcomeMessage && (
        <div className="welcome-banner" role="status">
          <span>{welcomeMessage}</span>
          <button type="button" className="welcome-banner-close" aria-label="Dismiss" onClick={onDismissWelcome}>×</button>
        </div>
      )}
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
              <img className="logo-flip-face logo-flip-front" src="/images/logomadi-elegant-white.png" alt="bookmybook logo" />
              <img className="logo-flip-face logo-flip-back" src="/images/logomadi-back-white.png" alt="bookmybook lemur seen from behind" />
            </span>
          </button>
          <div className="logo-tagline">
            <span>Borrow and share physical books</span>
            <span>with people around you</span>
          </div>
        </div>
      </div>
      <SettingsModal
        show={showSettings}
        onClose={() => setShowSettings(false)}
        isLoggedIn={isLoggedIn}
        user={user}
        onLoginToggle={onLoginToggle}
        activeZone={activeZone}
        zones={zones}
        onZoneChange={onZoneChange}
      />
    </header>
  );
}
