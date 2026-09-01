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
