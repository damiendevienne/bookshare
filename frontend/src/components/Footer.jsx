import React from "react";
import { Heart, BookOpen, LogIn, UserRoundX } from "lucide-react";


export default function Footer({ isLoggedIn, user = {}, onLoginToggle }) {
  return (
    <footer
      className="bg-white border-top py-2 position-fixed bottom-0 w-100"
      style={{
        zIndex: 1050,
      }}
    >
      <div className="container d-flex justify-content-around align-items-center">
        {/* Favorites (visible only when logged in) */}
        {isLoggedIn && (
          <button
            className="btn btn-link text-secondary d-flex flex-column align-items-center"
            style={{ textDecoration: "none" }}
            disabled
          >
            <Heart size={22} />
            <small>Favorites</small>
          </button>
        )}

        {/* My Books (visible only when logged in) */}
        {isLoggedIn && (
          <button
            className="btn btn-link text-secondary d-flex flex-column align-items-center"
            style={{ textDecoration: "none" }}
            disabled
          >
            <BookOpen size={22} />
            <small>My Books</small>
          </button>
        )}

        {/* Login / Logout */}
        <button
          className="btn btn-link text-secondary d-flex flex-column align-items-center"
          style={{ textDecoration: "none" }}
          onClick={onLoginToggle}
        >
          {isLoggedIn ? (
            <>
              <UserRoundX size={22} color="#007bff"/>
              <small>{user?.username || "User"}</small>
            </>
          ) : (
            <>
              <LogIn size={22} />
              <small>Login</small>
            </>
          )}
        </button>
      </div>
    </footer>
  );
}
