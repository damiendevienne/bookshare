import React from "react";
import { mediaUrl } from "../../api";

export default function BookRow({ book }) {
  return (
    <div
      className="d-flex align-items-center py-2 px-1 w-100"
      style={{ cursor: "pointer" }}
    >
      {/* Book image */}
      <img
        src={book.image ? mediaUrl(book.image) : book.coverUrl || "/images/open-book.png"}
        alt={book.title}
        style={{ width: 40, height: 60, objectFit: "cover", marginRight: 10 }}
      />

      {/* Author and title */}
      <div className="flex-grow-1">
        <div>{book.author}</div>
        <div className="fw-bold">{book.title}</div>
      </div>

      {/* Availability and borrower info */}
      <div
        className="text-end ms-2"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          paddingRight: "10px",
        }}
      >
        <span
          className={`badge ${book.available ? "bg-success" : "bg-secondary"}`}
          style={{
            fontSize: "0.7rem",
            minWidth: "80px",
            textAlign: "center",
          }}
        >
          {book.available ? "Available" : "Not available"}
        </span>

        {!book.available && book.lended && (
          <small
            className="text-muted mt-1"
            style={{ fontSize: "0.7rem" }}
          >
            Lended to {book.lendedTo || "another user"}
          </small>
        )}
      </div>
    </div>
  );
}
