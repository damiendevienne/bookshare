import React from "react";

export default function Header({ searchTerm, setSearchTerm, activeFilterCount }) {
  return (
    <header className="sticky-top bg-white shadow-sm py-3">
      <div className="container text-center">
        {/*<h1 className="fs-3 mb-2">📚 BookShare Heraklion</h1>*/}
        <div className="text-center my-4">
          <img
            className="logo-img img-fluid"
            src="/images/logomadi.png"
            alt="App logo"
          />
          <div style={{ paddingTop: "10px" }}> Exchange books in your language with people around </div>
        </div>
        <div className="d-flex justify-content-center align-items-center">
          <input
            type="text"
            className="form-control"
            style={{ maxWidth: "400px" }}
            placeholder="Search by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span
            className="ms-2 position-relative"
            style={{ cursor: "pointer" }}
            data-bs-toggle="offcanvas"
            data-bs-target="#filterCanvas"
            aria-controls="filterCanvas"
          >
            <img src="/images/filtre.png" alt="Filter" style={{ height: "24px" }} />

            {activeFilterCount > 0 && (
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-secondary"
                style={{ fontSize: "0.6rem", padding: "0.15em 0.3em" }}
              >
                {activeFilterCount}
              </span>
            )}
          </span>
        </div>
      </div>
    </header>
  );
}
