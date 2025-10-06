import React from "react";

export default function BookModal({ selectedBook, showModal, onClose }) {
  if (!showModal || !selectedBook) return null;

  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
      tabIndex="-1"
      onClick={onClose}
    >
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{selectedBook?.attributes?.title || "No title"}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <p>{selectedBook?.attributes?.description || "No description available"}</p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" disabled>
              Borrow this book
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
