import React from "react";

export default function BookRow({ book, onClick }) {
  return (
    <div
      className="d-flex align-items-center border-bottom py-2 px-1"
      style={{ cursor: "pointer" }}
      onClick={() => onClick(book)}
    >
      {/* Book image */}
      <img
        src={
          book.image
            ? "http://localhost:1337" + book.image
            : "/book-icon.png"
        }
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
        className="text-end me-2"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
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

        {!book.available && (
          <small
            className="text-muted mt-1"
            style={{ fontSize: "0.7rem" }}
          >
            Lended to xxx
          </small>
        )}
      </div>
    </div>
  );
}
