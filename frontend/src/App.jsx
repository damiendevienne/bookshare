import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Header from "./components/Header";
import BookCard from "./components/BookCard";
import FilterPanel from "./components/FilterPanel";
import BookModal from "./components/BookModal";
import Footer from "./components/Footer";
import LoginModal from "./components/LoginModal";

import "./App.css";

function App() {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ age: "", available: "", language: "", owner: "" });
  const [selectedBook, setSelectedBook] = useState(null);
  const [showModal, setShowModal] = useState(false);
  //login new const
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("jwt")
  );
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  const handleLoginSuccess = (user, jwt) => {
    setIsLoggedIn(true);
    setUser(user);
  };

  const handleLoginToggle = () => {
    if (isLoggedIn) {
      // Logout
      localStorage.removeItem("jwt");
      localStorage.removeItem("user");
      setIsLoggedIn(false);
      setUser(null);
    } else {
      setShowLogin(true);
    }
  };

  const handleFilterByOwner = (ownerUsername) => {
    setFilters((prev) => ({ ...prev, owner: ownerUsername }));
    setShowModal(false); // close modal when user clicks on owner
  };


  useEffect(() => {
    axios
      .get("http://localhost:1337/api/books?populate=*")
      .then((res) => setBooks(res.data.data))
      .catch((err) => console.error(err));
  }, []);


  // Compute counts only when books change
  const ownerCounts = useMemo(() => {
    const counts = {};
    books.forEach((b) => {
      const ownerId = b.attributes?.owner?.id || b.owner?.id;
      if (!ownerId) return;
      counts[ownerId] = (counts[ownerId] || 0) + 1;
    });
    console.log("Owner counts is computed now");
    return counts;
  }, [books]);


  function normalize(str) {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // removes accents
  }

  const filteredBooks = books.filter((b) => {
    const book = b.attributes || b;
    const title = normalize(book.title || "");
    const author = normalize(book.author || "");
    const term = normalize(searchTerm);
  
    // Normalize owner name (for consistent comparison)
    const ownerName = normalize(book.owner?.username || "");
    const ownerFilter = normalize(filters.owner || "");
  
    // Search term logic
    if (term && !title.includes(term) && !author.includes(term)) return false;
  
    // Age filter
    if (filters.age && book.age !== filters.age) return false;
  
    // Availability filter
    if (filters.available) {
      if (filters.available === "yes" && !book.available) return false;
      if (filters.available === "no" && book.available) return false;
    }
  
    // Language filter
    if (filters.language && book.language !== filters.language) return false;
  
    // 🆕 Owner filter (accent & case insensitive + partial match)
    if (ownerFilter && !ownerName.includes(ownerFilter)) return false;
  
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
        <div className="row g-3" style={{ paddingBottom: "80px" }}>
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
        onFilterByOwner={handleFilterByOwner}
        ownerCounts={ownerCounts}
      />
      <Footer
        isLoggedIn={isLoggedIn}
        onLoginToggle={handleLoginToggle}
        user={user}
      />
      <LoginModal
        show={showLogin}
        onClose={() => setShowLogin(false)}
        onLoginSuccess={handleLoginSuccess}
      />  </>
  );
}

export default App;
