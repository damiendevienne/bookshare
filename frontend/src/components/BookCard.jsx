import React from "react";
import { Heart } from "lucide-react";
import "../App.css";
import { mediaUrl } from "../api";

export default function BookCard({ bookData, onClick, isFavorite, onFavoriteToggle }) {
  const book = bookData.attributes || bookData;
  const images = book.image || [];
  const age = book.age || "Unknown";
  const language = book.language || "Unknown";
  const image = images[0];
  const imageUrl = image
    ? mediaUrl(image.formats?.small?.url || image.formats?.medium?.url || image.url || image.attributes?.url)
    : book.coverUrl || "/images/open-book.png";

  return (
    <div className="col-6 col-md-3"
      onClick={onClick}
      role="button"
      tabIndex="0"
      onKeyDown={(e) => { if (e.key === "Enter") onClick?.(); }}
      style={{ cursor: "pointer" }}
      aria-label={`Open details for ${book.title}`}
    >
      <div className="card h-100 shadow-sm book-card" style={{ fontSize: "0.85rem" }}>
        <div className="position-relative">
          <img
            src={imageUrl}
            className="d-block w-100"
            alt={book.title}
            style={{
              height: "180px",
              objectFit: "cover",
              borderRadius: "0.5rem 0.5rem 0 0",
            }}
          />

          <span className="badge bg-warning badge-overlay-top-right position-absolute">
            {language}
          </span>
          <span
            className={`badge badge-overlay-bottom-left position-absolute ${
              book.available ? "bg-success" : "bg-secondary"
            }`}
          >
            {book.available ? "Available" : "Not available"}
          </span>
          <span className="badge bg-primary badge-overlay-top-left position-absolute">
            {age}
          </span>
        </div>

        <div className="text-muted small px-2 mt-1">
          Owner:{" "}
            {book.owner?.username || "Unknown"}
        </div>
        <div className="card-body py-2 px-2">
          <h6 className="card-title mb-1 truncate-2">{book.title}</h6>
          <p className="card-text text-muted mb-1 truncate-2">{book.author}</p>
        </div>
        <button type="button" className={`book-favorite-button ${isFavorite ? "is-favorite" : ""}`} aria-label={isFavorite ? `Remove ${book.title} from favorites` : `Add ${book.title} to favorites`} aria-pressed={isFavorite} onClick={(event) => { event.stopPropagation(); onFavoriteToggle?.(); }} onKeyDown={(event) => event.stopPropagation()}>
          <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>
    </div>
  );
}
