// src/components/BookModal.jsx
import React from "react";
import { Modal, Button } from "react-bootstrap";

export default function BookModal({ show, onHide, book }) {
  if (!book) return null;

  const images = book.image || [];
  const language = book.language || "Unknown";
  const age = book.age || "Unknown";
  const available = book.available;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{book.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <img
          src={
            images.length > 0
              ? "http://localhost:1337" + (images[0].url || images[0].attributes?.url)
              : "/images/open-book.png"
          }
          alt={book.title}
          className="img-fluid mb-3"
        />
        <p><strong>Author:</strong> {book.author}</p>
        <p><strong>Language:</strong> {language}</p>
        <p><strong>Age:</strong> {age}</p>
        <p><strong>Availability:</strong> {available ? "Available" : "Not available"}</p>
        <hr />
        <p>{book.description || "No description available."}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
        <Button variant="primary" disabled>Borrow this book</Button>
      </Modal.Footer>
    </Modal>
  );
}
