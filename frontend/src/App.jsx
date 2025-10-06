import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "./components/Header";
import BookCard from "./components/BookCard";
import FilterPanel from "./components/FilterPanel";
import BookModal from "./components/BookModal";

import "./App.css";

function App() {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ age: "", available: "", language: "" });
  const [selectedBook, setSelectedBook] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    axios
      .get("http://localhost:1337/api/books?populate=*")
      .then((res) => setBooks(res.data.data))
      .catch((err) => console.error(err));
  }, []);

  const normalize = (str) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredBooks = books.filter((b) => {
    const book = b.attributes || b;
    const title = normalize(book.title || "");
    const author = normalize(book.author || "");
    const term = normalize(searchTerm);

    if (term && !title.includes(term) && !author.includes(term)) return false;
    if (filters.age && book.age !== filters.age) return false;
    if (filters.available) {
      if (filters.available === "yes" && !book.available) return false;
      if (filters.available === "no" && book.available) return false;
    }
    if (filters.language && book.language !== filters.language) return false;

    return true;
  });

  const activeFilterCount = Object.values(filters).filter((v) => v).length;

  return (
    <>
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activeFilterCount={activeFilterCount}
      />
      <FilterPanel filters={filters} setFilters={setFilters} />

      <div className="container py-4">
        <div className="row g-3">
          {filteredBooks.map((b) => (
            <BookCard
            key={b.id}
            bookData={b}
            onClick={() => {
              setSelectedBook(b);
              setShowModal(true);
            }}
          />
          ))}
        </div>
      </div>

      {/* Modal */}
      <BookModal
        selectedBook={selectedBook}
        showModal={showModal}
        onClose={() => setShowModal(false)}
      />    </>
  );
}

export default App;
