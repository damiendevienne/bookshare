import React, { useState, useEffect } from "react";
import BookRow from "./BookRow";
import BookActionsModal from "./BookActionsModal";
import AddBookModal from "./AddBookModal";
import api from "../../api";

export default function MyBooksModal({ show, onClose, user, onBookCreated, onBookUpdated, activeZone, activeZoneDocumentId }) {
  const [books, setBooks] = useState([]);
  const [expandedBookId, setExpandedBookId] = useState(null);
  const [activeBook, setActiveBook] = useState(null);
  const [showAddBook, setShowAddBook] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (show) {
      api
        .get(
          `/api/books?filters[owner][id][$eq]=${user.id}&zone=${encodeURIComponent(activeZone || "heraklion")}&populate[0]=image&populate[1]=loans&populate[2]=loans.borrower`
        )
        .then((res) => {
          const booksData = res.data.data.map((item) => {
            const firstImage =
              item.image?.[0]?.formats?.small?.url ||
              item.image?.[0]?.formats?.medium?.url ||
              item.image?.[0]?.url ||
              null;

            return {
              id: item.id,
              documentId: item.documentId,
              title: item.title,
              author: item.author,
              description: item.description,
              available: item.available,
              lended: item.loans?.some((loan) => loan.status === "active") || false,
              lendedTo: item.loans?.find((loan) => loan.status === "active")?.borrower?.username || null,
              language: item.language,
              age: item.age,
              image: firstImage,
              images: item.image || [],
              imageRecords: item.image || [],
              catalogSource: item.catalogSource || null,
              coverUrl: item.coverUrl || null,
            };
          });
          setBooks(booksData);
        })
        .catch((err) => console.error(err));
    }
  }, [show, user?.id, refreshToken, activeZone]);

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
            <div className="text-center mb-3"><button type="button" className="btn btn-primary add-book-trigger" onClick={() => setShowAddBook(true)}>＋ Share a book</button></div>
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
                      <button className="btn btn-sm btn-outline-primary" onClick={() => setActiveBook(book)}>
                        Manage this book
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {activeBook && (
        <BookActionsModal
          book={activeBook}
          onClose={() => setActiveBook(null)}
          onUpdate={(updated) => {
            if (!updated) {
              setBooks((current) => current.filter((item) => (
                item.id !== activeBook.id && item.documentId !== activeBook.documentId
              )));
            } else {
              // Strapi can return either the numeric id or the documentId depending
              // on the endpoint/version. Match on both and merge the response into
              // the existing row so the badge updates without closing My Books.
              setBooks((current) => current.map((item) => {
                const sameBook =
                  (updated.id != null && item.id === updated.id) ||
                  (updated.documentId && item.documentId === updated.documentId) ||
                  item.id === activeBook.id ||
                  item.documentId === activeBook.documentId;
                return sameBook ? { ...item, ...updated, available: updated.available } : item;
              }));
              // Re-read the source of truth as well, keeping the local update
              // instantaneous while guarding against stale response shapes.
              setRefreshToken((value) => value + 1);
            }
            onBookUpdated?.();
            setActiveBook(null);
          }}
        />
      )}
      <AddBookModal
        show={showAddBook}
        onClose={() => setShowAddBook(false)}
        onCreated={(book) => {
          setRefreshToken((value) => value + 1);
          onBookCreated?.(book);
        }}
        zoneSlug={activeZone}
        zoneDocumentId={activeZoneDocumentId}
      />
    </div>
  );
}
