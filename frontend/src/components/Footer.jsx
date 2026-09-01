import React, { useEffect, useState } from "react";
import { Heart, BookOpen, LogIn, UserRoundX, MessageCircle } from "lucide-react";
import MyBooksModal from "./mybooks/MyBooksModal";
import MessagesModal from "./messages/MessagesModal";
import api from "../api";


export default function Footer({ isLoggedIn, user = {}, onLoginToggle, onBookCreated, onBookUpdated, activeZone, activeZoneDocumentId }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showMyBooks, setShowMyBooks] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) {
      setUnreadMessages(0);
      return undefined;
    }
    const refreshUnread = () => api.get("/api/conversations/mine")
      .then((res) => setUnreadMessages((res.data.data || []).reduce((sum, item) => sum + (item.unreadCount || 0), 0)))
      .catch(() => {});
    refreshUnread();
    const timer = window.setInterval(refreshUnread, 5000);
    return () => window.clearInterval(timer);
  }, [isLoggedIn, user?.id]);
  const handleUserClick = () => {
    // If logged in, ask for confirmation before logout
    if (isLoggedIn) {
      setShowLogoutConfirm(true);
    } else {
      onLoginToggle(); // If not logged in, open login modal
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    onLoginToggle(); // trigger logout logic in parent
  };

  return (
    <>
      <footer
        className="bg-white border-top py-2 position-fixed bottom-0 w-100"
        style={{ zIndex: 1050 }}
      >
        <div className="container d-flex justify-content-around align-items-center">
          {/* Favorites (visible only when logged in) */}
          {isLoggedIn && (
            <button
              className="btn btn-link text-secondary d-flex flex-column align-items-center position-relative"
              style={{ textDecoration: "none" }}
              disabled
            >
              <Heart size={22} />
              <small>Favorites</small>
            </button>
          )}

          {isLoggedIn && (
            <button
              className="btn btn-link text-secondary d-flex flex-column align-items-center position-relative"
              style={{ textDecoration: "none" }}
              onClick={() => setShowMessages(true)}
            >
              <MessageCircle size={22} color="var(--bookmybook-navy)" />
              {unreadMessages > 0 && <span className="position-absolute translate-middle badge rounded-pill bg-danger" style={{ top: "5px", marginLeft: "25px" }}>{unreadMessages > 99 ? "99+" : unreadMessages}</span>}
              <small style={{ color: "var(--bookmybook-navy)" }}>Discussions</small>
            </button>
          )}

          {/* My Books (visible only when logged in) */}
          {isLoggedIn && (
            <button
              className="btn btn-link text-secondary d-flex flex-column align-items-center"
              style={{ textDecoration: "none" }}
              onClick={() => setShowMyBooks(true)}
            >
              <BookOpen size={22} color="var(--bookmybook-navy)" />
              <small style={{color:"var(--bookmybook-navy)"}}>My Books</small>
            </button>
          )}

          {/* Login / Logout */}
          <button
            className="btn btn-link text-secondary d-flex flex-column align-items-center"
            style={{ textDecoration: "none" }}
            onClick={handleUserClick}
          >
            {isLoggedIn ? (
              <>
                <UserRoundX size={22} color="var(--bookmybook-navy)" />
                <small style={{color:"var(--bookmybook-navy)"}}>{user?.username || "User"}</small>
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

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Logout</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowLogoutConfirm(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to disconnect?</p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* My Books Modal */}
      {showMyBooks && (
        <MyBooksModal
          show={showMyBooks}
          onClose={() => setShowMyBooks(false)}
          user={user} // pass the logged-in user object
          activeZone={activeZone}
          activeZoneDocumentId={activeZoneDocumentId}
          onBookCreated={onBookCreated}
          onBookUpdated={onBookUpdated}
        />
      )}
      <MessagesModal show={showMessages} onClose={() => setShowMessages(false)} user={user} onUnreadCountChange={setUnreadMessages} onBookUpdated={onBookUpdated} />
    </>
  );
}
