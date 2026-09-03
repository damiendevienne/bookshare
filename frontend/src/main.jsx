import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import PasswordResetPage from "./components/PasswordResetPage.jsx";
import EmailConfirmedPage from "./components/EmailConfirmedPage.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";


const path = window.location.pathname;
const Root = path === "/reset-password" ? PasswordResetPage : path === "/email-confirmed" ? EmailConfirmedPage : App;
ReactDOM.createRoot(document.getElementById("root")).render(<Root />);

if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "bookmybook:push-notification") window.dispatchEvent(new Event("bookmybook:push-notification"));
  });
}
