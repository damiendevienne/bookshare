import React, { useEffect, useState } from "react";
import api, { mediaUrl } from "../api";

export default function BookModal({ selectedBook, showModal, onClose, onFilterByOwner, ownerCounts, isLoggedIn, user, onBorrowRequested }) {
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [borrowing, setBorrowing] = useState(false);
  const [borrowError, setBorrowError] = useState("");
  const [loanStatus, setLoanStatus] = useState(null);

  const book = selectedBook?.attributes || selectedBook || {};
  const description = book.description;
  const owner = book.owner?.username || "Unknown";
  const images = book.image || [];

  const booksCount = ownerCounts?.[book.owner?.id] || 0;
  const bookIdentifier = selectedBook?.documentId || selectedBook?.id;
  const isOwner = user?.id && book.owner?.id === user.id;

  useEffect(() => {
    setLoanStatus(null);
    if (!showModal || !selectedBook || !isLoggedIn || !user?.id || isOwner || !bookIdentifier) return undefined;
    api.get(`/api/loans/status?bookId=${encodeURIComponent(bookIdentifier)}`)
      .then((res) => setLoanStatus(res.data.data?.status || null))
      .catch(() => {});
    return undefined;
  }, [showModal, selectedBook, isLoggedIn, user?.id, bookIdentifier, isOwner]);

  if (!showModal || !selectedBook) return null;

  const requestBorrow = async () => {
    setBorrowing(true);
    setBorrowError("");
    try {
      await api.post("/api/loans/request", { bookId: bookIdentifier });
      setLoanStatus("requested");
      onBorrowRequested?.();
    } catch (err) {
      setBorrowError(err.response?.data?.error?.message || "Unable to send the borrowing request.");
    } finally {
      setBorrowing(false);
    }
  };


  // Normalize description: handle string or rich blocks
  let renderedDescription = "No description available";
  if (Array.isArray(description)) {
    renderedDescription = description
      .map((block, i) => {
        if (block.type === "paragraph" && Array.isArray(block.children)) {
          const text = block.children.map((c) => c.text).join("");
          return <p key={i} style={{ marginBottom: "0.5rem" }}>{text}</p>;
        }
        return null;
      })
      .filter(Boolean);
  } else if (typeof description === "string") {
    renderedDescription = description
      .split("\n")
      .map((line, i) => (
        <p key={i} style={{ marginBottom: "0.5rem" }}>
          {line}
        </p>
      ));
  }

  return (
    <>
      {/* === MAIN BOOK MODAL === */}
      <div
        className="modal fade show"
        style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
        tabIndex="-1"
        onClick={onClose}
      >
        <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h5 className="modal-title">{book.title}</h5>
                <h6 className="modal-subtitle">{book.author}</h6>
                <small className="owner">
                  Proposed by{" "}
                  <span
                    style={{ cursor: "pointer", color: "var(--bookmybook-navy)" }}
                    onClick={() => setShowOwnerModal(true)}
                  >
                    {owner}
                  </span>
                </small>
              </div>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>

            <div className="modal-body">
              {images.length > 0 && (
                <div id="carouselBookImages" className="carousel slide mb-3" data-bs-ride="carousel">
                  <div className="carousel-inner">
                    {images.map((img, idx) => (
                      <div
                        className={`carousel-item ${idx === 0 ? "active" : ""}`}
                        key={idx}
                      >
                        <img
                          src={mediaUrl(img.url || img.attributes?.url)}
                          className="d-block w-100"
                          alt={book.title}
                          style={{ maxHeight: "400px", objectFit: "contain" }}
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    className="carousel-control-prev"
                    type="button"
                    data-bs-target="#carouselBookImages"
                    data-bs-slide="prev"
                  >
                    <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Previous</span>
                  </button>
                  <button
                    className="carousel-control-next"
                    type="button"
                    data-bs-target="#carouselBookImages"
                    data-bs-slide="next"
                  >
                    <span className="carousel-control-next-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Next</span>
                  </button>
                </div>
              )}

              <div className="mb-2">
                {book.age && <span className="badge bg-primary me-2">{book.age}</span>}
                {book.language && <span className="badge bg-warning">{book.language}</span>}
              </div>
              <hr />
              <div>{renderedDescription}</div>
            </div>

            <div className="modal-footer">
              {!isLoggedIn && (
                <small className="text-muted me-auto">
                  Please log in to borrow books.
                </small>
              )}
              {borrowError && <small className="text-danger me-auto">{borrowError}</small>}
              <button className="btn btn-primary" disabled={!isLoggedIn || !book.available || isOwner || borrowing || loanStatus === "requested" || loanStatus === "active"} onClick={requestBorrow}>
                {borrowing ? "Sending…" : loanStatus === "requested" ? "A request was sent to the owner" : loanStatus === "active" ? "Borrowing in progress" : book.available ? "Borrow this book" : "Currently unavailable"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* === OWNER INFO SMALL MODAL === */}
      {showOwnerModal && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(0,0,0,0.3)", // semi-transparent overlay
            padding: "2rem", // ensures modal does not touch screen edges
          }}
          tabIndex="-1"
          onClick={() => setShowOwnerModal(false)}
        >
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{
              margin: "auto", 
              marginTop: "auto", // pushes modal to bottom
              marginBottom: "2rem", // space from bottom
              maxWidth: "400px",
            }}
          >
            <div className="modal-content rounded-4 shadow-lg">
              <div className="modal-header border-0">
                <h5 className="modal-title">{owner}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowOwnerModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {book.owner?.createdAt && (
                  <p className="text-muted mb-2">
                    Member since {new Date(book.owner.createdAt).toLocaleDateString()}
                  </p>
                )}
                  <p>
                    {owner} is proposing <strong>{booksCount ?? "?"}</strong> {booksCount === 1 ? "book" : "books"} on the platform.
                  </p>                
                  <button
                  className="btn btn-outline-primary w-100"
                  onClick={() => {
                    setShowOwnerModal(false);
                    onClose(); // close book modal
                    onFilterByOwner(book.owner?.username);
                  }}
                >
                  See {booksCount === 1 ? "the book" : "the books"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
