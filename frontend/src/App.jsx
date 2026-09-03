import React, { useEffect, useState, useMemo } from "react";
import { HeartCrack } from "lucide-react";
import api from "./api";
import Header from "./components/Header";
import BookCard from "./components/BookCard";
import FilterPanel from "./components/FilterPanel";
import BookModal from "./components/BookModal";
import Footer from "./components/Footer";
import LoginModal from "./components/LoginModal";
import SiteFooter from "./components/SiteFooter";
import ZoneChooser from "./components/ZoneChooser";

import "./App.css";

function normalizeBookAvailability(bookEntry) {
  const book = bookEntry.attributes || bookEntry;
  const hasActiveLoan = (book.loans || []).some((loan) => loan.status === "active");
  if (!hasActiveLoan || book.available === false) return bookEntry;
  if (bookEntry.attributes) return { ...bookEntry, attributes: { ...book, available: false } };
  return { ...bookEntry, available: false };
}

function App() {
  const [books, setBooks] = useState([]);
  const [zones, setZones] = useState([]);
  const [activeZone, setActiveZone] = useState(() => {
    const pathZone = window.location.pathname.split("/")[1];
    return pathZone || localStorage.getItem("activeZone") || "heraklion";
  });
  const [showZoneChooser, setShowZoneChooser] = useState(() => !window.location.pathname.split("/")[1] && !localStorage.getItem("activeZone"));
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ age: "", available: "", language: "", owner: "" });
  const [sortOrder, setSortOrder] = useState("newest");
  const [favoriteBookIds, setFavoriteBookIds] = useState([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showModal, setShowModal] = useState(false);
  //login new const
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!sessionStorage.getItem("jwt")
  );
  const [showLogin, setShowLogin] = useState(() => new URLSearchParams(window.location.search).get("login") === "1");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [catalogueState, setCatalogueState] = useState("loading");
  const [user, setUser] = useState(
    JSON.parse(sessionStorage.getItem("user")) || null
  );

  useEffect(() => {
    document.body.classList.toggle("theme-dark", localStorage.getItem("preferredTheme") === "dark");
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) {
      setFavoriteBookIds([]);
      setFavoritesOnly(false);
      return;
    }
    api.get("/api/favorites")
      .then((response) => setFavoriteBookIds(response.data.data || []))
      .catch(() => setFavoriteBookIds([]));
  }, [isLoggedIn, user?.id]);

  useEffect(() => {
    if (!welcomeMessage) return undefined;
    const timer = window.setTimeout(() => setWelcomeMessage(""), 5000);
    return () => window.clearTimeout(timer);
  }, [welcomeMessage]);

  const handleLoginSuccess = (user) => {
    setIsLoggedIn(true);
    setUser(user);
    setWelcomeMessage(`Welcome, ${user?.username || "reader"}!`);
  };

  const handleLoginToggle = () => {
    if (isLoggedIn) {
      // Logout
      sessionStorage.removeItem("jwt");
      sessionStorage.removeItem("user");
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

  const toggleFavorite = async (bookEntry) => {
    if (!isLoggedIn) {
      setWelcomeMessage("Log in to add books to your favorites.");
      return;
    }
    const book = bookEntry?.attributes || bookEntry;
    const identifier = book?.documentId || book?.id;
    if (!identifier) return;
    const favoriteId = String(book.documentId || identifier);
    const wasFavorite = favoriteBookIds.includes(favoriteId);
    setFavoriteBookIds((current) => wasFavorite ? current.filter((id) => id !== favoriteId) : [...current, favoriteId]);
    try {
      const response = await api.post(`/api/books/${encodeURIComponent(identifier)}/favorite`);
      setFavoriteBookIds(response.data.data?.favoriteBookIds || []);
    } catch (error) {
      setFavoriteBookIds((current) => wasFavorite
        ? [...new Set([...current, favoriteId])]
        : current.filter((id) => id !== favoriteId));
      setWelcomeMessage(error.response?.data?.error?.message || "Unable to update favorites.");
    }
  };

  const catalogueUrl = `/api/books?populate=*&zone=${encodeURIComponent(activeZone)}`;

  const handleZoneChange = (slug) => {
    if (!slug) return;
    setActiveZone(slug);
    localStorage.setItem("activeZone", slug);
    window.history.pushState({}, "", `/${slug}`);
    setShowZoneChooser(false);
  };

  useEffect(() => {
    api.get("/api/zones")
      .then((response) => {
        const availableZones = response.data.data || [];
        setZones(availableZones);
        const active = availableZones.find((zone) => zone.slug === activeZone);
        if (availableZones.length && (!active || active.enabled === false)) {
          handleZoneChange(availableZones.find((zone) => zone.enabled !== false)?.slug || availableZones[0].slug);
        }
      })
      .catch(() => setZones([{ name: "Heraklion", slug: "heraklion" }]));
  }, [activeZone]);

  const handleBookCreated = () => {
    api
      .get(catalogueUrl)
      .then((res) => setBooks(res.data.data.map(normalizeBookAvailability)))
      .catch((err) => console.error("Unable to refresh the book catalogue:", err));
  };

  const handleBookUpdated = (bookIdentifier, nextAvailable) => {
    if (bookIdentifier && nextAvailable !== undefined) {
      setBooks((current) => current.map((entry) => {
        const book = entry.attributes || entry;
        if (book.id !== bookIdentifier && book.documentId !== bookIdentifier) return entry;
        return entry.attributes
          ? { ...entry, attributes: { ...book, available: nextAvailable } }
          : { ...entry, available: nextAvailable };
      }));
    }
    api
      .get(catalogueUrl)
      .then((res) => setBooks(res.data.data.map(normalizeBookAvailability)))
      .catch((err) => console.error("Unable to refresh the book catalogue:", err));
  };


  useEffect(() => {
    let cancelled = false;
    const refreshCatalogue = () => {
      api
        .get(catalogueUrl)
        .then((res) => {
          if (!cancelled) {
            setBooks(res.data.data.map(normalizeBookAvailability));
            setCatalogueState("ready");
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setCatalogueState(navigator.onLine ? "error" : "offline");
            console.error("Unable to refresh the book catalogue:", err);
          }
        });
    };

    const handleOffline = () => { if (!cancelled) setCatalogueState("offline"); };
    const handleOnline = () => { if (!cancelled) refreshCatalogue(); };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    refreshCatalogue();
    const timer = window.setInterval(refreshCatalogue, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [catalogueUrl]);


  // Compute counts only when books change
  const ownerCounts = useMemo(() => {
    const counts = {};
    books.forEach((b) => {
      const ownerId = b.attributes?.owner?.id || b.owner?.id;
      if (!ownerId) return;
      counts[ownerId] = (counts[ownerId] || 0) + 1;
    });
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

    const favoriteId = String(book.documentId || book.id || "");
    if (favoritesOnly && !favoriteBookIds.includes(favoriteId)) return false;
  
    return true;
  });
  const activeFilterCount = Object.values(filters).filter((v) => v).length;
  const sortedBooks = [...filteredBooks].sort((leftEntry, rightEntry) => {
    const left = leftEntry.attributes || leftEntry;
    const right = rightEntry.attributes || rightEntry;
    if (sortOrder === "title-asc") return String(left.title || "").localeCompare(String(right.title || ""), undefined, { sensitivity: "base" });
    if (sortOrder === "title-desc") return String(right.title || "").localeCompare(String(left.title || ""), undefined, { sensitivity: "base" });
    if (sortOrder === "author-asc") return String(left.author || "").localeCompare(String(right.author || ""), undefined, { sensitivity: "base" });
    return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
  });
  const libraryStats = useMemo(() => books.reduce((stats, entry) => {
    const book = entry.attributes || entry;
    stats.total += 1;
    if (book.available) stats.available += 1;
    if ((book.loans || []).some((loan) => loan.status === "active" && loan.borrowerReceivedAt && !loan.lenderReceivedBackAt)) {
      stats.onLoan += 1;
    }
    return stats;
  }, { total: 0, available: 0, onLoan: 0 }), [books]);
  const catalogueIsFiltered = Boolean(searchTerm.trim() || activeFilterCount || favoritesOnly);

  return (
    <>
      <Header
        isLoggedIn={isLoggedIn}
        user={user}
        onLoginToggle={handleLoginToggle}
        activeZone={activeZone}
        zones={zones}
        onZoneChange={handleZoneChange}
        welcomeMessage={welcomeMessage}
        onDismissWelcome={() => setWelcomeMessage("")}
      />
      <div className="catalog-sticky-controls">
        <div className="container">
          <div className="catalog-search-row">
            <input type="text" className="form-control" placeholder="Search by title or author..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
            <button type="button" className="catalog-filter-trigger position-relative" data-bs-toggle="offcanvas" data-bs-target="#filterCanvas" aria-controls="filterCanvas" aria-label="Open book filters">
              <img src="/images/filtre.png" alt="" aria-hidden="true" />
              {activeFilterCount > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-secondary">{activeFilterCount}</span>}
            </button>
          </div>
          <div className="library-summary" aria-live="polite">
            <span><strong>{catalogueIsFiltered ? `${sortedBooks.length}/${libraryStats.total}` : libraryStats.total}</strong> {catalogueIsFiltered ? "shown" : libraryStats.total === 1 ? "book" : "books"}</span>
            <span><strong>{libraryStats.available}</strong> available</span>
            <span><strong>{libraryStats.onLoan}</strong> on loan</span>
          </div>
        </div>
      </div>
      <FilterPanel filters={filters} setFilters={setFilters} />

      {catalogueState !== "ready" && (
        <div className="container pt-3">
          <div className={`alert ${catalogueState === "offline" ? "alert-warning" : "alert-danger"} d-flex align-items-center justify-content-between gap-3`} role="alert">
            <span>
              {catalogueState === "offline"
                ? "You appear to be offline. The book catalogue cannot be loaded right now."
                : catalogueState === "loading"
                ? "Loading the book catalogue…"
                : "The book catalogue could not be loaded. Please try again."}
            </span>
            {catalogueState !== "loading" && <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => window.location.reload()}>Try again</button>}
          </div>
        </div>
      )}

      <div className="container pt-3 pb-4">
        <div className="library-sort-row">
          {favoritesOnly && <button type="button" className="favorites-filter-chip" onClick={() => setFavoritesOnly(false)}>♥ Favorites only ×</button>}
          <label className="library-sort-label" htmlFor="library-sort">
            <span className="visually-hidden">Sort by</span>
            <select id="library-sort" className="form-select form-select-sm" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
              <option value="newest">Newest first</option>
              <option value="title-asc">Title: A–Z</option>
              <option value="title-desc">Title: Z–A</option>
              <option value="author-asc">Author: A–Z</option>
            </select>
          </label>
        </div>
        {favoritesOnly && sortedBooks.length === 0 && <div className="favorites-empty-state">
          <span className="favorites-empty-icon" aria-hidden="true"><HeartCrack size={34} strokeWidth={1.6} /></span>
          <strong>{favoriteBookIds.length === 0 ? "No favorites yet." : "No favorites match your current filters."}</strong>
          <span>{favoriteBookIds.length === 0 ? "Tap the heart on any book to save it to your favorites." : "Try changing your search or filters to see more of your saved books."}</span>
        </div>}
        <div className="row g-3" style={{ paddingBottom: "80px" }}>
          {sortedBooks.map((b) => (
            <BookCard
            key={b.id}
            bookData={b}
            isFavorite={favoriteBookIds.includes(String((b.attributes || b).documentId || (b.attributes || b).id))}
            onFavoriteToggle={() => toggleFavorite(b)}
            onClick={() => {
              setSelectedBook(b);
              setShowModal(true);
            }}
          />
          ))}
        </div>
      </div>
      <SiteFooter />

      {showZoneChooser && zones.length > 0 && (
        <ZoneChooser zones={zones} activeZone={activeZone} onSelect={handleZoneChange} />
      )}

      {/* Modal */}
      <BookModal
        selectedBook={selectedBook}
        showModal={showModal}
        onClose={() => setShowModal(false)}
        onFilterByOwner={handleFilterByOwner}
        ownerCounts={ownerCounts}
        isLoggedIn={isLoggedIn}
        user={user}
        onBorrowRequested={handleBookUpdated}
        isFavorite={favoriteBookIds.includes(String((selectedBook?.attributes || selectedBook)?.documentId || (selectedBook?.attributes || selectedBook)?.id || ""))}
        onFavoriteToggle={() => toggleFavorite(selectedBook)}
      />
      <Footer
        isLoggedIn={isLoggedIn}
        onLoginToggle={handleLoginToggle}
        user={user}
        onBookCreated={handleBookCreated}
        onBookUpdated={handleBookUpdated}
        activeZone={activeZone}
        activeZoneDocumentId={zones.find((zone) => zone.slug === activeZone)?.documentId}
        favoritesCount={favoriteBookIds.length}
        favoritesOnly={favoritesOnly}
        onToggleFavorites={() => setFavoritesOnly((current) => !current)}
      />
      <LoginModal
        show={showLogin}
        onClose={() => setShowLogin(false)}
        onLoginSuccess={handleLoginSuccess}
      />  </>
  );
}

export default App;
