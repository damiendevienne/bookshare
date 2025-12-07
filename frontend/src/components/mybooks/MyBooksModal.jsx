import React, { useState, useEffect } from "react";
import BookRow from "./BookRow";
import axios from "axios";

export default function MyBooksModal({ show, onClose, user }) {
  const [books, setBooks] = useState([]);
  const [expandedBookId, setExpandedBookId] = useState(null);

  useEffect(() => {
    if (show) {
      axios
        .get(
          `http://localhost:1337/api/books?filters[owner][id][$eq]=${user.id}&populate=image`
        )
        .then((res) => {
          const booksData = res.data.data.map((item) => {
            const firstImage =
              item.image?.[0]?.formats?.thumbnail?.url ||
              item.image?.[0]?.url ||
              null;

            return {
              id: item.id,
              title: item.title,
              author: item.author,
              description: item.description,
              available: item.available,
              language: item.language,
              age: item.age,
              image: firstImage,
            };
          });
          setBooks(booksData);
        })
        .catch((err) => console.error(err));
    }
  }, [show, user.id]);

  if (!show) return null;

  const toggleAccordion = (bookId) => {
    setExpandedBookId((prev) => (prev === bookId ? null : bookId));
  };

  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
      tabIndex="-1"
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">My Books</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body">
            {books.length === 0 && <p>No books yet.</p>}

            <div className="accordion" id="booksAccordion">
              {books.map((book) => (
                <div className="accordion-item" key={book.id}>
                  <h2 className="accordion-header">
                    <button
                      className={`accordion-button ${
                        expandedBookId === book.id ? "" : "collapsed"
                      } ${expandedBookId === book.id ? "bg-light" : ""}`}
                      type="button"
                      onClick={() => toggleAccordion(book.id)}
                      aria-expanded={expandedBookId === book.id}
                    >
                      <BookRow book={book} />
                    </button>
                  </h2>

                  <div
                    id={`collapse-${book.id}`}
                    className={`accordion-collapse collapse ${
                      expandedBookId === book.id ? "show" : ""
                    }`}
                    data-bs-parent="#booksAccordion"
                  >
                    <div className="accordion-body">
                      <p><strong>Author:</strong> {book.author}</p>
                      <p><strong>Language:</strong> {book.language}</p>
                      <p><strong>Age:</strong> {book.age}</p>
                      <p><strong>Available:</strong> {book.available ? "Yes" : "No"}</p>

                      <div className="d-flex gap-2 mt-3">
                        <button className="btn btn-sm btn-primary">
                          Edit book details
                        </button>
                        <button className="btn btn-sm btn-danger">
                          Remove book
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
