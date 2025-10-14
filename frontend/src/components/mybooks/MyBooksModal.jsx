import React, { useState, useEffect } from "react";
import BookRow from "./BookRow";
import BookActionsModal from "./BookActionsModal";
import axios from "axios";

export default function MyBooksModal({ show, onClose, user }) {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    if (show) {
      axios
        .get(
          `http://localhost:1337/api/books?filters[owner][id][$eq]=${user.id}&populate=image`
        )
        .then((res) => {
          console.log(res)
          const booksData = res.data.data.map((item) => {
            const firstImage = item.image?.[0]?.formats?.thumbnail?.url
              || item.image?.[0]?.url
              || null; // fallback to null if no image
  
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

  return (
    <>
      <div
        className="modal fade show"
        style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
        tabIndex="-1"
        onClick={onClose}
      >
        <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">My Books</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              {books.length === 0 && <p>No books yet.</p>}
              {books.map((book) => (
                <BookRow key={book.id} book={book} onClick={setSelectedBook} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Book actions modal */}
      {selectedBook && (
        <BookActionsModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onUpdate={(updatedBook) => {
            setBooks((prev) =>
              prev.map((b) => (b.id === updatedBook.id ? updatedBook : b))
            );
            setSelectedBook(null);
          }}
        />
      )}
    </>
  );
}
